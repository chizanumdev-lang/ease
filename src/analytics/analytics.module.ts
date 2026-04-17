import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CheckIn } from '../progress/entities/check-in.entity';
import { Task } from '../tasks/entities/task.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { Program } from '../programs/entities/program.entity';
import { RewardEvent } from '../rewards/entities/reward-event.entity';
import { ProgramsModule } from '../programs/programs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CheckIn, Task, QuizAttempt, DayPlan, RewardEvent, Program]),
        ProgramsModule,
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
