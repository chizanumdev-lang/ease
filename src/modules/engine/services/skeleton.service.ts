/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DayPlan } from '../../../programs/entities/day-plan.entity';
import { TaskShard } from '../entities/task-shard.entity';
import { AiService } from '../../../ai/ai.service';

export interface DaySkeleton {
  dayNumber: number;
  selectedShards: string[];  // exact shard names, one per category
  theme: string;
  focusAreas: string[];
  videoIntent: string;       // broad topic for YouTube search
  journalFocus: string;      // what aspect to prompt the user on
  difficultyArc: number;     // 1-10
}

@Injectable()
export class SkeletonService {
  private readonly logger = new Logger(SkeletonService.name);
  private readonly BATCH_SIZE = 7; // One week per AI call
  // TODO: consolidate to a single arc call once skeleton quality is validated —
  // one call gives the AI full visibility of the progression arc and is cheaper.

  constructor(
    @InjectRepository(DayPlan)
    private dayPlanRepository: Repository<DayPlan>,
    @InjectRepository(TaskShard)
    private shardRepository: Repository<TaskShard>,
    private aiService: AiService,
  ) {}

  /**
   * Generate a full program skeleton for all day plans.
   * Runs in 7-day batches so each AI call stays within token limits.
   * Week 1 failing is fatal (blocks program start).
   * Weeks 2+ failing are logged and re-queued — the adaptive fill fallback handles them.
   */
  async generateProgramSkeleton(
    programId: string,
    goal: string,
    duration: number,
    category: string,
    batchesToRun?: number[],
  ): Promise<void> {
    this.logger.log(
      `Generating program skeleton for program ${programId} (${duration} days, goal: "${goal}")`,
    );

    const shards = await this.shardRepository.find();
    const shardSummary = shards
      .map(
        (s) =>
          `- ${s.name} (Category: ${s.category.toUpperCase()}): ${s.description}. Uses: ${s.metadata?.uses?.join(', ') || 'general'}`,
      )
      .join('\n');

    const totalBatches = Math.ceil(duration / this.BATCH_SIZE);
    const batches = batchesToRun ?? Array.from({ length: totalBatches }, (_, i) => i);

    for (const batch of batches) {
      const startDay = batch * this.BATCH_SIZE + 1;
      const endDay = Math.min(startDay + this.BATCH_SIZE - 1, duration);
      const weekNumber = batch + 1;

      try {
        await this.generateWeekSkeleton(
          programId,
          goal,
          category,
          duration,
          startDay,
          endDay,
          weekNumber,
          shardSummary,
        );
        this.logger.log(
          `Skeleton Week ${weekNumber} (Days ${startDay}-${endDay}) generated for program ${programId}`,
        );
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);

        if (batch === 0) {
          // Week 1 is required — the user needs Day 1 content to start
          this.logger.error(
            `FATAL: Week 1 skeleton generation failed for program ${programId}: ${msg}`,
          );
          throw new Error(`Skeleton generation failed for Week 1: ${msg}`);
        }

        // Weeks 2+ are non-blocking — adaptive fill fallback handles them
        this.logger.warn(
          `Week ${weekNumber} skeleton failed for program ${programId} (Days ${startDay}-${endDay}): ${msg}. Days will use legacy generation fallback.`,
        );
      }
    }

    this.logger.log(
      `Skeleton generation complete for program ${programId}`,
    );
  }

  private async generateWeekSkeleton(
    programId: string,
    goal: string,
    category: string,
    totalDuration: number,
    startDay: number,
    endDay: number,
    weekNumber: number,
    shardSummary: string,
  ): Promise<void> {
    // Compute progression arc context for the AI
    const progressPercent = Math.round((startDay / totalDuration) * 100);
    const arcPhase =
      progressPercent < 25
        ? 'Foundation — introduce core concepts, keep it accessible'
        : progressPercent < 50
          ? 'Building — increase depth, start applying knowledge'
          : progressPercent < 75
            ? 'Challenge — push harder, tackle harder problems'
            : 'Mastery — consolidate, reflect, and elevate';

    const prompt = `
You are designing a learning program progression arc.

GOAL: "${goal}"
CATEGORY: ${category}
PROGRAM LENGTH: ${totalDuration} days
WEEK: ${weekNumber} (Days ${startDay}–${endDay})
ARC PHASE: ${arcPhase}

AVAILABLE TASK SHARDS:
${shardSummary}

TASK: Create a skeleton for Days ${startDay} to ${endDay}.
For each day, choose EXACTLY ONE shard from EACH of these 5 categories: video, audio, quiz, journal, consistency.
Design the difficulty arc so it naturally progresses through the week (Day ${startDay} = base, Day ${endDay} = peak of the week).
The themes should build on each other day to day — no random jumps.

OUTPUT SCHEMA:
Return ONLY a raw JSON array of ${endDay - startDay + 1} objects, one per day:
[
  {
    "dayNumber": ${startDay},
    "selectedShards": ["video-shard-name", "audio-shard-name", "quiz-shard-name", "journal-shard-name", "consistency-shard-name"],
    "theme": "Specific Day Theme (goal-focused, not generic)",
    "focusAreas": ["skill1", "skill2"],
    "videoIntent": "Broad YouTube topic for this day (e.g. 'French pronunciation basics for beginners')",
    "journalFocus": "What the user should reflect on today (e.g. 'moments when speaking felt unnatural')",
    "difficultyArc": 3
  },
  ...
]

RULES:
1. selectedShards MUST use exact shard names from the list above.
2. EXACTLY one shard per category per day.
3. difficultyArc must be an integer 1–10. Vary it across the week.
4. Theme must be specific to the goal, not generic filler.
5. videoIntent must be a real search topic a human would type into YouTube.
`.trim();

    const result = await this.aiService.generateCustomJson<any>(
      prompt,
      [],
    );

    let skeletons: DaySkeleton[] = [];
    if (Array.isArray(result)) {
      skeletons = result;
    } else if (result && typeof result === 'object' && Array.isArray(result.skeleton)) {
      skeletons = result.skeleton;
    } else if (result && typeof result === 'object' && Array.isArray(result.dayPlans)) {
      skeletons = result.dayPlans;
    } else if (result && typeof result === 'object' && Array.isArray(result.days)) {
      skeletons = result.days;
    }

    if (skeletons.length === 0) {
      throw new Error(`AI returned empty or unparseable skeleton for Week ${weekNumber}`);
    }

    // Validate and store each day's skeleton
    const dayPlans = await this.dayPlanRepository.find({
      where: { programId },
      select: ['id', 'dayNumber', 'skeletonStatus'],
    });

    const dayPlanMap = new Map(dayPlans.map((d) => [d.dayNumber, d]));

    const updates: Promise<any>[] = [];
    for (const skel of skeletons) {
      const day = dayPlanMap.get(skel.dayNumber);
      if (!day) {
        this.logger.warn(
          `Skeleton returned dayNumber ${skel.dayNumber} but no DayPlan found for program ${programId}`,
        );
        continue;
      }

      // Validate shard names exist
      const validShardNames = new Set(
        (await this.shardRepository.findBy({ name: In(skel.selectedShards) })).map(
          (s) => s.name,
        ),
      );
      const resolvedShards = skel.selectedShards.filter((name) =>
        validShardNames.has(name),
      );

      updates.push(
        this.dayPlanRepository.update(day.id, {
          skeleton: {
            selectedShards: resolvedShards,
            theme: skel.theme || `Day ${skel.dayNumber}`,
            focusAreas: skel.focusAreas || [],
            videoIntent: skel.videoIntent || goal,
            journalFocus: skel.journalFocus || 'today\'s progress',
            difficultyArc: Math.min(10, Math.max(1, skel.difficultyArc || 5)),
          },
          theme: skel.theme || `Day ${skel.dayNumber}`,
          skeletonStatus: 'ready',
        }),
      );
    }

    await Promise.all(updates);
  }
}
