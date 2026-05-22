import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { CheckIn } from '../progress/entities/check-in.entity';
import { Task } from '../tasks/entities/task.entity';
import { RewardEvent } from '../rewards/entities/reward-event.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { Program } from '../programs/entities/program.entity';
import {
  WeeklyAnalyticsDto,
  Badge,
  DailyCompletion,
} from './dto/weekly-analytics.dto';
import { ProgressionService } from '../programs/progression.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(CheckIn)
    private checkInRepository: Repository<CheckIn>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(DayPlan)
    private dayPlanRepository: Repository<DayPlan>,
    @InjectRepository(RewardEvent)
    private rewardEventRepository: Repository<RewardEvent>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    private progressionService: ProgressionService,
  ) {}

  async getWeeklyAnalytics(userId: string): Promise<WeeklyAnalyticsDto> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Calculate current streak
      const currentStreak = await this.calculateStreak(userId);

      // Calculate overall completion rate
      const completionRate = await this.calculateCompletionRate(userId);

      // Calculate today's completion rate
      const todayCompletionRate =
        await this.calculateTodayCompletionRate(userId);

      // Calculate weekly completion rate
      const weeklyCompletionRate = await this.calculateWeeklyCompletionRate(
        userId,
        sevenDaysAgo,
        now,
      );

      // Calculate quiz average
      const quizAverage = await this.calculateQuizAverage(userId);

      // Calculate points
      const pointsEarned = await this.calculatePoints(userId);

      // Get badges
      const badges = await this.getBadges(userId, {
        currentStreak,
        completionRate,
        quizAverage,
        pointsEarned,
      });

      // Get daily completions for chart
      const dailyCompletions = await this.getDailyCompletions(
        userId,
        sevenDaysAgo,
        now,
      );

      // Get Active Goal to determine progression variant
      const activeGoal = await this.programRepository
        .findOne({
          where: { userId },
          order: { createdAt: 'DESC' },
          relations: ['goal'],
        })
        .then((p) => p?.goal);

      // Get Progression Data
      const progression = this.progressionService.getProgression(
        pointsEarned,
        activeGoal?.category,
      );

      return {
        currentStreak,
        completionRate,
        todayCompletionRate,
        weeklyCompletionRate,
        quizAverage,
        pointsEarned,
        badges,
        dailyCompletions,
        progression,
      };
    } catch (error) {
      console.error('[AnalyticsService] Error in getWeeklyAnalytics:', error);
      throw error;
    }
  }

  private async calculateStreak(userId: string): Promise<number> {
    const checkIns = await this.checkInRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });

    if (checkIns.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's a check-in today or yesterday
    const latestCheckIn = new Date(checkIns[0].date);
    latestCheckIn.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - latestCheckIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff > 1) return 0; // Streak broken

    // Count consecutive days
    for (let i = 0; i < checkIns.length; i++) {
      const currentDate = new Date(checkIns[i].date);
      currentDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        streak = 1;
        continue;
      }

      const prevDate = new Date(checkIns[i - 1].date);
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

  private async calculateCompletionRate(userId: string): Promise<number> {
    const dayPlans = await this.dayPlanRepository
      .createQueryBuilder('dayPlan')
      .innerJoin('dayPlan.program', 'program')
      .leftJoinAndSelect('dayPlan.tasks', 'tasks')
      .where('program.userId = :userId', { userId })
      .getMany();

    if (dayPlans.length === 0) return 0;

    let totalTasks = 0;
    let completedTasks = 0;

    for (const plan of dayPlans) {
      totalTasks += plan.tasks?.length || 0;
      completedTasks += plan.tasks?.filter((t) => t.completed).length || 0;
    }

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  private async calculateTodayCompletionRate(userId: string): Promise<number> {
    const program = await this.programRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!program) return 0;

    // Calculate current day number (consistent with ProgramsService)
    const startDate = new Date(program.createdAt);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const dayNumber = Math.min(Math.max(diffDays + 1, 1), program.duration);

    const plan = await this.dayPlanRepository.findOne({
      where: { program: { id: program.id }, dayNumber },
      relations: ['tasks'],
    });

    if (!plan || plan.tasks.length === 0) return 0;

    const completed = plan.tasks.filter((t) => t.completed).length;
    return Math.round((completed / plan.tasks.length) * 100);
  }

  private async calculateWeeklyCompletionRate(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const dayPlans = await this.dayPlanRepository
      .createQueryBuilder('dayPlan')
      .innerJoin('dayPlan.program', 'program')
      .leftJoinAndSelect('dayPlan.tasks', 'tasks')
      .where('program.userId = :userId', { userId })
      .andWhere('dayPlan.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .getMany();

    if (dayPlans.length === 0) return 0;

    let totalTasks = 0;
    let completedTasks = 0;

    for (const plan of dayPlans) {
      totalTasks += plan.tasks?.length || 0;
      completedTasks += plan.tasks?.filter((t) => t.completed).length || 0;
    }

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  private async calculateQuizAverage(userId: string): Promise<number> {
    const attempts = await this.quizAttemptRepository.find({
      where: { userId },
    });

    if (attempts.length === 0) return 0;

    const totalScore = attempts.reduce(
      (sum, attempt) => sum + attempt.score,
      0,
    );
    return Math.round(totalScore / attempts.length);
  }

  private async calculatePoints(userId: string): Promise<number> {
    const taskPointsResult = await this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.dayPlan', 'dayPlan')
      .innerJoin('dayPlan.program', 'program')
      .where('program.userId = :userId', { userId })
      .andWhere('task.completed = :completed', { completed: true })
      .select('SUM(task.xp_reward)', 'sum')
      .getRawOne();

    const taskPoints = parseInt(taskPointsResult?.sum || '0', 10);

    const rewards = await this.rewardEventRepository.find({
      where: { userId },
    });

    const rewardPoints = rewards.reduce(
      (sum, reward) => sum + (reward.points || 0),
      0,
    );

    return taskPoints + rewardPoints;
  }

  private async getBadges(
    userId: string,
    stats: {
      currentStreak: number;
      completionRate: number;
      quizAverage: number;
      pointsEarned: number;
    },
  ): Promise<Badge[]> {
    const allBadges: Badge[] = [
      {
        id: 'first-step',
        name: 'First Step',
        description: 'Complete your first task',
        icon: '🎯',
        earned: stats.pointsEarned >= 10,
        earnedAt: stats.pointsEarned >= 10 ? new Date() : undefined,
      },
      {
        id: 'week-warrior',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        earned: stats.currentStreak >= 7,
        earnedAt: stats.currentStreak >= 7 ? new Date() : undefined,
      },
      {
        id: 'quiz-master',
        name: 'Quiz Master',
        description: 'Achieve 90%+ quiz average',
        icon: '🧠',
        earned: stats.quizAverage >= 90,
        earnedAt: stats.quizAverage >= 90 ? new Date() : undefined,
      },
      {
        id: 'consistent',
        name: 'Consistent',
        description: 'Achieve 80%+ completion rate',
        icon: '⭐',
        earned: stats.completionRate >= 80,
        earnedAt: stats.completionRate >= 80 ? new Date() : undefined,
      },
      {
        id: 'point-collector',
        name: 'Point Collector',
        description: 'Earn 100+ points',
        icon: '💎',
        earned: stats.pointsEarned >= 100,
        earnedAt: stats.pointsEarned >= 100 ? new Date() : undefined,
      },
      {
        id: 'month-master',
        name: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: '👑',
        earned: stats.currentStreak >= 30,
        earnedAt: stats.currentStreak >= 30 ? new Date() : undefined,
      },
    ];

    return allBadges;
  }

  private async getDailyCompletions(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyCompletion[]> {
    const dayPlans = await this.dayPlanRepository
      .createQueryBuilder('dayPlan')
      .innerJoin('dayPlan.program', 'program')
      .leftJoinAndSelect('dayPlan.tasks', 'tasks')
      .where('program.userId = :userId', { userId })
      .andWhere('dayPlan.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .orderBy('dayPlan.dayNumber', 'ASC')
      .getMany();

    const completions: DailyCompletion[] = [];

    // Generate all 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const plan = dayPlans.find((p) => {
        const planDate = new Date(p.createdAt).toISOString().split('T')[0];
        return planDate === dateStr;
      });

      if (plan && plan.tasks.length > 0) {
        const completed = plan.tasks.filter((t) => t.completed).length;
        const completionRate = Math.round(
          (completed / plan.tasks.length) * 100,
        );
        completions.push({ date: dateStr, completionRate });
      } else {
        completions.push({ date: dateStr, completionRate: 0 });
      }
    }

    return completions;
  }
}
