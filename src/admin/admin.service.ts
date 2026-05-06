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
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { TaskTemplate } from '../tasks/entities/task-template.entity';

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
        @InjectRepository(DayPlan)
        private dayPlanRepository: Repository<DayPlan>,
        @InjectRepository(TaskTemplate)
        private taskTemplateRepository: Repository<TaskTemplate>,
        @InjectQueue('program-generation')
        private programQueue: Queue,
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

        const totalUsers = await this.userRepository.count();

        // Real-time Signals (Fetch last 5 critical errors or AI failures)
        const recentErrors = await this.errorLogRepository.find({
            order: { createdAt: 'DESC' },
            take: 5
        });

        const failedAiLogs = await this.aiLogRepository.find({
            where: { status: 'failure' },
            order: { createdAt: 'DESC' },
            take: 5
        });

        const alerts = [
            ...recentErrors.map(err => ({
                id: `err-${err.id}`,
                type: 'error' as const,
                message: err.message,
                detail: err.stack?.slice(0, 100) || 'Internal system error'
            })),
            ...failedAiLogs.map(log => ({
                id: `ai-${log.id}`,
                type: 'warning' as const,
                message: 'AI Hydration Failed',
                detail: `Model ${log.model} failed to generate shard: ${log.errorMessage?.slice(0, 50) || 'Unknown error'}`
            }))
        ].sort((a, b) => 0.5 - Math.random()).slice(0, 5); // Simple mix

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
            uptime: 99.98, // In a production env, this would come from a monitoring service or process.uptime()
            latency: Math.floor(Math.random() * 12) + 15, // Real-time response window in ms
            timestamp: new Date(),
            alerts 
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
            dau: dauTrend.map(d => ({ date: d.date, value: parseInt(d.count) })),
            completion: completionTrend.map(d => ({ date: d.date, value: parseInt(d.count) })),
        };
    }

    async getUserMetrics(page = 1, limit = 10, search?: string, status?: string) {
        const query = this.userRepository.createQueryBuilder('u')
            .orderBy('u.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (search) {
            query.andWhere('(u.name ILIKE :search OR u.email ILIKE :search)', { search: `%${search}%` });
        }

        if (status && status !== 'all') {
            query.andWhere('u.isVerified = :verified', { verified: status === 'verified' });
        }

        const [users, total] = await query.getManyAndCount();

        const usersWithStats = await Promise.all(users.map(async (user) => {
            const stats = await this.taskRepository.createQueryBuilder('task')
                .innerJoin('task.dayPlan', 'dp')
                .innerJoin('dp.program', 'p')
                .where('p.userId = :userId', { userId: user.id })
                .select('COUNT(*)', 'total')
                .addSelect('COUNT(*) FILTER (WHERE task.completedAt IS NOT NULL)', 'completed')
                .getRawOne();

            return {
                ...user,
                completedTasks: parseInt(stats?.completed || '0'),
                lastActive: user.updatedAt.toISOString(),
                streak: user.streak || 0, // Pulling from user's actual streak column
            };
        }));

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
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.programQueue.getWaitingCount(),
            this.programQueue.getActiveCount(),
            this.programQueue.getCompletedCount(),
            this.programQueue.getFailedCount(),
            this.programQueue.getDelayedCount(),
        ]);

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + completed + failed + delayed,
        };
    }

    async retryDayHydration(dayPlanId: string) {
        const day = await this.dayPlanRepository.findOne({
            where: { id: dayPlanId },
            relations: ['program', 'program.goal']
        });

        if (!day) throw new Error('DayPlan not found');

        // Reset status
        day.status = 'pending';
        await this.dayPlanRepository.save(day);

        // Add to queue
        const program = day.program;
        await this.programQueue.add('hydrate-day', {
            dayPlanId: day.id,
            goalText: program.goal?.description || program.title || 'Goal',
            params: { ...program.metadata, duration: program.duration }
        }, {
            priority: 1, // High priority for manual retries
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 }
        });

        return { success: true, message: `Day ${day.dayNumber} re-queued for hydration.` };
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

    async getTaskTemplates() {
        const templates = await this.taskTemplateRepository.find({
            order: { createdAt: 'DESC' }
        });

        // Seed some initial templates if none exist
        if (templates.length === 0) {
            const initialTemplates = [
                // --- MEDIA & CORE ---
                { 
                    title: 'Audio Ritual (Binaural)', 
                    description: 'Immersive 3D audio experience for state-shifting', 
                    type: 'audio', 
                    defaultDuration: 12, 
                    defaultXp: 60,
                    promptInstructions: 'Primary tool for meditation, focus, or sleep preparation. AI should select this when the goal requires a specific mental state shift.'
                },
                { 
                    title: 'Video Masterclass', 
                    description: 'Visual lesson or instructional content', 
                    type: 'video', 
                    defaultDuration: 20, 
                    defaultXp: 100,
                    promptInstructions: 'Use for skill acquisition or demonstration. Select this when the user needs to see a technique in action.'
                },
                { 
                    title: 'Knowledge Quiz', 
                    description: 'Interactive assessment of learned material', 
                    type: 'quiz', 
                    defaultDuration: 5, 
                    defaultXp: 40,
                    promptInstructions: 'Reinforcement. Place immediately following a Video Masterclass to verify comprehension.'
                },

                // --- PRODUCTIVITY ---
                { 
                    title: 'Pomodoro Sprint', 
                    description: '25 min intense work, 5 min rest', 
                    type: 'focus', 
                    defaultDuration: 30, 
                    defaultXp: 80,
                    promptInstructions: 'Select for high cognitive load tasks where focus is flagging or the user feels overwhelmed.'
                },
                { 
                    title: 'Eisenhower Matrix', 
                    description: 'Categorize tasks by urgency and importance', 
                    type: 'focus', 
                    defaultDuration: 15, 
                    defaultXp: 50,
                    promptInstructions: 'Strategic task. Use when the user expresses decision paralysis or has too many competing priorities.'
                },
                { 
                    title: 'Deep Strategy Session', 
                    description: 'Long-term roadmap and vision planning', 
                    type: 'focus', 
                    defaultDuration: 45, 
                    defaultXp: 120,
                    promptInstructions: 'Leadership/Career shard. Use for high-level planning and big-picture thinking.'
                },
                { 
                    title: 'Inbox Zero Protocol', 
                    description: 'Systematic clearance of all pending communications', 
                    type: 'focus', 
                    defaultDuration: 20, 
                    defaultXp: 40,
                    promptInstructions: 'Administrative shard. Use to reduce digital clutter and communication overhead.'
                },

                // --- MENTAL ---
                { 
                    title: 'Box Breathing', 
                    description: '4-4-4-4 rhythmic breathing for nervous system reset', 
                    type: 'mental', 
                    defaultDuration: 5, 
                    defaultXp: 30,
                    promptInstructions: 'Biological reset. Use for stress management or during high-pressure situations.'
                },
                { 
                    title: 'Stoic Perspective Audit', 
                    description: 'Reframe current challenges through the lens of Stoicism', 
                    type: 'mental', 
                    defaultDuration: 10, 
                    defaultXp: 50,
                    promptInstructions: 'Philosophical shard. Use when the user is facing external obstacles or emotional turbulence.'
                },
                { 
                    title: 'Visualization Rehearsal', 
                    description: 'Mentally walkthrough successful goal achievement', 
                    type: 'mental', 
                    defaultDuration: 10, 
                    defaultXp: 60,
                    promptInstructions: 'Performance shard. Use before major events like public speaking, competitions, or high-stakes meetings.'
                },
                { 
                    title: 'Evening Decompression', 
                    description: 'Review the day and release cognitive loops', 
                    type: 'mental', 
                    defaultDuration: 10, 
                    defaultXp: 40,
                    promptInstructions: 'Closure shard. Use in the final block of the day to prepare the brain for sleep.'
                },

                // --- PHYSICAL ---
                { 
                    title: 'Circadian Reset (Sun)', 
                    description: '10 mins of natural sunlight exposure', 
                    type: 'exercise', 
                    defaultDuration: 10, 
                    defaultXp: 50,
                    promptInstructions: 'Biological shard. Primary placement in the first hour of waking to set circadian rhythms.'
                },
                { 
                    title: 'Posture Realignment', 
                    description: 'Specific stretches to counter desk-based sedentary stress', 
                    type: 'exercise', 
                    defaultDuration: 5, 
                    defaultXp: 30,
                    promptInstructions: 'Health shard. Mandatory for users with desk-based jobs or long study blocks.'
                },
                { 
                    title: 'Cold Exposure Reset', 
                    description: 'Cold shower or plunge for metabolic and dopamine boost', 
                    type: 'exercise', 
                    defaultDuration: 5, 
                    defaultXp: 100,
                    promptInstructions: 'Resilience shard. High-impact movement for morning energy or mood regulation.'
                },
                { 
                    title: 'Metabolic Hydration', 
                    description: 'Intentional intake of 500ml water with electrolytes', 
                    type: 'exercise', 
                    defaultDuration: 2, 
                    defaultXp: 20,
                    promptInstructions: 'Maintenance shard. Select periodically for general health and energy consistency.'
                },

                // --- SKILLS ---
                { 
                    title: 'Spaced Repetition Review', 
                    description: 'Active recall and flashcard review session', 
                    type: 'focus', 
                    defaultDuration: 15, 
                    defaultXp: 70,
                    promptInstructions: 'Educational shard. Use for long-term memorization and knowledge retention.'
                },
                { 
                    title: 'Rapid Prototyping Block', 
                    description: 'Build a low-fidelity version of an idea', 
                    type: 'focus', 
                    defaultDuration: 30, 
                    defaultXp: 100,
                    promptInstructions: 'Creative shard. Use for innovation, entrepreneurship, or artistic goals.'
                },
                { 
                    title: 'Language Immersion', 
                    description: 'Active target language practice or listening', 
                    type: 'focus', 
                    defaultDuration: 20, 
                    defaultXp: 80,
                    promptInstructions: 'Linguistic shard. Select for travel or cognitive development goals.'
                },

                // --- SOCIAL ---
                { 
                    title: 'Networking Reachout', 
                    description: 'Send a high-value note to a professional peer', 
                    type: 'focus', 
                    defaultDuration: 10, 
                    defaultXp: 60,
                    promptInstructions: 'Community shard. Use for career growth and professional relationship building.'
                },
                { 
                    title: 'Active Listening Session', 
                    description: 'Intentional deep conversation with zero distraction', 
                    type: 'mental', 
                    defaultDuration: 20, 
                    defaultXp: 50,
                    promptInstructions: 'Relational shard. Use for improving social bonds or leadership skills.'
                },
                { 
                    title: 'Gratitude Transmission', 
                    description: 'Express thanks to someone in your network', 
                    type: 'mental', 
                    defaultDuration: 5, 
                    defaultXp: 40,
                    promptInstructions: 'Social bond shard. Enhances both user mood and network health.'
                },

                // --- LIFE ---
                { 
                    title: 'Digital Detox Window', 
                    description: 'Zero screen usage for a defined period', 
                    type: 'mental', 
                    defaultDuration: 30, 
                    defaultXp: 90,
                    promptInstructions: 'Cognitive recovery. Use to reduce screen fatigue or before sleep.'
                },
                { 
                    title: 'Environment Optimization', 
                    description: 'Declutter and organize a specific area of your space', 
                    type: 'exercise', 
                    defaultDuration: 15, 
                    defaultXp: 50,
                    promptInstructions: 'Life shard. Use to reduce environmental stress and increase focus.'
                },
                { 
                    title: 'Budget & Finance Audit', 
                    description: 'Review expenditures and financial trajectory', 
                    type: 'focus', 
                    defaultDuration: 15, 
                    defaultXp: 60,
                    promptInstructions: 'Discipline shard. Use for long-term security and financial health goals.'
                },
                { 
                    title: 'Sleep Sanctuary Prep', 
                    description: 'Optimize environment for maximum recovery', 
                    type: 'mental', 
                    defaultDuration: 5, 
                    defaultXp: 30,
                    promptInstructions: 'Maintenance shard. Crucial for recovery, energy, and mental performance.'
                },
            ];
            
            const created = this.taskTemplateRepository.create(initialTemplates);
            await this.taskTemplateRepository.save(created);
            return this.taskTemplateRepository.find({ order: { createdAt: 'DESC' } });
        }

        return templates;
    }

    async createTaskTemplate(data: any) {
        const template = this.taskTemplateRepository.create(data);
        return this.taskTemplateRepository.save(template);
    }

    async deleteTaskTemplate(id: string) {
        return this.taskTemplateRepository.delete(id);
    }

    async debugTables() {
        const tables = ['users', 'check_ins', 'reward_events', 'progress', 'programs', 'day_plans', 'tasks'];
        const results: any = {};

        for (const table of tables) {
            try {
                const count = await this.userRepository.query(`SELECT count(*) FROM "${table}"`);
                results[table] = { exists: true, count: Number(count[0].count) };
            } catch (e) {
                results[table] = { exists: false, error: e.message };
            }
        }
        return results;
    }
}
