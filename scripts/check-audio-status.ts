import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DayPlan } from '../src/programs/entities/day-plan.entity';
import { AudioTrack } from '../src/audio/entities/audio-track.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dayPlanRepo = app.get<Repository<DayPlan>>(getRepositoryToken(DayPlan));
  const audioTrackRepo = app.get<Repository<AudioTrack>>(
    getRepositoryToken(AudioTrack),
  );

  const programId = '46683b59-504c-461a-80f7-c01915a3cf91';
  console.log(`Checking status for program ${programId}...`);

  const day1 = await dayPlanRepo.findOne({
    where: { programId, dayNumber: 1 },
    relations: ['audioTracks'],
  });

  if (!day1) {
    console.error('Day 1 not found');
  } else {
    console.log(`Day 1 Status: ${day1.status}`);
    console.log(`Audio Tracks (${day1.audioTracks.length}):`);
    for (const track of day1.audioTracks) {
      console.log(`  - Title: ${track.title}`);
      console.log(`    URL: ${track.url || 'EMPTY'}`);
      console.log(`    Metadata: ${JSON.stringify(track.metadata)}`);
    }
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
