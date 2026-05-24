import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { TasksResolver } from './tasks.resolver';

import { DayPlan } from '../programs/entities/day-plan.entity';
import { ProgressModule } from '../progress/progress.module';
import { Program } from '../programs/entities/program.entity';
import { AiModule } from '../ai/ai.module';
import { VideoModule } from '../video/video.module';
import { AudioModule } from '../audio/audio.module';
import { EngineModule } from '../modules/engine/engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, DayPlan, TaskTemplate, Program]),
    ProgressModule,
    AiModule,
    VideoModule,
    AudioModule,
    EngineModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksResolver],
  exports: [TasksService],
})
export class TasksModule {}
