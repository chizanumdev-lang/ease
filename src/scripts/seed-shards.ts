import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const sqlPath = path.join(process.cwd(), 'research/output/seed-task-shards.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🌱 Seeding task shards...');

  // Split SQL by semicolon and execute parts, or just execute the whole thing if the driver supports it
  // TypeORM's query runner can execute multiple statements usually if separated correctly or using raw query
  try {
    // We remove the SELECT COUNT part from the end to avoid return type issues
    const cleanSql = sql.split('SELECT COUNT(*)')[0];
    
    await dataSource.query(cleanSql);
    
    const count = await dataSource.query('SELECT COUNT(*) as count FROM task_shards');
    console.log(`✅ Seeded ${count[0].count} shards successfully.`);
  } catch (error) {
    console.error('❌ Error seeding shards:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
