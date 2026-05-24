import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';

import { CheckIn } from '../progress/entities/check-in.entity';
import { Task } from '../tasks/entities/task.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { Program } from '../programs/entities/program.entity';
import { ProgramsModule } from '../programs/programs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckIn, Task, QuizAttempt, DayPlan, Program]),
    ProgramsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsResolver],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
