import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { TaskShard } from '../modules/engine/entities/task-shard.entity';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const shardRepository = dataSource.getRepository(TaskShard);

  const jsonPath = path.join(process.cwd(), 'research/output/task-templates.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Templates JSON not found at:', jsonPath);
    await app.close();
    return;
  }

  const shards = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`🧹 Clearing existing shards...`);
  await shardRepository.clear();

  console.log(`🌱 Seeding ${shards.length} consolidated task templates...`);

  for (const s of shards) {
    try {
        await shardRepository.save({
            name: s.name,
            displayName: s.displayName,
            modality: s.modality,
            description: s.description,
            typicalDurationMinutes: s.typicalDurationMinutes || 10,
            energyLevel: s.energy || 'medium',
            difficultyBase: s.difficulty_base || 5,
            category: s.category || 'journal',
            intensity: s.intensity || 5,
            metadata: s.metadata || {}
        });
    } catch (e: any) {
        console.error(`Failed to seed ${s.name}:`, e.message);
    }
  }

  const count = await shardRepository.count();
  console.log(`✅ Total shards in DB: ${count}`);
  await app.close();
}

bootstrap();
