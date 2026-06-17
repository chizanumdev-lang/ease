import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BackgroundService {
  private readonly logger = new Logger(BackgroundService.name);

  constructor(@InjectQueue('background-jobs') private backgroundQueue: Queue) {}

  async triggerHydrateDay(payload: {
    dayPlanId: string;
    goalText: string;
    params: Record<string, any>;
  }) {
    try {
      const job = await this.backgroundQueue.add('hydrate-day', payload, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      });
      return job.id;
    } catch (err) {
      this.logger.error(`Failed to trigger hydrateDay: ${err}`);
      return null;
    }
  }

  async triggerGenerateAudio(payload: {
    audioTrackId: string;
    theme: string;
    audioFilename: string;
  }) {
    try {
      const job = await this.backgroundQueue.add('generate-audio', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
      return job.id;
    } catch (err) {
      this.logger.error(`Failed to trigger generateAudio: ${err}`);
      return null;
    }
  }

  async triggerProgramRituals(payload: { programId: string }) {
    try {
      const job = await this.backgroundQueue.add(
        'generate-program-rituals',
        payload,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
        },
      );
      return job.id;
    } catch (err) {
      this.logger.error(`Failed to trigger programRituals: ${err}`);
      return null;
    }
  }

  async triggerGenerateProgram(payload: {
    userId: string;
    programId: string;
    goalId: string;
    generateProgramDto: any;
    wakeStart: string;
    sleepStart: string;
  }) {
    try {
      const job = await this.backgroundQueue.add(
        'generate-program',
        payload,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
        },
      );
      return job.id;
    } catch (err) {
      this.logger.error(`Failed to trigger generateProgram: ${err}`);
      return null;
    }
  }
}
