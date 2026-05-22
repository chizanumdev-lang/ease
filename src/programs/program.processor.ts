import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { Task } from '../tasks/entities/task.entity';
import { AudioTrack } from '../audio/entities/audio-track.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { AiService } from '../ai/ai.service';
import { YoutubeService } from '../video/youtube/youtube.service';
import { ProgramsService } from './programs.service';

@Processor('program-generation', {
  concurrency: 2,
  lockDuration: 300000,
})
@Injectable()
export class ProgramProcessor extends WorkerHost {
  private readonly logger = new Logger(ProgramProcessor.name);
  private readonly isVercel = !!process.env.VERCEL;

  constructor(
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(DayPlan)
    private dayPlanRepository: Repository<DayPlan>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(AudioTrack)
    private audioTrackRepository: Repository<AudioTrack>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectQueue('audio-generation')
    private audioQueue: Queue,
    private aiService: AiService,
    private youtubeService: YoutubeService,
    private programsService: ProgramsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (this.isVercel) {
      this.logger.warn(
        `Skipping program job ${job.id} on Vercel serverless — needs dedicated worker`,
      );
      return { success: false, reason: 'serverless_skip' };
    }
    const { dayPlanId, goalText, params } = job.data;

    if (job.name === 'hydrate-day') {
      this.logger.log(
        `Hydrating DayPlan ${dayPlanId} [Attempt ${job.attemptsMade + 1}]`,
      );

      const day = await this.dayPlanRepository.findOne({
        where: { id: dayPlanId },
        relations: ['program'],
      });

      if (!day) {
        this.logger.warn(`DayPlan ${dayPlanId} not found. Skipping.`);
        return;
      }

      if (day.status === 'ready') {
        this.logger.log(`DayPlan ${dayPlanId} already ready. Skipping.`);
        return;
      }

      try {
        await this.dayPlanRepository.update(dayPlanId, { status: 'hydrating' });
        await this.programsService.hydrateDay(dayPlanId, goalText, params);
        this.logger.log(`DayPlan ${dayPlanId} hydrated successfully`);
      } catch (error) {
        this.logger.error(
          `Failed to hydrate DayPlan ${dayPlanId}: ${error.message}`,
        );
        await this.dayPlanRepository.update(dayPlanId, { status: 'pending' }); // Reset so it can be picked up again if needed
        throw error; // Re-throw for BullMQ retry logic
      }
    }

    return { success: true };
  }

  private async processInBatches<T>(
    items: T[],
    concurrency: number,
    delayMs: number,
    fn: (item: T) => Promise<void>,
  ) {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += concurrency) {
      chunks.push(items.slice(i, i + concurrency));
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      this.logger.debug(
        `Processing batch ${i + 1}/${chunks.length} (${chunk.length} items)`,
      );

      await Promise.allSettled(chunk.map(fn));

      // Pause between batches (except after the last one)
      if (i < chunks.length - 1) {
        this.logger.debug(`Waiting ${delayMs / 1000}s before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}
