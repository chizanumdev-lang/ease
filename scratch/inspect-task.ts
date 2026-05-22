import { NestFactory } from '@nestjs/core';

// Force DATABASE_URL to target the remote database
process.env.DATABASE_URL =
  'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20$now.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../src/tasks/entities/task.entity';
import { Repository } from 'typeorm';

async function inspect() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const taskRepo = app.get<Repository<Task>>(getRepositoryToken(Task));
    const options = taskRepo.metadata.connection.options as {
      host?: string;
      database?: string;
      url?: string;
    };
    console.log('--- Database Connection Metadata ---');
    console.log('Driver host:', options.host);
    console.log('Driver database:', options.database);
    console.log('Driver URL:', options.url);

    const taskId = '6755c40c-e405-4538-a3ec-c4567109757e';

    const task = await taskRepo.findOne({
      where: { id: taskId },
    });

    if (!task) {
      console.log('❌ Task not found!');
      return;
    }

    console.log('\n--- Fetched Task Entity ---');
    console.log('task id:', task.id);
    console.log('dayPlanId:', task.dayPlanId);

    const rawDayPlan: unknown = await taskRepo.manager.query(
      'SELECT * FROM day_plans WHERE id = $1',
      [task.dayPlanId],
    );
    console.log('\n--- Raw DayPlan check in TypeORM DB ---');
    console.log('DayPlan found:', rawDayPlan);
  } catch (err) {
    console.error(err);
  } finally {
    await app.close();
  }
}

void inspect();
