import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function run() {
  console.log('Bootstrapping app to drop legacy columns...');
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Running ALTER TABLE statements...');
  try {
    await dataSource.query('ALTER TABLE "tasks" DROP COLUMN IF EXISTS "xp_reward";');
    console.log('Dropped xp_reward from tasks.');
  } catch (e) {
    console.log('Failed to drop xp_reward from tasks:', e.message);
  }

  try {
    await dataSource.query('ALTER TABLE "task_templates" DROP COLUMN IF EXISTS "default_xp";');
    console.log('Dropped default_xp from task_templates.');
  } catch (e) {
    console.log('Failed to drop default_xp from task_templates:', e.message);
  }

  // Also clear progression logic from user preferences or programs if needed
  // (The user asked if we might have to clear the database. This just cleans the dead schema).

  await app.close();
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
