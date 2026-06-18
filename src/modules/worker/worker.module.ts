import { Module } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowTask } from '../engine/entities/workflow-task.entity';
import { WorkflowInstance } from '../engine/entities/workflow-instance.entity';
import { BullModule } from '@nestjs/bullmq';
import { BackgroundService } from './background.service';
import { AudioModule } from '../../audio/audio.module';
// Note: RitualsService is in ProgramsModule which might cause a circular dependency.
// For now we will forwardRef it or import the module if possible.

@Module({
  imports: [
    EngineModule,
    AudioModule,
    TypeOrmModule.forFeature([WorkflowTask, WorkflowInstance]),
    BullModule.registerQueue({
      name: 'background-jobs',
    }),
  ],
  providers: [BackgroundService],
  exports: [BackgroundService],
})
export class WorkerModule {}
