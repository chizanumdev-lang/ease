import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { Goal } from './entities/goal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Goal])],
    controllers: [GoalsController],
    providers: [GoalsService],
    exports: [GoalsService],
})
export class GoalsModule { }
