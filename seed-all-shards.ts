import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskShard } from './src/modules/engine/entities/task-shard.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const shardRepo = app.get<Repository<TaskShard>>(getRepositoryToken(TaskShard));

  const jsonPath = path.join(process.cwd(), 'research/output/task-shards.json');
  const shardsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`Loaded ${shardsData.length} shards from JSON.`);

  // Clear existing shards to avoid conflicts and ensure fresh start
  console.log('Clearing existing shards...');
  await shardRepo.query('TRUNCATE task_shards CASCADE');

  console.log('Inserting shards in batches...');
  const batchSize = 100;
  for (let i = 0; i < shardsData.length; i += batchSize) {
    const batch = shardsData.slice(i, i + batchSize);
    // Map JSON fields to entity fields if necessary
    const mappedBatch = batch.map((s: any) => ({
      name: s.name,
      displayName: s.display_name || s.displayName,
      modality: s.modality,
      description: s.description,
      typicalDurationMinutes: s.typical_duration_minutes || s.typicalDurationMinutes || 15,
      energyLevel: s.energy_level || s.energyLevel || 'medium',
      xpReward: s.xp_reward || s.xpReward || 50,
      aiPromptTemplate: s.ai_prompt_template || s.aiPromptTemplate || {},
      metadata: s.metadata || {}
    }));
    await shardRepo.save(mappedBatch);
    console.log(`Inserted ${i + mappedBatch.length} / ${shardsData.length}`);
  }

  console.log('Seeding complete!');
  await app.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
