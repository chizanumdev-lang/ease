import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ProgramsService } from './src/programs/programs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DayPlan } from './src/programs/entities/day-plan.entity';
import { User } from './src/users/entities/user.entity';
import { Goal } from './src/goals/entities/goal.entity';
import { GenerateProgramDto } from './src/programs/dto/generate-program.dto';
import { Repository } from 'typeorm';

async function bootstrap() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('Context loaded successfully.');

  const programsService = app.get(ProgramsService);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const goalRepo = app.get<Repository<Goal>>(getRepositoryToken(Goal));
  const dayPlanRepo = app.get<Repository<DayPlan>>(getRepositoryToken(DayPlan));

  const userId = 'f9b3fbfa-8ecd-4084-9b52-b52a8438a704';
  const goalId = '26f06e70-aa7f-48a6-9923-010b9b72592c';

  const user = await userRepo.findOne({ where: { id: userId } });
  const goal = await goalRepo.findOne({ where: { id: goalId } });

  if (!user || !goal) {
    console.error('User or Goal not found.');
    await app.close();
    return;
  }

  const dto = new GenerateProgramDto();
  dto.goalId = goal.id;
  dto.duration = 7;
  dto.minutesPerDay = 15;
  dto.learningStyle = 'visual';

  console.log(`\nGenerating 7-day program for goal: ${goal.title}...`);
  console.log('This will trigger SkeletonService (batch AI generation) and then OrchestratorService (hydration for Day 1).\n');
  
  const startTime = Date.now();
  const program = await programsService.generateProgram(user.id, dto);
  const elapsed = (Date.now() - startTime) / 1000;
  
  console.log(`\nProgram Generation Complete in ${elapsed}s! ID:`, program.id);
  console.log('Program Status:', program.status);

  console.log('\n--- Day Plans Summary ---');
  const plans = await dayPlanRepo.find({ 
    where: { programId: program.id }, 
    order: { dayNumber: 'ASC' } 
  });
  
  for (const p of plans) {
    console.log(`\nDay ${p.dayNumber} [Status: ${p.status}] [Skeleton Status: ${p.skeletonStatus}]`);
    if (p.skeleton) {
      console.log(`Theme: ${p.skeleton.theme}`);
      console.log(`Selected Shards:`, p.skeleton.selectedShards);
    }
  }

  await app.close();
}
bootstrap().catch(console.error);
