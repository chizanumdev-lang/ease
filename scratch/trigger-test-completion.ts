import { NestFactory } from '@nestjs/core';

// Force DATABASE_URL to target the remote database
process.env.DATABASE_URL =
  'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20$now.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

import { AppModule } from '../src/app.module';
import { TasksService } from '../src/tasks/tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DayPlan } from '../src/programs/entities/day-plan.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { Repository } from 'typeorm';

async function testCompletion() {
  console.log(
    'Bootstrapping NestJS application context (pointing to production Supabase db)...',
  );
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tasksService = app.get(TasksService);
    const dayPlanRepo = app.get<Repository<DayPlan>>(
      getRepositoryToken(DayPlan),
    );
    const taskRepo = app.get<Repository<Task>>(getRepositoryToken(Task));

    const taskId = 'dc8d57bb-148d-43a8-b090-d9eb9bd2b815';
    const day2Id = 'abcc92f6-4b23-4c78-84cc-a3a7f436f929';

    console.log('\n--- Resetting Database State for Clean Test ---');

    // Reset consistency task to incomplete
    await taskRepo.update(taskId, {
      completed: false,
      completedAt: null as unknown as Date,
    });
    console.log('✓ Consistency task reset to completed=false');

    // Reset Day 2 plan to pending
    await dayPlanRepo.update(day2Id, {
      status: 'pending',
    });
    console.log('✓ Day 2 plan status reset to pending');

    console.log(`\nChecking Day 2 status before completion...`);
    let day2 = await dayPlanRepo.findOne({ where: { id: day2Id } });
    console.log(`Day 2 status: ${day2?.status}`);

    console.log(`\nCompleting task ${taskId} (consistency task of Day 1)...`);
    const updatedTask = await tasksService.update(taskId, { completed: true });
    console.log(
      `Task completed! completedAt: ${updatedTask.completedAt ? String(updatedTask.completedAt) : 'null'}`,
    );

    console.log('\n--- Polling Day 2 Plan Status ---');
    const startTime = Date.now();
    const timeoutMs = 300000; // 5 minutes
    let completed = false;

    while (Date.now() - startTime < timeoutMs) {
      day2 = await dayPlanRepo.findOne({ where: { id: day2Id } });
      console.log(
        `[${new Date().toLocaleTimeString()}] Day 2 status: ${day2?.status}`,
      );

      if (day2?.status === 'ready') {
        console.log(
          '\n🎉 SUCCESS! Day 2 has been successfully hydrated and its status is now "ready"!',
        );
        completed = true;
        break;
      } else if (day2?.status === 'failed') {
        console.log(
          '\n❌ Hydration failed! Day 2 status is "failed". Check application logs.',
        );
        break;
      }

      // Wait 5 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (!completed && day2?.status !== 'ready' && day2?.status !== 'failed') {
      console.log('\n⌛ Timeout reached before hydration finished.');
    }
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await app.close();
  }
}

testCompletion().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
