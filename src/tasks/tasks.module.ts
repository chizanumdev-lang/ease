import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { TaskTemplate } from './entities/task-template.entity';

import { BullModule } from '@nestjs/bullmq';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { ProgressModule } from '../progress/progress.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task, DayPlan, TaskTemplate]),
        BullModule.registerQueue({ name: 'program-generation' }),
        ProgressModule,
    ],
    controllers: [TasksController],
    providers: [TasksService],
    exports: [TasksService],
})
export class TasksModule { }
