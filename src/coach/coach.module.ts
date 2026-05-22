import { Module } from '@nestjs/common';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { GoalsModule } from '../goals/goals.module';
import { TasksModule } from '../tasks/tasks.module';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { ProgressModule } from '../progress/progress.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    GoalsModule,
    TasksModule,
    QuizzesModule,
    ProgressModule,
  ],
  controllers: [CoachController],
  providers: [CoachService],
})
export class CoachModule {}
