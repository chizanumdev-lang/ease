import { Module } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngineTask } from '../engine/entities/task.entity';
import { UserProgram } from '../engine/entities/user-program.entity';
import { BullModule } from '@nestjs/bullmq';
import { BackgroundService } from './background.service';
import { BackgroundProcessor } from './processors/background.processor';
import { AudioModule } from '../../audio/audio.module';
// Note: RitualsService is in ProgramsModule which might cause a circular dependency.
// For now we will forwardRef it or import the module if possible.

@Module({
  imports: [
    EngineModule,
    AudioModule,
    TypeOrmModule.forFeature([EngineTask, UserProgram]),
    BullModule.registerQueue({
      name: 'background-jobs',
    }),
  ],
  providers: [BackgroundService, BackgroundProcessor],
  exports: [BackgroundService],
})
export class WorkerModule {}
