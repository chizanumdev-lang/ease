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
    lockDuration: 300000, // 5 minutes (to accommodate 15s batch delays)
    lockRenewTime: 60000,
})
@Injectable()
export class ProgramProcessor extends WorkerHost {
    private readonly logger = new Logger(ProgramProcessor.name);

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
        const { programId, goalText, params } = job.data;
        this.logger.log(`Hydrating program ${programId} for goal: ${goalText}`);

        const days = await this.dayPlanRepository.find({
            where: { programId, status: 'pending' },
            order: { dayNumber: 'ASC' },
        });

        if (days.length === 0) {
            this.logger.log(`No pending days to hydrate for program ${programId}`);
            await this.programRepository.update(programId, { status: 'ready' });
            return { success: true };
        }

        // Concurrency-limited batch processing (2 at a time) with 15s pause
        await this.processInBatches(days, 2, 15000, async (day) => {
            await this.programsService.hydrateDay(day.id, goalText, params);
        });

        await this.programRepository.update(programId, { status: 'ready' });
        this.logger.log(`Program ${programId} fully hydrated and marked ready`);
        return { success: true };
    }

    private async processInBatches<T>(
        items: T[],
        concurrency: number,
        delayMs: number,
        fn: (item: T) => Promise<void>
    ) {
        const chunks: T[][] = [];
        for (let i = 0; i < items.length; i += concurrency) {
            chunks.push(items.slice(i, i + concurrency));
        }

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            this.logger.debug(`Processing batch ${i + 1}/${chunks.length} (${chunk.length} items)`);
            
            await Promise.allSettled(chunk.map(fn));

            // Pause between batches (except after the last one)
            if (i < chunks.length - 1) {
                this.logger.debug(`Waiting ${delayMs / 1000}s before next batch...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
}
