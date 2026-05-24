import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ProgramsService } from '../src/programs/programs.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const programsService = app.get(ProgramsService);

  const programId = '2d8ce997-88af-4fb9-9c00-884086d6e02f';
  const goalText = 'I want to learn how to cook launch meals';
  const params = {
    duration: 30,
    minutesPerDay: 30,
    learningStyle: 'mixed',
    constraints: [],
    wakeStart: '07:00',
    sleepStart: '23:00',
  };

  console.log(`Manually hydrating Day 1 for program ${programId}...`);
  try {
    // Find Day 1 ID
    const status = await programsService.getProgramStatus(programId);
    const day1 = status.days.find((d) => d.dayNumber === 1);
    if (!day1) {
      console.error('Day 1 not found');
      return;
    }

    console.log(
      `Found Day 1 with ID (index-based lookup might be needed, using dayNumber)`,
    );

    // We need the ACTUAL ID from the DB. My status check uses dayNumber.
    // Let's just find it from the repo.
    const { getRepositoryToken } = require('@nestjs/typeorm');
    const { DayPlan } = require('../src/programs/entities/day-plan.entity');
    const dayPlanRepo = app.get(getRepositoryToken(DayPlan));
    const dayRecord = await dayPlanRepo.findOne({
      where: { programId, dayNumber: 1 },
    });

    if (!dayRecord) {
      console.error('Day 1 record not found');
      return;
    }

    await programsService.hydrateDay(dayRecord.id, goalText);
    console.log('Hydration successful!');
  } catch (err) {
    console.error('Hydration failed:', err);
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Manual hydration failed:', err);
  process.exit(1);
});
