import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalsService } from './goals.service';
import { GoalsResolver } from './goals.resolver';
import { Goal } from './entities/goal.entity';

import { GoalsController } from './goals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Goal])],
  controllers: [GoalsController],
  providers: [GoalsService, GoalsResolver],
  exports: [GoalsService],
})
export class GoalsModule {}
