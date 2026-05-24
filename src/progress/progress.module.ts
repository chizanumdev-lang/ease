import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { Progress } from './entities/progress.entity';
import { CheckIn } from './entities/check-in.entity';
import { ProgressResolver } from './progress.resolver';



@Module({
  imports: [TypeOrmModule.forFeature([Progress, CheckIn])],
  controllers: [ProgressController],
  providers: [ProgressService, ProgressResolver],
  exports: [ProgressService],
})
export class ProgressModule {}
