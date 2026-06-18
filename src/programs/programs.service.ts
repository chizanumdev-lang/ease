import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { Task } from '../tasks/entities/task.entity';
import { AudioTrack } from '../audio/entities/audio-track.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { YoutubeService } from '../video/youtube/youtube.service';
import { AudioService } from '../audio/audio.service';
import { OrchestratorService } from '../modules/engine/services/orchestrator.service';
import { BackgroundService } from '../modules/worker/background.service';



@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);

  constructor(
    @InjectRepository(Program) private programRepository: Repository<Program>,
    @InjectRepository(DayPlan) private dayPlanRepository: Repository<DayPlan>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    @InjectRepository(AudioTrack)
    private audioTrackRepository: Repository<AudioTrack>,
    @InjectRepository(Quiz) private quizRepository: Repository<Quiz>,
    private youtubeService: YoutubeService,
    private audioService: AudioService,
    private orchestratorService: OrchestratorService,
    private backgroundService: BackgroundService,
  ) {}

  
  
  
  async findDayPlansByProgramId(programId: string): Promise<DayPlan[]> {
    return this.dayPlanRepository.find({
      where: { programId },
      select: ['id', 'dayNumber', 'skeletonStatus'],
    });
  }

  async updateDayPlanSkeleton(id: string, skeletonData: any): Promise<void> {
    await this.dayPlanRepository.update(id, skeletonData);
  }

  async findDayPlanById(id: string): Promise<DayPlan | null> {
    return this.dayPlanRepository.findOne({ where: { id }, relations: ['program'] });
  }

  async findDayPlanByProgramAndDay(programId: string, dayNumber: number): Promise<DayPlan | null> {
    return this.dayPlanRepository.findOne({ where: { programId, dayNumber } });
  }

  async lockDayPlan(dayPlanId: string): Promise<boolean> {
    const updateResult = await this.dayPlanRepository
      .createQueryBuilder()
      .update(DayPlan)
      .set({ status: 'generating', lockedAt: () => 'NOW()' })
      .where(
        "id = :id AND (status = 'pending' OR locked_at < NOW() - INTERVAL '5 minutes')",
        { id: dayPlanId },
      )
      .returning('id')
      .execute();
    return !!(updateResult && updateResult.affected && updateResult.affected > 0);
  }

  async updateDayPlanStatus(dayPlanId: string, status: string): Promise<void> {
    await this.dayPlanRepository.update(dayPlanId, { status });
  }

  async findProgramById(id: string): Promise<Program | null> {
    return this.programRepository.findOne({ where: { id } });
  }

  async saveProgram(program: Program): Promise<Program> {
    return this.programRepository.save(program);
  }

  async findActive(userId: string): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['goal'],
    });
    if (!program) throw new NotFoundException('No active program found');
    return program;
  }

  async findById(id: string, userId: string): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id, userId },
      relations: [
        'goal',
        'dayPlans',
        'dayPlans.tasks',
        'dayPlans.audioTracks',
        'dayPlans.quizzes',
      ],
      order: {
        dayPlans: {
          dayNumber: 'ASC',
        },
      },
    });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async deleteProgram(id: string, userId: string): Promise<void> {
    const result = await this.programRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Program not found or already deleted');
    }
  }

  async getTodaysPlan(programId: string, userId: string) {
    const program = await this.programRepository.findOne({
      where: { id: programId, userId },
      relations: ['goal'],
    });
    if (!program) throw new NotFoundException('Program not found');

    const startDate = new Date(program.createdAt);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const dayNumber = Math.min(Math.max(diffDays + 1, 1), program.duration);

    let plan = await this.dayPlanRepository.findOne({
      where: { program: { id: programId, userId }, dayNumber },
      relations: ['tasks', 'audioTracks', 'quizzes'],
      order: { tasks: { scheduledAt: 'ASC' } },
    });

    if (!plan)
      throw new NotFoundException(`No plan available for day ${dayNumber}`);

    if (plan.status === 'generating') {
      const isStalled =
        Date.now() - new Date(plan.updatedAt).getTime() > 2 * 60 * 1000;
      if (isStalled) {
        this.logger.warn(
          `Day ${dayNumber} stalled in generating. Resetting to pending.`,
        );
        plan.status = 'pending';
        await this.dayPlanRepository.save(plan);
      }
    }

    if (
      (plan.status === 'ready' && (!plan.tasks || plan.tasks.length === 0)) ||
      plan.status === 'failed'
    ) {
      this.logger.warn(
        `Day ${dayNumber} is marked '${plan.status}' but has 0 tasks. Resetting to pending for re-hydration.`,
      );
      plan.status = 'pending';
      await this.dayPlanRepository.save(plan);
    }

    if (plan.status === 'pending') {
      this.logger.log(
        `Day ${dayNumber} is pending. Triggering lazy hydration.`,
      );
      const goalText = program.goal?.description || 'Goal';

      try {
        const handle = await this.backgroundService.triggerHydrateDay({
          dayPlanId: plan.id,
          goalText,
          params: { ...program.metadata, duration: program.duration },
        });

        if (!handle) {
          this.logger.warn(
            `Background queue unavailable, hydrating Day ${dayNumber} locally and waiting for completion`,
          );
          await this.orchestratorService.orchestrateDay(plan.id, goalText);

          plan = await this.dayPlanRepository.findOne({
            where: { id: plan.id },
            relations: ['tasks', 'audioTracks', 'quizzes'],
            order: { tasks: { scheduledAt: 'ASC' } },
          });

          if (!plan)
            throw new NotFoundException(`Day plan vanished during hydration`);
        }
      } catch (err) {
        this.logger.error(`Hydration failed: ${(err as Error).message}`);
      }
    }

    const safePlan = plan!;

    const rings = {
      morning:
        safePlan.audioTracks?.some(
          (t) => t.type === 'morning' && t.url && !t.url.includes('generating'),
        ) || false,
      tasks:
        safePlan.tasks?.length > 0 && safePlan.tasks.every((t) => t.completed),
      night:
        safePlan.audioTracks?.some(
          (t) => t.type === 'night' && t.url && !t.url.includes('generating'),
        ) || false,
    };

    return {
      ...safePlan,
      masteryScore: program.masteryScore,
      competenceLevel: program.competenceLevel,
      todayRings: rings,
    };
  }

  async getProgramStatus(id: string) {
    const program = await this.programRepository.findOne({
      where: { id },
      select: ['id', 'status'],
    });
    if (!program) throw new NotFoundException('Program not found');

    const days = await this.dayPlanRepository.find({
      where: { programId: id },
      select: ['id', 'dayNumber', 'status', 'theme'],
      order: { dayNumber: 'ASC' },
    });

    return {
      programStatus: program.status,
      days: days.map((d) => ({
        dayNumber: d.dayNumber,
        status: d.status,
        theme: d.theme,
      })),
    };
  }

}
