import { DayPlan } from '../../../programs/entities/day-plan.entity';
import { ProgramsService } from '../../../programs/programs.service';
import { TasksService } from '../../../tasks/tasks.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BackgroundService } from '../../worker/background.service';
import { TaskShard } from '../entities/task-shard.entity';
import { Task } from '../../../tasks/entities/task.entity';
import { AiPromptingService, AiDraftTask } from './ai-prompting.service';
import { MediaHydrationService } from './media-hydration.service';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    @InjectRepository(TaskShard)
    private shardRepository: Repository<TaskShard>,
    private tasksService: TasksService,
    private programsService: ProgramsService,
    private backgroundService: BackgroundService,
    private aiPromptingService: AiPromptingService,
    private mediaHydrationService: MediaHydrationService,
  ) {}

  /**
   * STAGE 1: Early Orchestration
   * This should be called as soon as the user enters their goal in the wizard.
   */
  async orchestrateDay(dayPlanId: string, goal: string): Promise<void> {
    this.logger.log(`Starting Pipeline Orchestration for DayPlan ${dayPlanId}`);

    // Atomic lock to prevent race conditions
    const locked = await this.programsService.lockDayPlan(dayPlanId);

    if (!locked) {
      this.logger.warn(
        `DayPlan ${dayPlanId} is currently locked or already processing. Skipping duplicate orchestration call.`,
      );
      return;
    }

    const dayPlan = await this.programsService.findDayPlanById(dayPlanId);
    if (!dayPlan) throw new Error('DayPlan not found');

    try {
      // Clean up any existing tasks
      await this.tasksService.deleteByDayPlanId(dayPlanId);

      // ── PHASE: BLUEPRINTING ──────────────────────────────────────────────
      // Branch: use skeleton (adaptive fill) if available, otherwise fall back
      // to legacy full-generation path.
      let blueprint: AiDraftTask[];

      if (dayPlan.skeletonStatus === 'ready' && dayPlan.skeleton) {
        this.logger.log(
          `DayPlan ${dayPlanId} has skeleton — using adaptive fill path (Day ${dayPlan.dayNumber})`,
        );
        blueprint = await this.aiPromptingService.adaptiveFillFromSkeleton(dayPlan, goal);
      } else {
        this.logger.log(
          `DayPlan ${dayPlanId} has no skeleton — using legacy full-generation path (Day ${dayPlan.dayNumber})`,
        );
        blueprint = await this.aiPromptingService.generateDayBlueprint(
          dayPlan.dayNumber,
          goal,
          dayPlan.programId,
        );
      }

      // ── BUG FIX #1: Guard against empty blueprint ────────────────────────
      // If the AI returns an empty array (malformed response, rate-limit, etc.)
      // we must NOT proceed — doing so marks the day 'ready' with 0 tasks.
      // Reset to 'pending' so getTodaysPlan lazy-hydration can retry next call.
      if (!blueprint || blueprint.length === 0) {
        this.logger.error(
          `Blueprint generation returned 0 tasks for DayPlan ${dayPlanId}. Resetting to pending for retry.`,
        );
        await this.programsService.updateDayPlanStatus(dayPlanId, 'pending');
        return;
      }

      // ── PHASE: SHELL CREATION ────────────────────────────────────────────
      const shards = await this.shardRepository.find();
      const tasks: Task[] = [];

      for (let i = 0; i < blueprint.length; i++) {
        const draft = blueprint[i];
        const shard = this.aiPromptingService.resolveShard(draft, shards);
        const { mobileType, pattern } = this.aiPromptingService.detectPattern(shard);

        const taskData = {
          dayPlanId: dayPlan.id,
          type: mobileType,
          title: draft.title || shard.displayName,
          description: draft.description || shard.description,
          duration: shard.typicalDurationMinutes || 10,
          order: i,
          metadata: {
            ...draft,
            pattern,
            shardId: shard.id,
            status: 'hydrating' as any,
          },
        };
        tasks.push(await this.tasksService.createTask(taskData));
      }

      // ── PHASE: HYDRATION ─────────────────────────────────────────────────
      await this.hydrateDayResources(tasks, goal, dayPlan.id, dayPlan)
        .catch(async (err) => {
          this.logger.error(
            `Background Hydration Failed for DayPlan ${dayPlan.id}: ${err.message}`,
          );
          // Reset to pending so the next request retries instead of staying broken
          await this.programsService.updateDayPlanStatus(dayPlanId, 'pending');
        })
        .finally(async () => {
          const program = await this.programsService.findProgramById(dayPlan.programId);
          if (program && program.status === 'generating') {
            program.status = 'ready';
            await this.programsService.saveProgram(program);
            this.logger.log(
              `Program ${program.id} marked as READY after hydration attempt.`,
            );
          }
        });

      this.logger.log(
        `Blueprint created for ${dayPlan.id}. Hydration completed.`,
      );
    } catch (e) {
      const err = e as Error;
      this.logger.error(
        `Orchestration failed for DayPlan ${dayPlanId}: ${err.message}`,
      );
      // ── BUG FIX #2: Reset to pending on exception so retry is possible ───
      // Previously this set status to 'failed' AND program to 'ready', which
      // meant the lazy-hydration guard in getTodaysPlan would never re-trigger.
      await this.programsService.updateDayPlanStatus(dayPlanId, 'pending');

      const program = await this.programsService.findProgramById(dayPlan.programId);
      // BUG FIX #3: Only mark program ready if it actually succeeded.
      // On a true exception, leave it as-is so polling keeps trying.
      if (program && program.status === 'generating') {
        // Don't touch — let the poll detect it's stuck and retry
        this.logger.warn(
          `Orchestration failed — leaving program ${program.id} in generating state for retry.`,
        );
      }

      throw err;
    }
  }

  private async hydrateDayResources(
    tasks: Task[],
    goal: string,
    dayPlanId: string,
    dayPlan?: DayPlan,
  ) {
    let pastVideoIds: string[] = [];
    if (dayPlan) {
      try {
        pastVideoIds = await this.tasksService.findPastVideoTaskIds(dayPlan.programId, dayPlan.dayNumber);
      } catch (e) {
        this.logger.warn(
          `Failed to fetch past video IDs for deduplication: ${e}`,
        );
      }
    }

    await Promise.all(
      tasks.map(async (task) => {
        try {
          await this.mediaHydrationService.hydrateSingleTask(
            task,
            goal,
            dayPlanId,
            pastVideoIds,
          );

          if (task.metadata) {
            task.metadata.status = 'ready';
          }
          await this.tasksService.saveTask(task);
        } catch (e) {
          const err = e as Error;
          this.logger.error(
            `Failed to hydrate task ${task.id}: ${err.message}`,
          );
          if (task.metadata) {
            task.metadata.status = 'error';
          }
          await this.tasksService.saveTask(task);
        }
      }),
    );

    // Mark DayPlan as ready
    await this.programsService.updateDayPlanStatus(dayPlanId, 'ready');

    // Record progress so the 8pm scheduler knows which day was last hydrated.
    // We do NOT chain immediately (user hasn't journaled yet — no context for adaptive fill).
    // EXCEPTION: Day 1 chains to Day 2 immediately since there's no journal to lose.
    if (dayPlan) {
      const program = await this.programsService.findProgramById(dayPlan.programId);
      if (program) {
        const currentLastHydrated = program.metadata?.lastHydratedDay ?? 0;
        if (dayPlan.dayNumber > currentLastHydrated) {
          program.metadata = { ...(program.metadata || {}), lastHydratedDay: dayPlan.dayNumber };
          await this.programsService.saveProgram(program);
        }

        // Chain Day 2 immediately after Day 1 — no journal context to lose yet
        if (dayPlan.dayNumber === 1 && 2 <= program.duration) {
          const day2 = await this.programsService.findDayPlanByProgramAndDay(program.id, 2);
          if (day2 && day2.status === 'pending') {
            this.logger.log(
              `Day 1 complete — immediately chaining Day 2 hydration for program ${program.id}`,
            );
            const handle = await this.backgroundService.triggerHydrateDay({
              dayPlanId: day2.id,
              goalText: goal,
              params: {
                ...(program.metadata || {}),
                duration: program.duration,
              },
            });
            if (!handle) {
              this.logger.warn(
                `Background queue unavailable — hydrating Day 2 synchronously`,
              );
              this.orchestrateDay(day2.id, goal).catch((e) =>
                this.logger.error(
                  `Day 2 sync hydration failed: ${e instanceof Error ? e.message : String(e)}`,
                ),
              );
            }
          }
        }
      }
    }
  }
}
