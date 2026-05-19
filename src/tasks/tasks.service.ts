import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { ProgressService } from '../progress/progress.service';
import { RewardsService } from '../rewards/rewards.service';
import { triggerHydrateDay } from '../trigger/tasks';
import { YoutubeService } from '../video/youtube/youtube.service';
import { AudioService } from '../audio/audio.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(DayPlan)
        private dayPlanRepository: Repository<DayPlan>,
        private progressService: ProgressService,
        private rewardsService: RewardsService,
        private youtubeService: YoutubeService,
        private audioService: AudioService,
    ) { }

    async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
        const task = await this.taskRepository.findOne({ 
            where: { id },
            relations: ['dayPlan', 'dayPlan.program', 'dayPlan.program.goal']
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const wasCompleted = task.completed;

        if (updateTaskDto.completed !== undefined) {
            task.completed = updateTaskDto.completed;
            task.completedAt = updateTaskDto.completed ? new Date() : undefined;
        }

        if (updateTaskDto.content !== undefined) {
            task.content = updateTaskDto.content;
        }

        if (updateTaskDto.watchedSeconds !== undefined) {
            task.watchedSeconds = updateTaskDto.watchedSeconds;
        }

        if (updateTaskDto.totalDuration !== undefined) {
            task.totalDuration = updateTaskDto.totalDuration;
        }

        const savedTask = await this.taskRepository.save(task);

        // STREAK TRIGGER: If task completed, ensure a daily checkin exists
        if (!wasCompleted && savedTask.completed && savedTask.dayPlan?.program?.userId) {
            const userId = savedTask.dayPlan.program.userId;
            await this.progressService.createCheckin(userId);
            
            // REWARD XP: Task completion rewards
            await this.rewardsService.rewardTaskCompletion(userId, savedTask.type);
        }

        // HYDRATION TRIGGER: If reflection task just completed, queue next day immediately
        if (!wasCompleted && task.completed && task.type === 'reflection' && task.dayPlan) {
            const nextDayNumber = task.dayPlan.dayNumber + 1;
            const program = task.dayPlan.program;
            
            if (program && nextDayNumber <= program.duration) {
                const nextDay = await this.dayPlanRepository.findOne({
                    where: { programId: program.id, dayNumber: nextDayNumber }
                });

                if (nextDay && nextDay.status === 'pending') {
                    await triggerHydrateDay({
                        dayPlanId: nextDay.id,
                        goalText: program.goal?.description || program.title || 'Goal',
                        params: { ...program.metadata, duration: program.duration }
                    });
                    // Falls back to null if Trigger.dev unavailable — next day will hydrate on-demand or by cron
                }
            }
        }

        return savedTask;
    }

    async findRecent(userId: string): Promise<Task[]> {
        return this.taskRepository.find({
            where: {
                dayPlan: {
                    program: {
                        userId
                    }
                }
            },
            relations: ['dayPlan', 'dayPlan.program'],
            order: { completedAt: 'DESC' },
            take: 10
        });
    }

    async regenerateMedia(id: string): Promise<Task> {
        const task = await this.taskRepository.findOne({
            where: { id },
            relations: ['dayPlan', 'dayPlan.program', 'dayPlan.program.goal']
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const goal = task.dayPlan?.program?.goal?.description || task.dayPlan?.program?.title || 'Goal';
        const dayPlanId = task.dayPlanId;
        const metadata = task.metadata || {};

        if (task.type === 'video' && metadata.searchQuery) {
            this.logger.log(`Regenerating video task ${task.id} with query: ${metadata.searchQuery}`);
            let videoUrl: string;
            try {
                const video = await this.youtubeService.getRecommendedVideo(goal, metadata.searchQuery);
                videoUrl = video?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(metadata.searchQuery)}`;
            } catch (err) {
                // Fallback search
                const fallback = await this.youtubeService.getRecommendedVideo(goal, goal);
                videoUrl = fallback?.url || 'https://www.youtube.com/watch?v=inpok4MKVLM';
            }
            task.videoUrl = videoUrl;
            if (metadata.status) {
                metadata.status = 'ready';
            }
        }

        if (metadata.pattern === 'vocal-test') {
            this.logger.log(`Regenerating vocal-test task ${task.id}`);
            const ttsScript = metadata.narrationScript || metadata.targetScript || metadata.description || `Practice speaking about ${goal}`;
            const filename = `vocal_model_${dayPlanId}_${task.id}_retry_${Date.now()}`;
            metadata.audioUrl = await this.audioService.generateAudioTrack(ttsScript, 'calm', filename, true);
            metadata.status = 'ready';
        } else if (task.type === 'audio') {
            this.logger.log(`Regenerating audio task ${task.id}`);
            const script = metadata.narrationScript || metadata.description || `Session for ${goal}`;
            const filename = `audio_task_${dayPlanId}_${task.id}_retry_${Date.now()}`;
            metadata.audioUrl = await this.audioService.generateAudioTrack(script, 'focus', filename);
            metadata.status = 'ready';
        }

        task.metadata = metadata;
        return this.taskRepository.save(task);
    }
}
