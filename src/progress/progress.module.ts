import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { Progress } from './entities/progress.entity';
import { CheckIn } from './entities/check-in.entity';
import { RewardEvent } from '../rewards/entities/reward-event.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Progress, CheckIn, RewardEvent])],
    controllers: [ProgressController],
    providers: [ProgressService],
    exports: [ProgressService],
})
export class ProgressModule { }
