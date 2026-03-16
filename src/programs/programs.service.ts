import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository, MoreThan } from 'typeorm'; // Import MoreThan
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { Task } from '../tasks/entities/task.entity';
import { AudioTrack } from '../audio/entities/audio-track.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity'; // Import
import { Goal } from '../goals/entities/goal.entity';
import { AdaptationLog } from './entities/adaptation-log.entity'; // Import
import { Progress } from '../progress/entities/progress.entity'; // Import - Wait, I might need to inject repository or use service. Let's use repo since module imports it.
// Checking ProgramsModule: We verified AdaptationLog is there. 
// We need to add Progress to ProgramsModule imports or use ProgressService.
// ProgramsModule currently has: Program, DayPlan, Task, AudioTrack, Quiz, QuizAttempt, Goal, AdaptationLog.
// It DOES NOT have Progress. 
// I should probably add Progress to ProgramsModule or use ProgressService if exported.
// ProgressModule IS exported. So I should use ProgressService or add Progress repo.
// To keep it simple and consistent with how I did others (injecting repos for strict logic), let's add Progress repo to module first or use ProgressService. 
// ProgressService was exported? Yes.
// BUT, I prefer raw query for "checkinDate > 7 days ago". 
// Let's add Progress to ProgramsModule.

import { GenerateProgramDto } from './dto/generate-program.dto';
import { UsersService } from '../users/users.service';
import { AiService } from '../ai/ai.service';
import { YoutubeService } from '../video/youtube/youtube.service';
import { AudioService } from '../audio/audio.service';

// Curated royalty-free, directly-streamable MP3s by mood (Mixkit, no auth required)
const AUDIO_TRACKS: Record<string, string[]> = {
    meditation: [
        'https://cdn.pixabay.com/audio/2022/10/30/audio_acea86d9bb.mp3', // Calm meditation
        'https://cdn.pixabay.com/audio/2022/03/10/audio_2d2bf9a9ef.mp3', // Deep calm
        'https://cdn.pixabay.com/audio/2024/01/09/audio_6ca9cbf5f6.mp3', // Gentle morning
        'https://cdn.pixabay.com/audio/2022/05/16/audio_1b6ad90af4.mp3', // Mindful moment
    ],
    focus: [
        'https://cdn.pixabay.com/audio/2022/08/02/audio_2dde668d05.mp3', // Lo-fi study
        'https://cdn.pixabay.com/audio/2023/01/13/audio_a4ee6649e0.mp3', // Deep focus
        'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3', // Concentration
        'https://cdn.pixabay.com/audio/2022/12/23/audio_2dd5734a57.mp3', // Study beats
    ],
    ambient: [
        'https://cdn.pixabay.com/audio/2022/05/13/audio_47a0a59fc3.mp3', // Forest rain
        'https://cdn.pixabay.com/audio/2022/03/09/audio_c610232a6d.mp3', // Ocean waves
        'https://cdn.pixabay.com/audio/2024/02/28/audio_b8da3cd1da.mp3', // White noise
        'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3', // Night sounds
    ],
};

function pickAudioUrl(mood: string, dayNumber: number): string {
    const tracks = AUDIO_TRACKS[mood] ?? AUDIO_TRACKS['meditation'];
    return tracks[(dayNumber - 1) % tracks.length];
}

@Injectable()
export class ProgramsService {
    private readonly logger = new Logger(ProgramsService.name);
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
        @InjectRepository(QuizAttempt)
        private quizAttemptRepository: Repository<QuizAttempt>,
        @InjectRepository(Goal)
        private goalRepository: Repository<Goal>,
        @InjectRepository(AdaptationLog)
        private adaptationLogRepository: Repository<AdaptationLog>,
        // I'll need to update Module to include Progress to inject it, or just use ProgressService if it has a flexible find method.
        // My previous edit to ProgressService added findRecent, which might not be enough (need MoreThan date).
        // It's safer to just inject ProgressService and maybe add a method, but for speed in "Agentic" mode, I'll update the module to include Progress repo.
        // Wait, I can't inject Repository<Progress> if it's not in forFeature.
        // So I will update ProgramsModule in the next step to include Progress.
        // For now, I'll assume it's there or I will add it.
        // Actually, let's inject ProgressRepository here, and I'll fix the module immediately after.
        @InjectRepository(Progress)
        private progressRepository: Repository<Progress>,

        @InjectQueue('audio-generation')
        private audioQueue: Queue,

        private usersService: UsersService,
        private aiService: AiService,
        private youtubeService: YoutubeService,
        private audioService: AudioService,
    ) { }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /** Compute a scheduled Date for a given task type, day offset, wake start, and sleep start. */
    private scheduleTask(type: string, dayOffset: number, wakeStart: string, sleepStart: string): Date {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);

        if (type === 'audio' || type === 'reflection') {
            const [h, m] = sleepStart.split(':').map(Number);
            d.setHours(h, m, 0, 0);
            const offset = type === 'audio' ? -30 : -60;
            d.setMinutes(d.getMinutes() + offset);
        } else {
            const [h, m] = wakeStart.split(':').map(Number);
            d.setHours(h, m, 0, 0);
            
            const offsets: Record<string, number> = {
                'exercise': 0,         // first thing after wake
                'lesson': 60,          // 1hr after wake
                'video': 120,          // mid-morning
                'quiz': 135,           // right after video
                'journal': 6 * 60,     // 6 hours after wake
                'mindfulness': 8 * 60, // 8 hours after wake
            };
            
            d.setMinutes(d.getMinutes() + (offsets[type] || 0));
        }
        return d;
    }

    /** Upsert a task — update if a task of this type already exists for the dayPlan. */
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

    // ── generateProgram ──────────────────────────────────────────────────────

    async generateProgram(
        userId: string,
        generateProgramDto: GenerateProgramDto,
    ): Promise<Program> {
        const {
            goalId,
            duration = 30,
            minutesPerDay = 30,
            learningStyle = 'mixed',
            constraints = []
        } = generateProgramDto;

        const goal = await this.goalRepository.findOne({ where: { id: goalId, userId } });
        if (!goal) throw new NotFoundException('Goal not found');

        const user = await this.usersService.findById(userId);
        const sleepStart = user.settings?.sleepWindow?.start || '23:00';
        const wakeStart = user.settings?.sleepWindow?.end || '07:00';

        // Scaled durations across 8 task types
        const total = minutesPerDay;
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

        // Create or find existing program for this goal
        let program = await this.programRepository.findOne({ where: { goalId, userId } });
        if (!program) {
            program = this.programRepository.create({
                title: goal.title,
                description: `A ${duration}-day ${learningStyle} program for ${goal.title}. Daily commitment: ${minutesPerDay} min.`,
                duration,
                goalId,
                userId,
            });
            await this.programRepository.save(program);
        }

        // Generate AI Plan — cap at 7 days for speed regardless of user's chosen duration
        const MAX_AI_DAYS = 7;
        const aiPlan = await this.aiService.generateProgramPlan(
            goal.description || goal.title || 'Goal',
            { 
                duration: Math.min(duration, MAX_AI_DAYS), 
                minutesPerDay, 
                learningStyle, 
                constraints,
                category: goal.category 
            }
        );

        // 1. Create all DayPlan entities sequentially first (fast)
        const dayPlanMap = new Map<number, DayPlan>();
        for (const day of aiPlan) {
            let dayPlan = await this.dayPlanRepository.findOne({
                where: { programId: program.id, dayNumber: day.dayNumber },
            });
            if (!dayPlan) {
                dayPlan = this.dayPlanRepository.create({
                    dayNumber: day.dayNumber,
                    theme: `Day ${day.dayNumber}: ${day.theme}`,
                    focusAreas: ['Video', 'Exercise', 'Lesson', 'Quiz', 'Journal', 'Audio', 'Mindfulness', 'Reflection'],
                    programId: program.id,
                });
                await this.dayPlanRepository.save(dayPlan);
            } else {
                dayPlan.theme = `Day ${day.dayNumber}: ${day.theme}`;
                await this.dayPlanRepository.save(dayPlan);
            }
            dayPlanMap.set(day.dayNumber, dayPlan);
        }

        // 2. Define a function to generate content for a single day
        const generateDayContent = async (day: any) => {
            const dayPlan = dayPlanMap.get(day.dayNumber);
            if (!dayPlan) return;

            const dayOffset = (day.dayNumber ?? 1) - 1;
            const tasks: Promise<any>[] = [];

            // 1. Short Lesson Video
            if (day.videoTask) {
                tasks.push((async () => {
                    const searchTopic = day.videoTask.searchQuery || `${day.theme} ${day.videoTask.title}`;
                    let videoUrl: string;
                    try {
                        const result = await this.youtubeService.getRecommendedVideo(searchTopic, day.videoTask.searchQuery);
                        videoUrl = result.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTopic)}`;
                    } catch {
                        videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTopic)}`;
                    }
                    await this.upsertTask({
                        type: 'video',
                        dayPlanId: dayPlan.id,
                        title: day.videoTask.title,
                        description: day.videoTask.description,
                        duration: dur.video,
                        completed: false,
                        videoUrl,
                        scheduledAt: this.scheduleTask('video', dayOffset, wakeStart, sleepStart),
                    });
                })());
            }

            // 2. Guided Exercise
            if (day.exerciseTask) {
                const steps = (day.exerciseTask.steps as string[] ?? []).join(' → ');
                tasks.push(this.upsertTask({
                    type: 'exercise',
                    dayPlanId: dayPlan.id,
                    title: day.exerciseTask.title,
                    description: `${day.exerciseTask.description}\n\nSteps: ${steps}`,
                    duration: dur.exercise,
                    completed: false,
                    scheduledAt: this.scheduleTask('exercise', dayOffset, wakeStart, sleepStart),
                }));
            }

            // 3. Short Lesson / Reading
            if (day.lessonTask) {
                const keyPoints = (day.lessonTask.keyPoints as string[] ?? []).map((p, i) => `${i + 1}. ${p}`).join('\n');
                tasks.push(this.upsertTask({
                    type: 'lesson',
                    dayPlanId: dayPlan.id,
                    title: day.lessonTask.title,
                    description: `${day.lessonTask.description}\n\nKey Points:\n${keyPoints}`,
                    duration: dur.lesson,
                    completed: false,
                    scheduledAt: this.scheduleTask('lesson', dayOffset, wakeStart, sleepStart),
                }));
            }

            // 4. Quiz
            if (day.quiz) {
                tasks.push((async () => {
                    let quiz = await this.quizRepository.findOne({ where: { dayPlanId: dayPlan.id } });
                    if (!quiz) {
                        quiz = this.quizRepository.create({
                            title: day.quiz.title,
                            questions: day.quiz.questions,
                            dayPlanId: dayPlan.id,
                        });
                    } else {
                        quiz.title = day.quiz.title;
                        quiz.questions = day.quiz.questions;
                    }
                    await this.quizRepository.save(quiz);

                    await this.upsertTask({
                        type: 'quiz',
                        dayPlanId: dayPlan.id,
                        title: `Quiz: ${day.quiz.title}`,
                        description: `Test your knowledge on ${day.theme}`,
                        duration: dur.quiz,
                        completed: false,
                        quizId: quiz.id,
                        scheduledAt: this.scheduleTask('quiz', dayOffset, wakeStart, sleepStart),
                    });
                })());
            }

            // 5. Journal Check-in
            if (day.journalTask) {
                tasks.push(this.upsertTask({
                    type: 'journal',
                    dayPlanId: dayPlan.id,
                    title: day.journalTask.title,
                    description: `Reflect: ${day.journalTask.prompt}`,
                    duration: dur.journal,
                    completed: false,
                    scheduledAt: this.scheduleTask('journal', dayOffset, wakeStart, sleepStart),
                }));
            }

            // 6. Nightly Audio Session
            if (day.audioTask && !constraints.includes('no_audio')) {
                tasks.push((async () => {
                    const mood = (day.audioTask.mood as string) || 'meditation';
                    const audioFilename = `program_${program!.id}_day_${day.dayNumber}`;

                    try {
                        let audioTrack = await this.audioTrackRepository.findOne({ where: { dayPlanId: dayPlan.id } });
                        if (!audioTrack) {
                            audioTrack = this.audioTrackRepository.create({ dayPlanId: dayPlan.id, title: '', url: '', duration: 0, type: '' });
                        }
                        audioTrack.title = day.audioTask.title;
                        audioTrack.url = 'generating...';
                        audioTrack.duration = dur.audio;
                        audioTrack.type = mood;
                        await this.audioTrackRepository.save(audioTrack);

                        await this.audioQueue.add('generate-audio', {
                            audioTrackId: audioTrack.id,
                            theme: day.theme,
                            mood: mood,
                            audioFilename: audioFilename,
                        });

                        await this.upsertTask({
                            type: 'audio',
                            dayPlanId: dayPlan.id,
                            title: `Nightly Audio: ${day.audioTask.title}`,
                            description: day.audioTask.description,
                            duration: dur.audio,
                            completed: false,
                            scheduledAt: this.scheduleTask('audio', dayOffset, wakeStart, sleepStart),
                        });
                    } catch (audioError) {
                        this.logger.error(`Failed to queue custom audio for day ${day.dayNumber}`, audioError);
                    }
                })());
            }

            // 7. Mindfulness Break
            if (day.mindfulnessTask) {
                tasks.push(this.upsertTask({
                    type: 'mindfulness',
                    dayPlanId: dayPlan.id,
                    title: day.mindfulnessTask.title,
                    description: `${day.mindfulnessTask.description}\n\nTechnique: ${day.mindfulnessTask.technique}`,
                    duration: dur.mindfulness,
                    completed: false,
                    scheduledAt: this.scheduleTask('mindfulness', dayOffset, wakeStart, sleepStart),
                }));
            }

            // 8. Reflection & Review
            if (day.reflectionTask) {
                const points = (day.reflectionTask.reviewPoints as string[] ?? []).map((p, i) => `${i + 1}. ${p}`).join('\n');
                tasks.push(this.upsertTask({
                    type: 'reflection',
                    dayPlanId: dayPlan.id,
                    title: day.reflectionTask.title,
                    description: `${day.reflectionTask.description}\n\nReview:\n${points}`,
                    duration: dur.reflection,
                    completed: false,
                    scheduledAt: this.scheduleTask('reflection', dayOffset, wakeStart, sleepStart),
                }));
            }

            await Promise.all(tasks);
        };

        // 3. Process day content in batches (e.g., 5 days at a time)
        const BATCH_SIZE = 5;
        for (let i = 0; i < aiPlan.length; i += BATCH_SIZE) {
            const batch = aiPlan.slice(i, i + BATCH_SIZE);
            this.logger.log(`Processing batch of ${batch.length} days (starting with Day ${batch[0].dayNumber})`);
            await Promise.all(batch.map(day => generateDayContent(day)));
        }

        return this.findById(program.id, userId);
    }

    async findActive(userId: string): Promise<Program> {
        const program = await this.programRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
            relations: ['goal'], // Maybe just goal for now, details loaded by findById if needed
        });
        if (!program) throw new NotFoundException('No active program found');
        return program;
    }

    async findById(id: string, userId: string): Promise<Program> {
        const program = await this.programRepository.findOne({
            where: { id, userId },
            relations: ['goal', 'dayPlans', 'dayPlans.tasks', 'dayPlans.audioTracks', 'dayPlans.quizzes'],
            order: {
                dayPlans: {
                    dayNumber: 'ASC'
                }
            }
        });
        if (!program) throw new NotFoundException('Program not found');
        return program;
    }

    async deleteProgram(id: string, userId: string): Promise<void> {
        const program = await this.programRepository.findOne({
            where: { id, userId },
        });

        if (!program) {
            throw new NotFoundException('Program not found');
        }

        await this.programRepository.remove(program);
    }

    async getTodaysPlan(programId: string, userId: string) {
        // Load the program to get its start date and duration
        const program = await this.programRepository.findOne({
            where: { id: programId, userId },
        });
        if (!program) throw new NotFoundException('Program not found');

        // Calculate which day number we're on (day 1 = the day the program was created)
        const startDate = new Date(program.createdAt);
        startDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffMs = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        // Clamp to [1, duration], so after the program ends day stays at the last day
        const dayNumber = Math.min(Math.max(diffDays + 1, 1), program.duration);

        const plan = await this.dayPlanRepository.findOne({
            where: { program: { id: programId, userId }, dayNumber },
            relations: ['tasks', 'audioTracks', 'quizzes'],
            order: { tasks: { scheduledAt: 'ASC' } },
        });

        if (!plan) throw new NotFoundException(`No plan available for day ${dayNumber}`);
        return plan;
    }

    private getTheme(i: number): string {
        const themes = ['Foundations', 'Mechanics', 'Application', 'Refinement', 'Mastery'];
        return themes[(i - 1) % themes.length];
    }

    private getMockQuestions(i: number) {
        return [
            { question: 'Key takeaway?', options: ['A', 'B', 'C'], correctAnswer: 0 },
            { question: 'Next step?', options: ['Practice', 'Rest', 'Quit'], correctAnswer: 0 }
        ];
    }

    async evaluatePerformance(programId: string): Promise<any> {
        const program = await this.programRepository.findOne({
            where: { id: programId },
            relations: ['user'],
        });
        if (!program) throw new NotFoundException('Program not found');

        const logs: string[] = [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. Fetch Context
        // Completion Rate (Last 5 Days)
        // We'd typically query Tasks joined with DayPlan. 
        // For MVP simplicity, we might query recent tasks directly if we had a handy method, 
        // or we can use a raw query or relations. 
        // Let's rely on AdaptationLog mostly, but here we need actual performance data.

        // Let's get recent tasks for this program
        const recentTasks = await this.taskRepository.find({
            where: {
                dayPlan: { programId: program.id },
                // In a real app we'd filter by date, but 'completedAt' is set only when done.
                // We'd check 'scheduledAt' or DayPlan date. 
                // Assuming DayPlan creation date roughly maps to schedule for now.
            },
            relations: ['dayPlan'],
            order: { createdAt: 'DESC' },
            take: 20 // Approx last 5-7 days
        });

        const completedCount = recentTasks.filter(t => t.completed).length;
        const completionRate = recentTasks.length ? (completedCount / recentTasks.length) : 1;

        // Quiz Average (Last 7 Days)
        const recentAttempts = await this.quizAttemptRepository.find({
            where: { userId: program.userId, createdAt: MoreThan(sevenDaysAgo) }
        });
        const quizAvg = recentAttempts.length
            ? recentAttempts.reduce((acc, curr) => acc + curr.score, 0) / recentAttempts.length
            : 0;

        // Audio Skips (Last 3 Audio Tasks)
        // We look for tasks of type 'audio' that are NOT completed but occupy recent slots
        const recentAudioTasks = recentTasks.filter(t => t.type === 'audio' || t.type === 'meditation');
        const skippedAudioCount = recentAudioTasks.slice(0, 3).filter(t => !t.completed).length;

        // Streak (Check Progress)
        // Check if broken twice in 7 days. 
        // We can query Progress entity.
        const recentProgress = await this.progressRepository.find({
            where: { userId: program.userId, checkinDate: MoreThan(sevenDaysAgo) }
        });
        const checkinCount = recentProgress.length;
        const streakBroken = checkinCount < 4; // Arbitrary "broken" definition for this logic

        // --- APPLY RULES ---

        // Rule 1: <40% Completion -> Reduce Duration
        if (completionRate < 0.40 && recentTasks.length > 5) {
            // Fetch next 3 days' dayplans
            const futurePlans = await this.dayPlanRepository.find({
                where: {
                    programId: program.id,
                    // Typically filter by dayNumber > current
                },
                relations: ['tasks'],
                order: { dayNumber: 'ASC' },
                take: 3
                // In reality, we need to find "future" plans. 
                // We'll just grab the next few that have uncompleted tasks.
            });

            let adaptedCount = 0;
            for (const plan of futurePlans) {
                for (const task of plan.tasks) {
                    if (!task.completed && task.duration > 5) {
                        task.duration = Math.floor(task.duration * 0.8);
                        await this.taskRepository.save(task);
                        adaptedCount++;
                    }
                }
            }
            if (adaptedCount > 0) {
                await this.logAdaptation(program.id, 'low_completion', `Reduced duration for next ${adaptedCount} tasks by 20%`);
                logs.push('Reduced task durations due to low completion');
            }
        }

        // Rule 2: >85% Quiz -> Increase Difficulty
        if (quizAvg > 85 && recentAttempts.length >= 3) {
            // For now, we append "Challenge" to title of next few tasks
            const nextTasks = await this.taskRepository.find({
                where: { dayPlan: { programId: program.id }, completed: false },
                take: 5
            });

            for (const task of nextTasks) {
                if (!task.title.includes('Challenge')) {
                    task.title = `[Challenge] ${task.title}`;
                    await this.taskRepository.save(task);
                }
            }
            await this.logAdaptation(program.id, 'high_quiz_score', 'Applied Challenge tag to upcoming tasks');
            logs.push('Increased difficulty due to high quiz scores');
        }

        // Rule 3: 3 Audio Skips -> Switch to Ambient
        if (skippedAudioCount >= 3) {
            // Find future audio tracks
            const futureTracks = await this.audioTrackRepository.find({
                where: { dayPlan: { programId: program.id }, type: 'meditation' }, // assuming default was meditation
                take: 10
            });

            for (const track of futureTracks) {
                track.type = 'ambient';
                track.url = 'https://example.com/ambient-rain.mp3'; // Mock ambient url
                await this.audioTrackRepository.save(track);
            }
            if (futureTracks.length > 0) {
                await this.logAdaptation(program.id, 'audio_skips', 'Switched future audio tracks to Ambient mode');
                logs.push('Switched to Ambient audio mode');
            }
        }

        // Rule 4: Streak Broken -> Lower Reminder Freq
        if (streakBroken) {
            // We update user settings
            const user = program.user;
            const currentSettings = user.settings || {};
            // If reminders not already low
            if (currentSettings.reminderFrequency !== 'low') {
                user.settings = { ...currentSettings, reminderFrequency: 'low' };
                await this.usersService.updateSettings(user.id, { settings: user.settings });

                await this.logAdaptation(program.id, 'broken_streak', 'Lowered reminder frequency to avoid fatigue');
                logs.push('Lowered reminder frequency');
            }
        }

        return {
            analyzed: {
                completionRate,
                quizAvg,
                skippedAudioCount,
                streakBroken
            },
            adaptations: logs
        };
    }

    private async logAdaptation(programId: string, trigger: string, action: string) {
        const log = this.adaptationLogRepository.create({
            programId,
            ruleTriggered: trigger,
            actionTaken: action
        });
        await this.adaptationLogRepository.save(log);
    }
}
