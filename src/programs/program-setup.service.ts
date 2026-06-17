import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { Goal } from '../goals/entities/goal.entity';
import { GenerateProgramDto } from './dto/generate-program.dto';
import { UsersService } from '../users/users.service';
import { AiService } from '../ai/ai.service';
import { AudioService } from '../audio/audio.service';
import { OrchestratorService } from '../modules/engine/services/orchestrator.service';
import { SkeletonService } from '../modules/engine/services/skeleton.service';
import { BackgroundService } from '../modules/worker/background.service';

@Injectable()
export class ProgramSetupService {
  private readonly logger = new Logger(ProgramSetupService.name);

  constructor(
    @InjectRepository(Program) private programRepository: Repository<Program>,
    @InjectRepository(DayPlan) private dayPlanRepository: Repository<DayPlan>,
    @InjectRepository(Goal) private goalRepository: Repository<Goal>,
    private usersService: UsersService,
    private aiService: AiService,
    private audioService: AudioService,
    private orchestratorService: OrchestratorService,
    private skeletonService: SkeletonService,
    private backgroundService: BackgroundService,
  ) {}

  async initiateDraft(
    userId: string,
    goalDescription: string,
    category: string,
  ): Promise<any> {
    this.logger.log(
      `Initiating draft program for user ${userId}: "${goalDescription}"`,
    );
    const goalTitle = goalDescription.split('.')[0].substring(0, 50);
    const goal = this.goalRepository.create({
      userId,
      title: goalTitle,
      description: goalDescription,
      category,
    });
    const savedGoal = await this.goalRepository.save(goal);

    const program = this.programRepository.create({
      userId,
      goalId: savedGoal.id,
      title: goalTitle,
      description: `Journey into ${goalTitle}`,
      status: 'generating',
      duration: 30,
    });
    const savedProgram = await this.programRepository.save(program);

    const day1 = this.dayPlanRepository.create({
      programId: savedProgram.id,
      dayNumber: 1,
      theme: 'Day 1: Initiation',
      status: 'pending',
    });
    const savedDay1 = await this.dayPlanRepository.save(day1);

    const handle = await this.backgroundService.triggerHydrateDay({
      dayPlanId: savedDay1.id,
      goalText: goalDescription,
      params: {},
    });
    if (!handle) {
      this.logger.warn(
        `Background queue unavailable, hydrating early Day 1 locally`,
      );
      this.orchestratorService
        .orchestrateDay(savedDay1.id, goalDescription)
        .catch((err: any) =>
          this.logger.error(
            `Early orchestration failed for Day 1: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
    }

    this.backgroundService
      .triggerProgramRituals({ programId: savedProgram.id })
      .catch((err) =>
        this.logger.error(`Failed to trigger program rituals: ${err.message}`),
      );

    return {
      goalId: savedGoal.id,
      programId: savedProgram.id,
      dayPlanId: savedDay1.id,
    };
  }

  async getProgramPreview(
    userId: string,
    dto: GenerateProgramDto,
  ): Promise<any> {
    let goalText = dto.goalDescription || '';
    if (dto.goalId) {
      const goal = await this.goalRepository.findOne({
        where: { id: dto.goalId, userId },
      });
      if (goal) goalText = goal.description || goal.title;
    }
    if (!goalText) goalText = dto.category || 'Self Improvement';

    const options = {
      duration: dto.duration,
      minutesPerDay: dto.minutesPerDay,
      learningStyle: dto.learningStyle,
      constraints: dto.constraints,
      category: dto.category,
    };
    return this.aiService.generateProgramPreview(goalText, options);
  }

  async generateProgram(
    userId: string,
    generateProgramDto: GenerateProgramDto,
  ): Promise<Program> {
    const {
      goalId,
      duration = 30,
      minutesPerDay = 30,
      learningStyle = 'mixed',
      constraints = [],
    } = generateProgramDto;
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, userId },
    });
    if (!goal) throw new NotFoundException('Goal not found');

    const user = await this.usersService.findById(userId);
    const sleepStart = user.settings?.sleepWindow?.start || '23:00';
    const wakeStart = user.settings?.sleepWindow?.end || '07:00';

    const existingPrograms = await this.programRepository.find({
      where: { userId },
      relations: ['ritualTracks', 'dayPlans', 'dayPlans.audioTracks'],
    });

    for (const existingProgram of existingPrograms) {
      this.logger.log(
        `Deleting existing program ${existingProgram.id} for user ${userId} to enforce one-program rule`,
      );
      if (existingProgram.ritualTracks) {
        for (const rt of existingProgram.ritualTracks) {
          if (rt.url)
            await this.audioService
              .deleteFromCloudinary(rt.url)
              .catch((e) => this.logger.error('Failed to delete ritual', e));
        }
      }
      if (existingProgram.dayPlans) {
        for (const dp of existingProgram.dayPlans) {
          if (dp.audioTracks) {
            for (const at of dp.audioTracks) {
              if (at.url)
                await this.audioService
                  .deleteFromCloudinary(at.url)
                  .catch((e) =>
                    this.logger.error('Failed to delete audio track', e),
                  );
            }
          }
        }
      }
      await this.programRepository.remove(existingProgram);
    }

    const programTitle = generateProgramDto.metadata?.title || goal.title;
    const programDesc = `A ${duration}-day ${learningStyle} program for ${goal.title}. Daily commitment: ${minutesPerDay} min.`;
    const program = this.programRepository.create({
      title: programTitle,
      description: programDesc,
      duration,
      goalId,
      userId,
      status: 'generating',
      metadata: {
        ...generateProgramDto.metadata,
        minutesPerDay,
        learningStyle,
        constraints,
      },
    });
    await this.programRepository.save(program);

    const newDayShells = Array.from({ length: duration }, (_, i) => i + 1).map(
      (n) =>
        this.dayPlanRepository.create({
          dayNumber: n,
          theme: `Day ${n}`,
          programId: program.id,
          status: 'pending',
        }),
    );
    if (newDayShells.length > 0)
      await this.dayPlanRepository.save(newDayShells);

    this.logger.log(`Dispatching background job to generate program ${program.id}`);
    const jobId = await this.backgroundService.triggerGenerateProgram({
      userId,
      programId: program.id,
      goalId: goalId || '',
      generateProgramDto,
      wakeStart,
      sleepStart,
    });

    if (!jobId) {
      this.logger.error(`Failed to dispatch generateProgram to BullMQ for ${program.id}`);
    }

    return program;
  }

  async processGenerateProgramJob(payload: {
    userId: string;
    programId: string;
    goalId: string;
    generateProgramDto: any;
    wakeStart: string;
    sleepStart: string;
  }) {
    const { programId, goalId, generateProgramDto, wakeStart, sleepStart } = payload;
    const { duration = 30, minutesPerDay = 30, learningStyle = 'mixed', constraints = [] } = generateProgramDto;

    const program = await this.programRepository.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException('Program not found in processGenerateProgramJob');
    
    const goal = await this.goalRepository.findOne({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found in processGenerateProgramJob');

    try {
      this.logger.log(
        `Generating program skeleton for Week 1 (Days 1-7) for program ${program.id}`,
      );
      try {
        await this.skeletonService.generateProgramSkeleton(
          program.id,
          goal.description || goal.title || 'Goal',
          duration,
          goal.category || 'general',
          [0],
        );
      } catch (err: any) {
        this.logger.error(
          `Skeleton generation failed for Week 1: ${err instanceof Error ? err.message : String(err)}. Falling back to legacy per-day generation.`,
        );
      }

      const day1 = await this.dayPlanRepository.findOne({
        where: { programId: program.id, dayNumber: 1 },
      });
      const generationParams = {
        duration,
        minutesPerDay,
        learningStyle,
        constraints,
        category: goal.category,
        wakeStart,
        sleepStart,
        goalText: goal.description || goal.title || 'Goal',
      };

      if (day1 && day1.status !== 'ready') {
        this.logger.log(
          `Hydrating Day 1 in background for instant first-run availability`,
        );
        try {
          await this.orchestratorService.orchestrateDay(
            day1.id,
            generationParams.goalText,
          );
          program.status = 'ready';
          await this.programRepository.save(program);
        } catch (err: any) {
          this.logger.error(
            `Background hydration for Day 1 failed: ${err instanceof Error ? err.message : String(err)}`,
          );
          program.status = 'generating';
          await this.programRepository.save(program);
        }
      } else {
        program.status = 'ready';
        await this.programRepository.save(program);
      }

      const day2 = await this.dayPlanRepository.findOne({
        where: { programId: program.id, dayNumber: 2 },
      });
      if (day2 && day2.status === 'pending') {
        const handle = await this.backgroundService.triggerHydrateDay({
          dayPlanId: day2.id,
          goalText: generationParams.goalText,
          params: generationParams,
        });
        if (!handle) {
          this.logger.warn(`Background queue unavailable for Day 2`);
        }
      }

      const totalBatches = Math.ceil(duration / 7);
      if (totalBatches > 1) {
        this.logger.log(
          `Generating program skeleton for remaining weeks (Weeks 2+) for program ${program.id}`,
        );
        const remainingBatches = Array.from(
          { length: totalBatches - 1 },
          (_, i) => i + 1,
        );
        try {
          await this.skeletonService.generateProgramSkeleton(
            program.id,
            goal.description || goal.title || 'Goal',
            duration,
            goal.category || 'general',
            remainingBatches,
          );
        } catch (err: any) {
          this.logger.error(
            `Skeleton generation failed for Weeks 2+: ${err instanceof Error ? err.message : String(err)}.`,
          );
        }
      }
    } catch (err: any) {
      this.logger.error(`Fatal background orchestration error: ${err.message}`);
      throw err;
    }
  }
}
