import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, CountValues } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Program } from '../programs/entities/program.entity';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { ApiCostLog } from './entities/api-cost-log.entity';
import { ErrorLog } from './entities/error-log.entity';
import { ProgramRating } from './entities/program-rating.entity';
import { Referral } from './entities/referral.entity';

@Injectable()
export class AdminService {
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
    ) { }

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
                status: 'success'
            },
        });
        const aiHealth = aiLogs > 0 ? (aiSuccessCount / aiLogs) * 100 : 100;

        // Total Revenue / Conversions (Placeholder for now)
        const totalUsers = await this.userRepository.count();

        return {
            dau,
            completionRate: Math.round(completionRate),
            aiHealth: Math.round(aiHealth),
            totalUsers,
            timestamp: new Date(),
        };
    }

    async getTrends(days = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // DAU Trend
        const dauTrend = await this.userRepository
            .createQueryBuilder('user')
            .select("DATE_TRUNC('day', user.updated_at)", 'date')
            .addSelect('COUNT(DISTINCT user.id)', 'count')
            .where('user.updated_at >= :startDate', { startDate })
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();

        // Completion Rate Trend
        const completionTrend = await this.taskRepository
            .createQueryBuilder('task')
            .select("DATE_TRUNC('day', task.completed_at)", 'date')
            .addSelect('COUNT(*)', 'count')
            .where('task.completed_at >= :startDate', { startDate })
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();

        return {
            dau: dauTrend.map(d => ({ date: d.date, value: parseInt(d.count) })),
            completion: completionTrend.map(d => ({ date: d.date, value: parseInt(d.count) })),
        };
    }

    async getUserMetrics(page = 1, limit = 10, search?: string) {
        const query = this.userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.programs', 'program')
            .leftJoin('program.dayPlans', 'dayPlan')
            .leftJoin('dayPlan.tasks', 'task')
            .select([
                'user.id',
                'user.name',
                'user.email',
                'user.createdAt',
                'user.isAdmin'
            ])
            .addSelect('COUNT(DISTINCT task.id) FILTER (WHERE task.completed = true)', 'completedTasks')
            .groupBy('user.id')
            .orderBy('user.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (search) {
            query.andWhere('user.name ILIKE :search OR user.email ILIKE :search', { search: `%${search}%` });
        }

        const { entities, raw } = await query.getRawAndEntities();
        const total = await this.userRepository.count();

        const users = entities.map((entity, index) => ({
            ...entity,
            completedTasks: parseInt(raw[index].completedTasks || '0'),
        }));

        return {
            users,
            total,
            page,
            lastPage: Math.ceil(total / limit),
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

        return {
            aiLogs,
            recentErrors,
            totalCost: parseFloat(totalCost?.total || '0'),
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
}
