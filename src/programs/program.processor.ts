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

@Processor('program-generation')
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
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { programId, goalText, params } = job.data;
        this.logger.log(`Hydrating program ${programId} for goal: ${goalText}`);

        const days = await this.dayPlanRepository.find({
            where: { programId },
            order: { dayNumber: 'ASC' },
        });

        // Concurrency-limited batch processing (2 at a time) with 15s pause
        // to stay safely under Gemini's 15 requests/min free tier limit.
        await this.processInBatches(days, 2, 15000, async (day) => {
            await this.hydrateDay(day, goalText, params);
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

    private async hydrateDay(day: DayPlan, goalText: string, params: any): Promise<void> {
        try {
            const content = await this.aiService.generateSingleDay(
                goalText,
                day.dayNumber,
                params.duration || 7,
                params,
            );

            await this.saveDayContent(day, content, params);

            await this.dayPlanRepository.update(day.id, {
                theme: `Day ${day.dayNumber}: ${content.theme}`,
                status: 'ready',
            });

            this.logger.log(`Day ${day.dayNumber} of program ${day.programId} hydrated`);
        } catch (error) {
            this.logger.error(`Failed to hydrate day ${day.dayNumber}: ${error?.message}`);
            await this.dayPlanRepository.update(day.id, { status: 'failed' });
        }
    }

    private scheduleTask(type: string, dayOffset: number, wakeStart: string, sleepStart: string): Date {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        if (type === 'audio' || type === 'reflection') {
            const [h, m] = sleepStart.split(':').map(Number);
            d.setHours(h, m, 0, 0);
            d.setMinutes(d.getMinutes() + (type === 'audio' ? -30 : -60));
        } else {
            const [h, m] = wakeStart.split(':').map(Number);
            d.setHours(h, m, 0, 0);
            const offsets: Record<string, number> = {
                exercise: 0, lesson: 60, video: 120, quiz: 135, journal: 6 * 60, mindfulness: 8 * 60,
            };
            d.setMinutes(d.getMinutes() + (offsets[type] || 0));
        }
        return d;
    }

    private async upsertTask(fields: Partial<Task> & { type: string; dayPlanId: string }): Promise<Task> {
        const existing = await this.taskRepository.findOne({
            where: { dayPlanId: fields.dayPlanId, type: fields.type },
        });
        if (existing) {
            Object.assign(existing, fields);
            return this.taskRepository.save(existing);
        }
        return this.taskRepository.save(this.taskRepository.create(fields));
    }

    private async saveDayContent(day: DayPlan, content: any, params: any): Promise<void> {
        const wakeStart = params.wakeStart || '07:00';
        const sleepStart = params.sleepStart || '23:00';
        const constraints = params.constraints || [];
        const dayOffset = day.dayNumber - 1;
        const total = params.minutesPerDay || 30;
        const dur = {
            video: Math.max(5, Math.floor(total * 0.25)),
            exercise: Math.max(5, Math.floor(total * 0.15)),
            lesson: Math.max(3, Math.floor(total * 0.10)),
            quiz: Math.max(3, Math.floor(total * 0.08)),
            journal: Math.max(3, Math.floor(total * 0.07)),
            audio: Math.max(5, Math.floor(total * 0.15)),
            mindfulness: Math.max(3, Math.floor(total * 0.10)),
            reflection: Math.max(3, Math.floor(total * 0.10)),
        };

        const tasks: Promise<any>[] = [];

        // 1. Video
        if (content.videoTask) {
            tasks.push((async () => {
                const topic = content.videoTask.searchQuery || `${content.theme} ${content.videoTask.title}`;
                let videoUrl: string;
                try {
                    const result = await this.youtubeService.getRecommendedVideo(topic, content.videoTask.searchQuery);
                    videoUrl = result.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`;
                } catch {
                    videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`;
                }
                await this.upsertTask({
                    type: 'video', dayPlanId: day.id,
                    title: content.videoTask.title, description: content.videoTask.description,
                    duration: dur.video, completed: false, videoUrl,
                    scheduledAt: this.scheduleTask('video', dayOffset, wakeStart, sleepStart),
                });
            })());
        }

        // 2. Exercise
        if (content.exerciseTask) {
            const steps = (content.exerciseTask.steps as string[] ?? []).join(' → ');
            tasks.push(this.upsertTask({
                type: 'exercise', dayPlanId: day.id,
                title: content.exerciseTask.title,
                description: `${content.exerciseTask.description}\n\nSteps: ${steps}`,
                duration: dur.exercise, completed: false,
                scheduledAt: this.scheduleTask('exercise', dayOffset, wakeStart, sleepStart),
            }));
        }

        // 3. Lesson
        if (content.lessonTask) {
            const keyPoints = (content.lessonTask.keyPoints as string[] ?? []).map((p, i) => `${i + 1}. ${p}`).join('\n');
            tasks.push(this.upsertTask({
                type: 'lesson', dayPlanId: day.id,
                title: content.lessonTask.title,
                description: `${content.lessonTask.description}\n\nKey Points:\n${keyPoints}`,
                duration: dur.lesson, completed: false,
                scheduledAt: this.scheduleTask('lesson', dayOffset, wakeStart, sleepStart),
            }));
        }

        // 4. Quiz
        if (content.quiz) {
            tasks.push((async () => {
                let quiz = await this.quizRepository.findOne({ where: { dayPlanId: day.id } });
                if (!quiz) {
                    quiz = this.quizRepository.create({ title: content.quiz.title, questions: content.quiz.questions, dayPlanId: day.id });
                } else {
                    quiz.title = content.quiz.title;
                    quiz.questions = content.quiz.questions;
                }
                await this.quizRepository.save(quiz);
                await this.upsertTask({
                    type: 'quiz', dayPlanId: day.id,
                    title: content.quiz.title || `Quiz: ${content.theme}`,
                    description: `Test your understanding of today's lesson.`,
                    duration: dur.quiz, completed: false, quizId: quiz.id,
                    scheduledAt: this.scheduleTask('quiz', dayOffset, wakeStart, sleepStart),
                });
            })());
        }

        // 5. Journal
        if (content.journalTask) {
            tasks.push(this.upsertTask({
                type: 'journal', dayPlanId: day.id,
                title: content.journalTask.title, description: content.journalTask.prompt,
                duration: dur.journal, completed: false,
                scheduledAt: this.scheduleTask('journal', dayOffset, wakeStart, sleepStart),
            }));
        }

        // 6. Audio (fire-and-forget into audio queue)
        if (content.audioTask && !constraints.includes('no_audio')) {
            tasks.push((async () => {
                const mood = content.audioTask.mood || 'meditation';
                const audioFilename = `program_${day.programId}_day_${day.dayNumber}`;
                let audioTrack = await this.audioTrackRepository.findOne({ where: { dayPlanId: day.id } });
                if (!audioTrack) {
                    audioTrack = this.audioTrackRepository.create({ dayPlanId: day.id, title: '', url: '', duration: 0, type: '' });
                }
                audioTrack.title = content.audioTask.title;
                audioTrack.url = 'generating...';
                audioTrack.duration = dur.audio;
                audioTrack.type = mood;
                await this.audioTrackRepository.save(audioTrack);

                // Fire-and-forget: audio generation is async and doesn't block day hydration
                this.audioQueue.add('generate-audio', {
                    audioTrackId: audioTrack.id,
                    theme: content.audioTask.theme || content.theme,
                    mood,
                    goal: params.goalText,
                    dayNumber: day.dayNumber,
                    audioFilename,
                });

                await this.upsertTask({
                    type: 'audio', dayPlanId: day.id,
                    title: content.audioTask.title || 'Nightly Audio',
                    description: content.audioTask.description || '',
                    duration: dur.audio, completed: false,
                    scheduledAt: this.scheduleTask('audio', dayOffset, wakeStart, sleepStart),
                });
            })());
        }

        // 7. Mindfulness
        if (content.mindfulnessTask) {
            tasks.push(this.upsertTask({
                type: 'mindfulness', dayPlanId: day.id,
                title: content.mindfulnessTask.title,
                description: `${content.mindfulnessTask.description}\n\nTechnique: ${content.mindfulnessTask.technique}`,
                duration: dur.mindfulness, completed: false,
                scheduledAt: this.scheduleTask('mindfulness', dayOffset, wakeStart, sleepStart),
            }));
        }

        // 8. Reflection
        if (content.reflectionTask) {
            const points = (content.reflectionTask.reviewPoints as string[] ?? []).map((p, i) => `${i + 1}. ${p}`).join('\n');
            tasks.push(this.upsertTask({
                type: 'reflection', dayPlanId: day.id,
                title: content.reflectionTask.title,
                description: `${content.reflectionTask.description}\n\nReview:\n${points}`,
                duration: dur.reflection, completed: false,
                scheduledAt: this.scheduleTask('reflection', dayOffset, wakeStart, sleepStart),
            }));
        }

        await Promise.all(tasks);
    }
}
