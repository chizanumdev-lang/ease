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
export class AdminUserManagementService {
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

  async getUserMetrics(page = 1, limit = 10, search?: string, status?: string) {
    const query = this.userRepository
      .createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.andWhere('(u.name ILIKE :search OR u.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (status && status !== 'all') {
      query.andWhere('u.isVerified = :verified', {
        verified: status === 'verified',
      });
    }

    const [users, total] = await query.getManyAndCount();

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await this.taskRepository
          .createQueryBuilder('task')
          .innerJoin('task.dayPlan', 'dp')
          .innerJoin('dp.program', 'p')
          .where('p.userId = :userId', { userId: user.id })
          .select('COUNT(*)', 'total')
          .addSelect(
            'COUNT(*) FILTER (WHERE task.completedAt IS NOT NULL)',
            'completed',
          )
          .getRawOne();

        return {
          ...user,
          completedTasks: parseInt(stats?.completed || '0'),
          lastActive: user.updatedAt.toISOString(),
          streak: (user as any).streak || 0, // Pulling from user's actual streak column
        };
      }),
    );

    return {
      users: usersWithStats,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getUserDetails(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['programs', 'programs.dayPlans', 'programs.dayPlans.tasks'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate some stats
    let totalTasks = 0;
    let completedTasks = 0;

    user.programs.forEach((program) => {
      program.dayPlans.forEach((plan) => {
        totalTasks += plan.tasks.length;
        completedTasks += plan.tasks.filter((t) => t.completed).length;
      });
    });

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...user,
      stats: {
        totalTasks,
        completedTasks,
        completionRate,
      },
    };
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    return this.userRepository.remove(user);
  }

  async toggleAdminStatus(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    user.isAdmin = !user.isAdmin;
    return this.userRepository.save(user);
  }

}
