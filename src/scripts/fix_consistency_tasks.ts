import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { Program } from '../programs/entities/program.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const taskRepo = app.get<Repository<Task>>(getRepositoryToken(Task));
    const dayPlanRepo = app.get<Repository<DayPlan>>(getRepositoryToken(DayPlan));
    const programRepo = app.get<Repository<Program>>(getRepositoryToken(Program));
    const progressRepo = app.get<Repository<Progress>>(getRepositoryToken(Progress));

    console.log('--- Starting Consistency Task Fix Script ---');

    // 1. Find all active programs with status 'active' or 'generating'
    const programs = await programRepo.find();
    
    for (const program of programs) {
        console.log(`Processing program: ${program.title} (${program.id}) for user ${program.userId}`);

        // 2. Find today's plan
        const startDate = new Date(program.createdAt);
        startDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffMs = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const dayNumber = Math.min(Math.max(diffDays + 1, 1), program.duration);

        const dayPlan = await dayPlanRepo.findOne({
            where: { programId: program.id, dayNumber },
            relations: ['tasks']
        });

        if (!dayPlan) {
            console.log(`  No plan found for today (Day ${dayNumber}). skipping.`);
            continue;
        }

        console.log(`  Found Day ${dayNumber} plan. Updating tasks...`);

        // 3. Get current streak for the user
        const checkIns = await progressRepo.find({
            where: { userId: program.userId },
            order: { checkinDate: 'DESC' },
            take: 30
        });

        let streak = 0;
        if (checkIns.length > 0) {
            const latest = new Date(checkIns[0].checkinDate);
            latest.setHours(0, 0, 0, 0);
            if (Math.floor((today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)) <= 1) {
                streak = 1;
                for (let i = 1; i < checkIns.length; i++) {
                    const curr = new Date(checkIns[i].checkinDate);
                    const prev = new Date(checkIns[i-1].checkinDate);
                    curr.setHours(0,0,0,0); prev.setHours(0,0,0,0);
                    if (Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)) === 1) streak++;
                    else break;
                }
            }
        }

        // 4. Update tasks
        // Logic: Journal -> 3, Reflection -> 4, Consistency -> 5
        const tasks = dayPlan.tasks;
        for (const task of tasks) {
            if (task.type === 'journal') {
                task.order = 3;
                await taskRepo.save(task);
            } else if (task.type === 'reflection') {
                task.order = 4;
                await taskRepo.save(task);
            } else if (task.type === 'consistency' || task.title.toLowerCase().includes('commitment')) {
                task.order = 5;
                task.description = `i will complete my routine tommorrow. this will be day ${streak + 1} of my streak.`;
                await taskRepo.save(task);
            }
        }
        console.log(`  Fixed tasks for Day ${dayNumber}.`);
    }

    console.log('--- Script Completed ---');
    await app.close();
}

bootstrap();
