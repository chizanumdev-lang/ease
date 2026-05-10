import { Module } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../engine/entities/task.entity';
import { UserProgram } from '../engine/entities/user-program.entity';

@Module({
  imports: [
    EngineModule,
    TypeOrmModule.forFeature([Task, UserProgram]),
  ],
  providers: [],
  exports: [],
})
export class WorkerModule {}
