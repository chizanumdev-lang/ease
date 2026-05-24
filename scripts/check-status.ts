import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DayPlan } from '../src/programs/entities/day-plan.entity';
import { Program } from '../src/programs/entities/program.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dayPlanRepo = app.get<Repository<DayPlan>>(getRepositoryToken(DayPlan));
  const programRepo = app.get<Repository<Program>>(getRepositoryToken(Program));

  const programs = await programRepo.find({
    order: { createdAt: 'DESC' },
    take: 1,
  });
  if (programs.length === 0) {
    console.log('No programs found');
  } else {
    const p = programs[0];
    console.log(`Latest Program: ${p.title} (${p.id}) - Status: ${p.status}`);
    const days = await dayPlanRepo.find({
      where: { programId: p.id },
      order: { dayNumber: 'ASC' },
    });
    for (const d of days) {
      console.log(`  Day ${d.dayNumber}: ${d.status} - Theme: ${d.theme}`);
    }
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
