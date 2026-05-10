import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { TasksResolver } from './tasks.resolver';


import { DayPlan } from '../programs/entities/day-plan.entity';
import { ProgressModule } from '../progress/progress.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task, DayPlan, TaskTemplate]),
        ProgressModule,
        RewardsModule,
    ],
    controllers: [TasksController],
    providers: [TasksService, TasksResolver],
    exports: [TasksService],
})
export class TasksModule { }
