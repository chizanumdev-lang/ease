import { AudioService } from '../audio/audio.service';
import { ProgressService } from '../progress/progress.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { Task } from '../tasks/entities/task.entity';
import { AudioTrack } from '../audio/entities/audio-track.entity';
import { AdaptationLog } from './entities/adaptation-log.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProgramAdaptationService {
  private readonly logger = new Logger(ProgramAdaptationService.name);

  constructor(
    @InjectRepository(Program) private programRepository: Repository<Program>,
    @InjectRepository(DayPlan) private dayPlanRepository: Repository<DayPlan>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    private audioService: AudioService,
    private quizzesService: QuizzesService,
    private progressService: ProgressService,
    @InjectRepository(AdaptationLog)
    private adaptationLogRepository: Repository<AdaptationLog>,
    private usersService: UsersService,
  ) {}

  async evaluatePerformance(id: string): Promise<any> {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!program) throw new Error('Program not found');

    const logs: string[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTasks = await this.taskRepository.find({
      where: { dayPlan: { programId: program.id } },
      relations: ['dayPlan'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const completedCount = recentTasks.filter((t) => t.completed).length;
    const completionRate = recentTasks.length
      ? completedCount / recentTasks.length
      : 1;

    const recentAttempts = await this.quizzesService.findAttemptsSince(program.userId, sevenDaysAgo);
    const quizAvg = recentAttempts.length
      ? recentAttempts.reduce((acc, curr) => acc + curr.score, 0) /
        recentAttempts.length
      : 0;

    const recentAudioTasks = recentTasks.filter(
      (t) => t.type === 'audio' || t.type === 'meditation',
    );
    const skippedAudioCount = recentAudioTasks
      .slice(0, 3)
      .filter((t) => !t.completed).length;

    const recentProgress = await this.progressService.findProgressSince(program.userId, sevenDaysAgo);
    const checkinCount = recentProgress.length;
    const streakBroken = checkinCount < 4;

    if (completionRate < 0.4 && recentTasks.length > 5) {
      const futurePlans = await this.dayPlanRepository.find({
        where: { programId: program.id },
        relations: ['tasks'],
        order: { dayNumber: 'ASC' },
        take: 3,
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

    if (quizAvg > 85 && recentAttempts.length >= 3) {
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

    if (skippedAudioCount >= 3) {
      const futureTracks = await this.audioService.findTracksForProgram(program.id, 'meditation', 10);

      for (const track of futureTracks) {
        track.type = 'ambient';
        track.url = 'https://example.com/ambient-rain.mp3';
        await this.audioService.updateAudioTrack(track);
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

    if (streakBroken) {
      const user = program.user;
      const currentSettings = user.settings || {};
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
      analyzed: { completionRate, quizAvg, skippedAudioCount, streakBroken },
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
    const checkIns = await this.progressService.findRecent(userId);

    if (checkIns.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const latestCheckIn = new Date(checkIns[0].checkinDate);
    latestCheckIn.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - latestCheckIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 1) return 0;

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
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }
}
