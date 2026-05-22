import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Adding columns to task_shards...');
  try {
    await dataSource.query(
      `ALTER TABLE task_shards ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'journal'`,
    );
    await dataSource.query(
      `ALTER TABLE task_shards ADD COLUMN IF NOT EXISTS intensity INTEGER DEFAULT 5`,
    );
    console.log('Columns added successfully!');
  } catch (e: any) {
    console.error('Failed to add columns:', e.message);
  }

  await app.close();
}

run();
