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
            tasksToday: tasks24h,
            aiGens: aiLogs,
            completionRate: Math.round(completionRate),
            aiHealth: Math.round(aiHealth),
            avgStreak: 0, // Simplified for now
            totalUsers,
            timestamp: new Date(),
            alerts: [] 
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

    async getUserMetrics(page = 1, limit = 10, search?: string, status?: string) {
        const query = this.userRepository.createQueryBuilder('u')
            .leftJoin('u.programs', 'p')
            .leftJoin('p.dayPlans', 'dp')
            .leftJoin('dp.tasks', 't')
            .select([
                'u.id',
                'u.name',
                'u.email',
                'u.createdAt',
                'u.isAdmin',
                'u.isVerified',
            ])
            .addSelect('COUNT(DISTINCT CASE WHEN t.completed = true THEN t.id END)', 'completedTasks')
            .addSelect('MAX(p.created_at)', 'lastActive')
            .groupBy('u.id')
            .orderBy('u.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (search) {
            query.andWhere('(u.name ILIKE :search OR u.email ILIKE :search)', { search: `%${search}%` });
        }

        if (status === 'verified') {
            query.andWhere('u.isVerified = true');
        } else if (status === 'unverified') {
            query.andWhere('u.isVerified = false');
        }

        const { entities, raw } = await query.getRawAndEntities();
        
        // Count total for pagination
        const countQuery = this.userRepository.createQueryBuilder('user');
        if (search) {
            countQuery.andWhere('user.name ILIKE :search OR user.email ILIKE :search', { search: `%${search}%` });
        }
        if (status === 'verified') {
            countQuery.andWhere('user.isVerified = true');
        } else if (status === 'unverified') {
            countQuery.andWhere('user.isVerified = false');
        }
        const total = await countQuery.getCount();

        const users = entities.map((entity, index) => ({
            ...entity,
            completedTasks: parseInt(raw[index].completedTasks || '0'),
            lastActive: raw[index].lastActive,
            streak: 0, // Should be calculated if needed in list
        }));

        return {
            users,
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
        
        user.programs.forEach(program => {
            program.dayPlans.forEach(plan => {
                totalTasks += plan.tasks.length;
                completedTasks += plan.tasks.filter(t => t.completed).length;
            });
        });

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            ...user,
            stats: {
                totalTasks,
                completedTasks,
                completionRate,
            }
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
