import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Program } from '../programs/entities/program.entity';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { ApiCostLog } from './entities/api-cost-log.entity';
import { ErrorLog } from './entities/error-log.entity';
import { ProgramRating } from './entities/program-rating.entity';
import { Referral } from './entities/referral.entity';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { TaskTemplate } from '../tasks/entities/task-template.entity';
import { BackgroundService } from '../modules/worker/background.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';


@Injectable()
export class AdminObservabilityService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(AiGenerationLog)
    private aiLogRepository: Repository<AiGenerationLog>,
    @InjectRepository(ApiCostLog)
    private costLogRepository: Repository<ApiCostLog>,
    @InjectRepository(ErrorLog)
    private errorLogRepository: Repository<ErrorLog>,
    @InjectRepository(ProgramRating)
    private ratingRepository: Repository<ProgramRating>,
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(DayPlan)
    private dayPlanRepository: Repository<DayPlan>,
    @InjectRepository(TaskTemplate)
    private taskTemplateRepository: Repository<TaskTemplate>,
    private backgroundService: BackgroundService,
    @InjectQueue('background-jobs') private queue: Queue,
  ) {}

  async getDashboardPulse() {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // DAU (Users with any activity today)
    const dau = await this.userRepository
      .createQueryBuilder('user')
      .where('user.updatedAt >= :today', { today: todayStart })
      .getCount();

    // Task Completion Rate last 24h
    const tasks24h = await this.taskRepository.count({
      where: { createdAt: MoreThan(twentyFourHoursAgo) },
    });
    const completed24h = await this.taskRepository.count({
      where: { completedAt: MoreThan(twentyFourHoursAgo) },
    });
    const completionRate = tasks24h > 0 ? (completed24h / tasks24h) * 100 : 0;

    // AI System Health (Success rate last 24h)
    const aiLogs = await this.aiLogRepository.count({
      where: { createdAt: MoreThan(twentyFourHoursAgo) },
    });
    const aiSuccessCount = await this.aiLogRepository.count({
      where: {
        createdAt: MoreThan(twentyFourHoursAgo),
        status: 'success',
      },
    });
    const aiHealth = aiLogs > 0 ? (aiSuccessCount / aiLogs) * 100 : 100;

    const totalUsers = await this.userRepository.count();

    // Real-time Signals (Fetch last 5 critical errors or AI failures)
    const recentErrors = await this.errorLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const failedAiLogs = await this.aiLogRepository.find({
      where: { status: 'failure' },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const alerts = [
      ...recentErrors.map((err) => ({
        id: `err-${err.id}`,
        type: 'error' as const,
        message: err.message,
        detail: err.stack?.slice(0, 100) || 'Internal system error',
      })),
      ...failedAiLogs.map((log) => ({
        id: `ai-${log.id}`,
        type: 'warning' as const,
        message: 'AI Hydration Failed',
        detail: `Model ${log.model} failed to generate shard: ${log.errorMessage?.slice(0, 50) || 'Unknown error'}`,
      })),
    ]
      .sort((a, b) => 0.5 - Math.random())
      .slice(0, 5); // Simple mix

    const avgStreakResult = await this.userRepository
      .createQueryBuilder('user')
      .select('AVG(user.streak)', 'avg')
      .getRawOne();
    const avgStreakVal = parseFloat(avgStreakResult?.avg || '0');
    const avgStreak = isNaN(avgStreakVal) ? 0 : Math.round(avgStreakVal);

    return {
      dau,
      tasksToday: tasks24h,
      aiGens: aiLogs,
      completionRate: Math.round(completionRate),
      aiHealth: Math.round(aiHealth),
      avgStreak,
      totalUsers,
      uptime: process.uptime(), // Real uptime instead of hardcoded
      timestamp: new Date(),
      alerts,
    };
  }

  async getTrends(days = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // DAU Trend
    const dauTrend = await this.userRepository
      .createQueryBuilder('user')
      .select("DATE_TRUNC('day', user.updatedAt)", 'date')
      .addSelect('COUNT(DISTINCT user.id)', 'count')
      .where('user.updatedAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Completion Rate Trend
    const completionTrend = await this.taskRepository
      .createQueryBuilder('task')
      .select("DATE_TRUNC('day', task.completedAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('task.completedAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      dau: dauTrend.map((d) => ({ date: d.date, value: parseInt(d.count) })),
      completion: completionTrend.map((d) => ({
        date: d.date,
        value: parseInt(d.count),
      })),
    };
  }

  async getSystemHealth() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const aiLogs = await this.aiLogRepository.find({
      where: { createdAt: MoreThan(twentyFourHoursAgo) },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const recentErrors = await this.errorLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const totalCost = await this.costLogRepository
      .createQueryBuilder('cost')
      .select('SUM(cost.cost)', 'total')
      .getRawOne();

    const queueStats = await this.getQueueStats();

    return {
      aiLogs,
      recentErrors,
      totalCost: parseFloat(totalCost?.total || '0'),
      queueStats,
    };
  }

  async logAiGeneration(data: Partial<AiGenerationLog>) {
    const log = this.aiLogRepository.create(data);
    return this.aiLogRepository.save(log);
  }

  async logError(data: Partial<ErrorLog>) {
    const log = this.errorLogRepository.create(data);
    return this.errorLogRepository.save(log);
  }

  async logCost(data: Partial<ApiCostLog>) {
    const log = this.costLogRepository.create(data);
    return this.costLogRepository.save(log);
  }

  async getQueueStats() {
    try {
      const counts = await this.queue.getJobCounts();
      return {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        total: counts.waiting + counts.active + counts.delayed,
        note: 'Background tasks managed by BullMQ',
      };
    } catch (e) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        total: 0,
        note: 'Queue unavailable',
      };
    }
  }

  async retryDayHydration(dayPlanId: string) {
    const day = await this.dayPlanRepository.findOne({
      where: { id: dayPlanId },
      relations: ['program', 'program.goal'],
    });

    if (!day) throw new Error('DayPlan not found');

    // Reset status
    day.status = 'pending';
    await this.dayPlanRepository.save(day);

    // Trigger via BackgroundService
    const program = day.program;
    const handle = await this.backgroundService.triggerHydrateDay({
      dayPlanId: day.id,
      goalText: program.goal?.description || program.title || 'Goal',
      params: { ...program.metadata, duration: program.duration },
    });

    if (handle) {
      return {
        success: true,
        message: `Day ${day.dayNumber} sent to background queue for hydration.`,
      };
    } else {
      return {
        success: false,
        message: `Background queue unavailable — Day ${day.dayNumber} status reset to pending but could not be queued.`,
      };
    }
  }

  async getAiLogs(page = 1, limit = 20) {
    const [logs, total] = await this.aiLogRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async debugTables() {
    const tables = [
      'users',
      'check_ins',
      'reward_events',
      'progress',
      'programs',
      'day_plans',
      'tasks',
    ];
    const results: any = {};

    for (const table of tables) {
      try {
        const count = await this.userRepository.query(
          `SELECT count(*) FROM "${table}"`,
        );
        results[table] = { exists: true, count: Number(count[0].count) };
      } catch (e) {
        results[table] = { exists: false, error: e.message };
      }
    }
    return results;
  }
}
