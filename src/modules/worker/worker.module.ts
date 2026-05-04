import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TaskProcessor } from './processors/task.processor';
import { EngineModule } from '../engine/engine.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../engine/entities/task.entity';
import { UserProgram } from '../engine/entities/user-program.entity';

@Module({
  imports: [
    EngineModule,
    TypeOrmModule.forFeature([Task, UserProgram]),
    BullModule.registerQueue({
      name: 'engine_queue',
    }),
  ],
  providers: [TaskProcessor],
  exports: [BullModule],
})
export class WorkerModule {}
