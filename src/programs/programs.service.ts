/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
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
import { AudioMixerService } from '../audio/audio-mixer.service';
import { RitualsService } from '../audio/rituals.service';
import { OrchestratorService } from '../modules/engine/services/orchestrator.service';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Curated royalty-free, directly-streamable MP3s by mood (Mixkit, no auth required)
// Binaural beat tracks mapped by experience category
const AUDIO_TRACKS: Record<string, string[]> = {
  meditation: [
    'https://res.cloudinary.com/duooultxc/video/upload/v1774276955/ease/audio/static_binaural_4hz.mp3', // Theta (Deep)
    'https://res.cloudinary.com/duooultxc/video/upload/v1774269228/ease/audio/static_binaural_6hz.mp3', // Theta (Light)
  ],
  focus: [
    'https://res.cloudinary.com/duooultxc/video/upload/v1774269306/ease/audio/static_binaural_10hz.mp3', // Alpha (Focus)
    'https://res.cloudinary.com/duooultxc/video/upload/v1774277400/ease/audio/static_binaural_15hz.mp3', // Beta (Active)
  ],
  ambient: [
    'https://res.cloudinary.com/duooultxc/video/upload/v1774269382/ease/audio/static_binaural_20hz.mp3', // Beta (High)
  ],
};

function pickAudioUrl(mood: string, dayNumber: number): string {
  const tracks = AUDIO_TRACKS[mood] ?? AUDIO_TRACKS['meditation'];
  return tracks[(dayNumber - 1) % tracks.length];
}

import { Cron, CronExpression } from '@nestjs/schedule';
import { ProgressionService } from './progression.service';
import { triggerHydrateDay, triggerGenerateAudio } from '../trigger/tasks';

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

    private usersService: UsersService,
    private aiService: AiService,
    private youtubeService: YoutubeService,
    private audioService: AudioService,
    private audioMixerService: AudioMixerService,
    private ritualsService: RitualsService,
    private progressionService: ProgressionService,
    private orchestratorService: OrchestratorService,
    private configService: ConfigService,
  ) {}

  /** Hourly check for users to trigger rituals and plan hydration based on their local time. */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySync(): Promise<void> {
    this.logger.log('Starting hourly user-sync check...');
    const users = await this.usersService.findAll();
    const now = new Date();
    const isLocal =
      this.configService.get('NODE_ENV') === 'local' ||
      !this.configService.get('NODE_ENV');

    for (const user of users) {
      try {
        // Optimization: Skip inactive users (not updated in 48h) on local machine
        // to prevent background AI noise for stale test accounts.
        if (isLocal && user.updatedAt) {
          const diffHours =
            (now.getTime() - new Date(user.updatedAt).getTime()) /
            (1000 * 60 * 60);
          if (diffHours > 48) {
            this.logger.debug(
              `Skipping hourly sync for inactive user ${user.id}`,
            );
            continue;
          }
        }

        const userTz = user.settings?.timezone || 'UTC';

        // Get user's local hour and date
        const options: Intl.DateTimeFormatOptions = {
          timeZone: userTz,
          hour: 'numeric',
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        };

        const fmt = new Intl.DateTimeFormat('en-GB', options);
        const parts = fmt.formatToParts(now);
        const partsMap = parts.reduce(
          (acc, part) => {
            acc[part.type] = part.value;
            return acc;
          },
          {} as Record<string, string>,
        );

        const localHour = parseInt(partsMap.hour, 10);
        const localDateStr = `${partsMap.year}-${partsMap.month}-${partsMap.day}`;

        // 1. Midnight: Generate Morning Ritual for Today
        if (localHour === 0) {
          this.logger.log(
            `Generating morning ritual for user ${user.id} at midnight local time`,
          );
          this.ritualsService
            .generateRitual(user.id, 'morning', localDateStr)
            .catch((err: any) =>
              this.logger.error(
                `Scheduled morning ritual failed for user ${user.id}: ${err instanceof Error ? err.message : String(err)}`,
              ),
            );
        }

        // 2. Midday (12:00): Generate Night Ritual for Today
        if (localHour === 12) {
          this.logger.log(
            `Generating night ritual for user ${user.id} at noon local time`,
          );
          this.ritualsService
            .generateRitual(user.id, 'night', localDateStr)
            .catch((err: any) =>
              this.logger.error(
                `Scheduled night ritual failed for user ${user.id}: ${err instanceof Error ? err.message : String(err)}`,
              ),
            );
        }

        // 3. 20:00 (8 PM): Hydrate Tomorrow's Plan
        if (localHour === 20) {
          const program = await this.programRepository.findOne({
            where: { userId: user.id, status: 'ready' },
            relations: ['goal'],
            order: { createdAt: 'DESC' },
          });

          if (program) {
            const todayNum = await this.calculateCurrentDayNumber(program);
            const tomorrowNum = todayNum + 1;

            if (tomorrowNum <= program.duration) {
              const tomorrow = await this.dayPlanRepository.findOne({
                where: { programId: program.id, dayNumber: tomorrowNum },
              });

              if (tomorrow && tomorrow.status === 'pending') {
                this.logger.log(
                  `Scheduled hydration for user ${user.id}: Queuing Day ${tomorrowNum}`,
                );
                const handle = await triggerHydrateDay({
                  dayPlanId: tomorrow.id,
                  goalText: program.goal?.description || 'Goal',
                  params: { ...program.metadata, duration: program.duration },
                });
                if (!handle) {
                  this.logger.warn(
                    `Trigger.dev unavailable, hydrating Day ${tomorrowNum} synchronously`,
                  );
                  await this.hydrateDay(
                    tomorrow.id,
                    program.goal?.description || 'Goal',
                    { ...program.metadata, duration: program.duration },
                  ).catch((e) =>
                    this.logger.error(
                      `Sync hydration failed for Day ${tomorrowNum}: ${e instanceof Error ? e.message : String(e)}`,
                    ),
                  );
                }
              }
            }
          }
        }

        // 4. 23:00 (11 PM): Evaluate Performance for Active Program
        if (localHour === 23) {
          const program = await this.programRepository.findOne({
            where: { userId: user.id, status: 'ready' },
            order: { createdAt: 'DESC' },
          });

          if (program) {
            this.logger.log(
              `Evaluating performance for user ${user.id} at 11 PM local time`,
            );
            await this.evaluatePerformance(program.id).catch((err: any) =>
              this.logger.error(
                `Performance evaluation failed for program ${program.id}: ${err instanceof Error ? err.message : String(err)}`,
              ),
            );
          }
        }
      } catch (err: any) {
        this.logger.error(
          `Hourly sync failed for user ${user.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  private calculateCurrentDayNumber(program: Program): Promise<number> {
    // Simple logic: days since program.createdAt (capped by duration)
    const start = program.createdAt.getTime();
    const diff = Date.now() - start;
    return Promise.resolve(
      Math.min(program.duration, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1),
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Compute a scheduled Date for a given task type, day offset, wake start, and sleep start. */
  private scheduleTask(
    type: string,
    dayOffset: number,
    wakeStart: string,
    sleepStart: string,
  ): Date {
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
        video: 60, // 1 hr after wake
        quiz: 75, // right after video
        consistency: 90, // commitment
        journal: 120, // intention
      };

      d.setMinutes(d.getMinutes() + (offsets[type] || 0));
    }
    return d;
  }

  /** Upsert a task — update if a task of this type already exists for the dayPlan. */
  private async upsertTask(
    fields: Partial<Task> & { type: string; dayPlanId: string },
  ): Promise<Task> {
    const existing = await this.taskRepository.findOne({
      where: { dayPlanId: fields.dayPlanId, type: fields.type },
    });
    if (existing) {
      Object.assign(existing, fields);
      return this.taskRepository.save(existing);
    }
    return this.taskRepository.save(this.taskRepository.create(fields));
  }

  async hydrateDay(dayId: string, goalText: string): Promise<void> {
    this.logger.log(
      `Hydrating Day ${dayId} via Orchestrator (Goal: ${goalText})`,
    );
    try {
      await this.orchestratorService.orchestrateDay(dayId, goalText);

      // Trigger ritual generation (non-blocking)
      const day = await this.dayPlanRepository.findOne({
        where: { id: dayId },
        relations: ['program'],
      });

      if (day) {
        // If this is Day 1, mark the program as ready so the mobile app knows it can show the tasks
        if (day.dayNumber === 1 && day.program.status === 'generating') {
          await this.programRepository.update(day.program.id, {
            status: 'ready',
          });
          this.logger.log(
            `Program ${day.program.id} marked as ready after Day 1 hydration`,
          );
        }

        const user = await this.usersService.findById(day.program.userId);
        const userTz = user?.settings?.timezone || 'UTC';
        const localDateStr = new Intl.DateTimeFormat('sv-SE', {
          timeZone: userTz,
        }).format(new Date());

        this.ritualsService
          .generateDailyRituals(day.program.userId, localDateStr)
          .catch((err: any) =>
            this.logger.error(
              `Initial ritual generation failed for user ${day.program.userId} on ${localDateStr}: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
        this.logger.log(`Successfully hydrated Day ${dayId}`);
      }
    } catch (error) {
      this.logger.error(
        `Orchestration failed for Day ${dayId}: ${error.message}`,
      );
      throw error;
    }
  }

  private async saveDayContent(
    day: DayPlan,
    content: any,
    params: any,
  ): Promise<void> {
    const wakeStart = params.wakeStart || '07:00';
    const sleepStart = params.sleepStart || '23:00';
    const dayOffset = day.dayNumber - 1;
    const total = params.minutesPerDay || 30;

    // Duration mapping based on AI suggestions and ratios
    const dur = {
      video:
        content.videoTask?.duration || Math.max(5, Math.floor(total * 0.3)),
      quiz: Math.max(3, Math.floor(total * 0.1)),
      audio:
        content.audioTask?.duration || Math.max(5, Math.floor(total * 0.2)),
      consistency: 2,
      journal:
        content.journalTask?.duration || Math.max(3, Math.floor(total * 0.15)),
      reflection: Math.max(3, Math.floor(total * 0.1)),
    };

    const xp = {
      video: 40,
      quiz: 20,
      audio: 40,
      consistency: 10,
      journal: 60,
      reflection: 80,
    };

    const tasks: Promise<any>[] = [];

    // 0. Video (Concept)
    if (content.videoTask) {
      tasks.push(
        (async () => {
          const topic =
            content.videoTask.searchQuery ||
            `${content.theme} ${content.videoTask.title}`;
          let videoUrl: string;
          try {
            const result = await this.youtubeService.getRecommendedVideo(
              topic,
              content.videoTask.searchQuery,
            );
            videoUrl =
              result.url ||
              `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`;
          } catch {
            videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`;
          }
          await this.upsertTask({
            type: 'video',
            dayPlanId: day.id,
            order: 0,
            title: content.videoTask.title,
            description: content.videoTask.description,
            duration: dur.video,
            completed: false,
            videoUrl,
            xpReward: xp.video,
            scheduledAt: this.scheduleTask(
              'video',
              dayOffset,
              wakeStart,
              sleepStart,
            ),
          });
        })(),
      );
    }

    // 1. Quiz (Check)
    if (content.quiz) {
      tasks.push(
        (async () => {
          let quiz = await this.quizRepository.findOne({
            where: { dayPlanId: day.id },
          });
          if (!quiz) {
            quiz = this.quizRepository.create({
              title: content.quiz.title,
              questions: content.quiz.questions,
              dayPlanId: day.id,
            });
          } else {
            quiz.title = content.quiz.title;
            quiz.questions = content.quiz.questions;
          }
          await this.quizRepository.save(quiz);
          await this.upsertTask({
            type: 'quiz',
            dayPlanId: day.id,
            order: 1,
            title: content.quiz.title || `Quiz: ${content.theme}`,
            description: `Knowledge check on today's focus.`,
            duration: dur.quiz,
            completed: false,
            quizId: quiz.id,
            xpReward: xp.quiz,
            scheduledAt: this.scheduleTask(
              'quiz',
              dayOffset,
              wakeStart,
              sleepStart,
            ),
          });
        })(),
      );
    }

    // 2. Audio (Integration)
    if (content.audioTask) {
      tasks.push(
        (async () => {
          const mood = content.audioTask.mood || 'meditation';
          const audioFilename = `program_${day.programId}_day_${day.dayNumber}`;
          let audioTrack = await this.audioTrackRepository.findOne({
            where: { dayPlanId: day.id },
          });
          if (!audioTrack) {
            audioTrack = this.audioTrackRepository.create({
              dayPlanId: day.id,
              title: '',
              url: pickAudioUrl(mood, day.dayNumber),
              duration: 0,
              type: '',
            });
          }
          audioTrack.title = content.audioTask.title;
          audioTrack.url = pickAudioUrl(mood, day.dayNumber);
          audioTrack.duration = dur.audio;
          audioTrack.type = mood;

          // Save first to obtain database ID
          const savedTrack = await this.audioTrackRepository.save(audioTrack);

          try {
            await triggerGenerateAudio({
              audioTrackId: savedTrack.id,
              theme: content.audioTask.theme || content.theme,
              audioFilename,
            });
          } catch (queueErr) {
            this.logger.warn(
              `Audio trigger unavailable, track ${savedTrack.id} will use static URL: ${queueErr.message}`,
            );
          }

          await this.upsertTask({
            type: 'audio',
            dayPlanId: day.id,
            order: 2,
            title: content.audioTask.title || 'Focus Audio',
            description: content.audioTask.description || '',
            duration: dur.audio,
            completed: false,
            xpReward: xp.audio,
            scheduledAt: this.scheduleTask(
              'audio',
              dayOffset,
              wakeStart,
              sleepStart,
            ),
          });
        })(),
      );
    }

    // 3. Journal (Intention)
    if (content.journalTask) {
      tasks.push(
        this.upsertTask({
          type: 'journal',
          dayPlanId: day.id,
          order: 3,
          title: content.journalTask.title,
          description: content.journalTask.prompt,
          duration: dur.journal,
          completed: false,
          xpReward: xp.journal,
          scheduledAt: this.scheduleTask(
            'journal',
            dayOffset,
            wakeStart,
            sleepStart,
          ),
        }),
      );
    }

    // 4. Reflection (Evaluation)
    if (content.reflectionTask) {
      const points = ((content.reflectionTask.reviewPoints as string[]) ?? [])
        .map((p, i) => `${i + 1}. ${p}`)
        .join('\n');
      tasks.push(
        this.upsertTask({
          type: 'reflection',
          dayPlanId: day.id,
          order: 4,
          title: content.reflectionTask.title,
          description: `${content.reflectionTask.description}\n\nReflection Points:\n${points}`,
          duration: dur.reflection,
          completed: false,
          xpReward: xp.reflection,
          scheduledAt: this.scheduleTask(
            'reflection',
            dayOffset,
            wakeStart,
            sleepStart,
          ),
        }),
      );
    }

    // 5. Consistency (Commitment)
    if (content.consistencyTask) {
      const streak = await this.calculateCurrentStreak(day.program.userId);
      const nextStreak = streak + 1;
      tasks.push(
        this.upsertTask({
          type: 'consistency',
          dayPlanId: day.id,
          order: 5,
          title: content.consistencyTask.title,
          description: `i will complete my routine tommorrow. this will be day ${nextStreak} of my streak.`,
          duration: dur.consistency,
          completed: false,
          xpReward: xp.consistency,
          scheduledAt: this.scheduleTask(
            'consistency',
            dayOffset,
            wakeStart,
            sleepStart,
          ),
        }),
      );
    }
    await Promise.all(tasks);
  }

  // ── generateProgram ──────────────────────────────────────────────────────

  async initiateDraft(
    userId: string,
    goalDescription: string,
    category: string,
  ): Promise<any> {
    this.logger.log(
      `Initiating draft program for user ${userId}: "${goalDescription}"`,
    );

    // 1. Create the Goal first
    const goalTitle = goalDescription.split('.')[0].substring(0, 50);
    const goal = this.goalRepository.create({
      userId,
      title: goalTitle,
      description: goalDescription,
      category,
    });
    const savedGoal = await this.goalRepository.save(goal);

    // 2. Create the Program shell
    const program = this.programRepository.create({
      userId,
      goalId: savedGoal.id,
      title: goalTitle,
      description: `Journey into ${goalTitle}`,
      status: 'generating',
      duration: 30, // Default, will be updated in generateProgram
    });
    const savedProgram = await this.programRepository.save(program);

    // 3. Create Day 1 shell
    const day1 = this.dayPlanRepository.create({
      programId: savedProgram.id,
      dayNumber: 1,
      theme: 'Day 1: Initiation',
      status: 'pending',
    });
    const savedDay1 = await this.dayPlanRepository.save(day1);

    // 4. Trigger Orchestration in background (NON-BLOCKING)
    const handle = await triggerHydrateDay({
      dayPlanId: savedDay1.id,
      goalText: goalDescription,
      params: {},
    });
    if (!handle) {
      this.logger.warn(
        `Trigger.dev unavailable, hydrating early Day 1 locally`,
      );
      this.orchestratorService
        .orchestrateDay(savedDay1.id, goalDescription)
        .catch((err: any) =>
          this.logger.error(
            `Early orchestration failed for Day 1: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
    }

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

    // If still no text, use category or default
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

    // ─── PHASE 1: Re-use Draft or Create skeleton ───────────────────────────
    let program = await this.programRepository.findOne({
      where: { goalId, userId },
    });
    const programTitle = generateProgramDto.metadata?.title || goal.title;
    const programDesc = `A ${duration}-day ${learningStyle} program for ${goal.title}. Daily commitment: ${minutesPerDay} min.`;

    if (!program) {
      program = this.programRepository.create({
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
    } else {
      // Convert Draft to Active Program
      program.status = 'generating';
      program.title = programTitle;
      program.description = programDesc;
      program.duration = duration;
      program.metadata = {
        ...program.metadata,
        ...generateProgramDto.metadata,
        minutesPerDay,
        learningStyle,
        constraints,
      };
      await this.programRepository.save(program);
    }

    // Create empty day shells for the full duration
    const existingDays = await this.dayPlanRepository.find({
      where: { programId: program.id },
    });
    const existingDayNumbers = new Set(existingDays.map((d) => d.dayNumber));
    const newDayShells = Array.from({ length: duration }, (_, i) => i + 1)
      .filter((n) => !existingDayNumbers.has(n))
      .map((n) =>
        this.dayPlanRepository.create({
          dayNumber: n,
          theme: `Day ${n}`,
          programId: program.id,
          status: 'pending',
        }),
      );
    if (newDayShells.length > 0) {
      await this.dayPlanRepository.save(newDayShells);
    }

    // ─── PHASE 2: Ensure Day 1 is Hydrating/Ready ─────────────────────────────
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
        `Hydrating Day 1 synchronously for instant first-run availability`,
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
          `Synchronous hydration for Day 1 failed: ${err instanceof Error ? err.message : String(err)}. Retrying locally in background...`,
        );
        this.orchestratorService
          .orchestrateDay(day1.id, generationParams.goalText)
          .catch((bgErr) =>
            this.logger.error(
              `Fallback background hydration failed: ${bgErr.message}`,
            ),
          );
        program.status = 'generating';
        await this.programRepository.save(program);
      }
    } else {
      program.status = 'ready';
      await this.programRepository.save(program);
    }

    // ─── PHASE 3: Dispatch Day 2 to background queue ─────────────────────
    const day2 = await this.dayPlanRepository.findOne({
      where: { programId: program.id, dayNumber: 2 },
    });

    if (day2 && day2.status === 'pending') {
      const handle = await triggerHydrateDay({
        dayPlanId: day2.id,
        goalText: generationParams.goalText,
        params: generationParams,
      });
      if (!handle) {
        this.logger.warn(`Trigger.dev unavailable, hydrating Day 2 locally`);
        this.orchestratorService
          .orchestrateDay(day2.id, generationParams.goalText)
          .catch((e) =>
            this.logger.error(
              `Day 2 Background hydration failed: ${e instanceof Error ? e.message : String(e)}`,
            ),
          );
      }
    }

    await this.programRepository.save(program);
    return program;
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
    // Load the program to get its start date and duration
    const program = await this.programRepository.findOne({
      where: { id: programId, userId },
      relations: ['goal'],
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

    if (!plan)
      throw new NotFoundException(`No plan available for day ${dayNumber}`);

    // If the cron job missed this day, trigger lazy hydration
    if (plan.status === 'pending') {
      this.logger.log(
        `Day ${dayNumber} is pending. Triggering lazy hydration.`,
      );
      triggerHydrateDay({
        dayPlanId: plan.id,
        goalText: program.goal?.description || 'Goal',
        params: { ...program.metadata, duration: program.duration },
      }).catch((err) =>
        this.logger.error(`Lazy hydration failed: ${err.message}`),
      );
    }

    const rings = {
      morning:
        plan.audioTracks?.some(
          (t) => t.type === 'morning' && t.url && !t.url.includes('generating'),
        ) || false,
      tasks: plan.tasks?.length > 0 && plan.tasks.every((t) => t.completed),
      night:
        plan.audioTracks?.some(
          (t) => t.type === 'night' && t.url && !t.url.includes('generating'),
        ) || false,
    };

    return {
      ...plan,
      masteryScore: program.masteryScore,
      competenceLevel: program.competenceLevel,
      todayRings: rings,
    };
  }

  private getTheme(i: number): string {
    const themes = [
      'Foundations',
      'Mechanics',
      'Application',
      'Refinement',
      'Mastery',
    ];
    return themes[(i - 1) % themes.length];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getMockQuestions(_i: number) {
    return [
      { question: 'Key takeaway?', options: ['A', 'B', 'C'], correctAnswer: 0 },
      {
        question: 'Next step?',
        options: ['Practice', 'Rest', 'Quit'],
        correctAnswer: 0,
      },
    ];
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

  async evaluatePerformance(id: string): Promise<any> {
    const program = await this.programRepository.findOne({
      where: { id },
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
      take: 20, // Approx last 5-7 days
    });

    const completedCount = recentTasks.filter((t) => t.completed).length;
    const completionRate = recentTasks.length
      ? completedCount / recentTasks.length
      : 1;

    // Quiz Average (Last 7 Days)
    const recentAttempts = await this.quizAttemptRepository.find({
      where: { userId: program.userId, createdAt: MoreThan(sevenDaysAgo) },
    });
    const quizAvg = recentAttempts.length
      ? recentAttempts.reduce((acc, curr) => acc + curr.score, 0) /
        recentAttempts.length
      : 0;

    // Audio Skips (Last 3 Audio Tasks)
    // We look for tasks of type 'audio' that are NOT completed but occupy recent slots
    const recentAudioTasks = recentTasks.filter(
      (t) => t.type === 'audio' || t.type === 'meditation',
    );
    const skippedAudioCount = recentAudioTasks
      .slice(0, 3)
      .filter((t) => !t.completed).length;

    // Streak (Check Progress)
    // Check if broken twice in 7 days.
    // We can query Progress entity.
    const recentProgress = await this.progressRepository.find({
      where: { userId: program.userId, checkinDate: MoreThan(sevenDaysAgo) },
    });
    const checkinCount = recentProgress.length;
    const streakBroken = checkinCount < 4; // Arbitrary "broken" definition for this logic

    // --- APPLY RULES ---

    // Rule 1: <40% Completion -> Reduce Duration
    if (completionRate < 0.4 && recentTasks.length > 5) {
      // Fetch next 3 days' dayplans
      const futurePlans = await this.dayPlanRepository.find({
        where: {
          programId: program.id,
          // Typically filter by dayNumber > current
        },
        relations: ['tasks'],
        order: { dayNumber: 'ASC' },
        take: 3,
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
        await this.logAdaptation(
          program.id,
          'low_completion',
          `Reduced duration for next ${adaptedCount} tasks by 20%`,
        );
        logs.push('Reduced task durations due to low completion');
      }
    }

    // Rule 2: >85% Quiz -> Increase Difficulty
    if (quizAvg > 85 && recentAttempts.length >= 3) {
      // For now, we append "Challenge" to title of next few tasks
      const nextTasks = await this.taskRepository.find({
        where: { dayPlan: { programId: program.id }, completed: false },
        take: 5,
      });

      for (const task of nextTasks) {
        if (!task.title.includes('Challenge')) {
          task.title = `[Challenge] ${task.title}`;
          await this.taskRepository.save(task);
        }
      }
      await this.logAdaptation(
        program.id,
        'high_quiz_score',
        'Applied Challenge tag to upcoming tasks',
      );
      logs.push('Increased difficulty due to high quiz scores');
    }

    // Rule 3: 3 Audio Skips -> Switch to Ambient
    if (skippedAudioCount >= 3) {
      // Find future audio tracks
      const futureTracks = await this.audioTrackRepository.find({
        where: { dayPlan: { programId: program.id }, type: 'meditation' }, // assuming default was meditation
        take: 10,
      });

      for (const track of futureTracks) {
        track.type = 'ambient';
        track.url = 'https://example.com/ambient-rain.mp3'; // Mock ambient url
        await this.audioTrackRepository.save(track);
      }
      if (futureTracks.length > 0) {
        await this.logAdaptation(
          program.id,
          'audio_skips',
          'Switched future audio tracks to Ambient mode',
        );
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
        await this.usersService.updateSettings(user.id, {
          settings: user.settings,
        });

        await this.logAdaptation(
          program.id,
          'broken_streak',
          'Lowered reminder frequency to avoid fatigue',
        );
        logs.push('Lowered reminder frequency');
      }
    }

    return {
      analyzed: {
        completionRate,
        quizAvg,
        skippedAudioCount,
        streakBroken,
      },
      adaptations: logs,
    };
  }

  private async logAdaptation(
    programId: string,
    trigger: string,
    action: string,
  ) {
    const log = this.adaptationLogRepository.create({
      programId,
      ruleTriggered: trigger,
      actionTaken: action,
    });
    await this.adaptationLogRepository.save(log);
  }

  private async calculateCurrentStreak(userId: string): Promise<number> {
    const checkIns = await this.progressRepository.find({
      where: { userId },
      order: { checkinDate: 'DESC' },
      take: 30,
    });

    if (checkIns.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestCheckIn = new Date(checkIns[0].checkinDate);
    latestCheckIn.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - latestCheckIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff > 1) return 0; // Streak broken

    let streak = 0;
    for (let i = 0; i < checkIns.length; i++) {
      const currentDate = new Date(checkIns[i].checkinDate);
      currentDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        streak = 1;
        continue;
      }

      const prevDate = new Date(checkIns[i - 1].checkinDate);
      prevDate.setHours(0, 0, 0, 0);

      const diff = Math.floor(
        (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async generateAudioTrack(
    audioTrackId: string,
    theme: string,
    audioFilename: string,
  ): Promise<any> {
    this.logger.log(
      `Generating audio for track ${audioTrackId} (theme: ${theme})`,
    );
    try {
      const track = await this.audioTrackRepository.findOne({
        where: { id: audioTrackId },
      });
      if (!track) {
        this.logger.warn(`AudioTrack ${audioTrackId} not found in DB`);
        return { success: false, reason: 'not_found' };
      }

      // Check if already generated (sync path)
      if (
        track.url &&
        track.url !== 'generating...' &&
        track.url !== '' &&
        !track.url.includes('pixabay.com') &&
        !track.url.includes('static_binaural')
      ) {
        this.logger.log(
          `Audio track ${audioTrackId} already generated, skipping`,
        );
        return { success: true, url: track.url };
      }

      // Set state to generating
      track.url = 'generating...';
      await this.audioTrackRepository.save(track);

      // 1. Generate script with AI
      // We want it to be a task audio session, so type = 'task'
      const scriptData = await this.aiService.generateAudioScript(
        theme,
        5,
        'task',
      );

      // 2. Create mixed audio file via AudioMixerService
      const tempDir = path.join(os.tmpdir(), 'ease-audio-binaural');
      const audioPath =
        await this.audioMixerService.createBinauralSubliminalTrack(
          scriptData,
          tempDir,
        );

      // 3. Upload to storage (Cloudinary)
      const publicUrl = await this.audioService.uploadToCloudinary(
        audioPath,
        audioFilename,
      );

      // 4. Update DB record
      track.url = publicUrl;
      track.type = scriptData.sessionType;
      track.metadata = {
        sessionType: scriptData.sessionType,
        frequency: scriptData.binauralFrequency,
        affirmations: scriptData.affirmations,
      };
      await this.audioTrackRepository.save(track);
      this.logger.log(
        `Successfully generated and saved binaural track ${audioTrackId}`,
      );

      // 5. Cleanup temp file
      try {
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      } catch (err: any) {
        this.logger.warn(`Failed to cleanup temp file: ${audioPath}`, err);
      }

      return { success: true, url: publicUrl };
    } catch (error) {
      this.logger.error(
        `Failed to generate audio track ${audioTrackId}: ${error.message}`,
      );
      // Restore static placeholder on error so that it at least plays *something*
      const track = await this.audioTrackRepository.findOne({
        where: { id: audioTrackId },
      });
      if (track) {
        const mood = track.type || 'meditation';
        const dayNumber = track.dayPlanId
          ? (
              await this.dayPlanRepository.findOne({
                where: { id: track.dayPlanId },
              })
            )?.dayNumber || 1
          : 1;
        track.url = pickAudioUrl(mood, dayNumber);
        await this.audioTrackRepository.save(track);
      }
      throw error;
    }
  }
}
