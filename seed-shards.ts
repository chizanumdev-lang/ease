import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskShard } from './src/modules/engine/entities/task-shard.entity';
import { Repository } from 'typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const shardRepo = app.get<Repository<TaskShard>>(getRepositoryToken(TaskShard));

  const count = await shardRepo.count();
  console.log(`Current shard count: ${count}`);

  if (count === 0) {
    console.log('Seeding initial shards...');
    const shards = [
      {
        name: 'awareness',
        displayName: 'Awareness Module',
        modality: 'video',
        description: 'Visual instruction and conceptual learning.',
        typicalDurationMinutes: 10,
        xpReward: 50,
        aiPromptTemplate: { type: 'video_search' }
      },
      {
        name: 'deep-practice',
        displayName: 'Deep Practice',
        modality: 'audio',
        description: 'Immersive audio-guided practice or meditation.',
        typicalDurationMinutes: 15,
        xpReward: 75,
        aiPromptTemplate: { type: 'audio_mix' }
      },
      {
        name: 'cognitive-lab',
        displayName: 'Cognitive Lab',
        modality: 'quiz',
        description: 'Interactive challenge to test and reinforce knowledge.',
        typicalDurationMinutes: 5,
        xpReward: 30,
        aiPromptTemplate: { type: 'quiz_gen' }
      },
      {
        name: 'reflective-journal',
        displayName: 'Reflective Journal',
        modality: 'journal',
        description: 'Metacognitive writing to process learning and set intent.',
        typicalDurationMinutes: 5,
        xpReward: 25,
        aiPromptTemplate: { type: 'journal_prompt' }
      },
      {
        name: 'check-in',
        displayName: 'Consistency Check-in',
        modality: 'consistency',
        description: 'Daily commitment and habit reinforcement.',
        typicalDurationMinutes: 2,
        xpReward: 20,
        aiPromptTemplate: { type: 'commitment' }
      }
    ];

    await shardRepo.save(shards);
    console.log('Seeding complete!');
  }

  await app.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
