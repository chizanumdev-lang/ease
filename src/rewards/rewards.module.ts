import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardEvent } from './entities/reward-event.entity';
import { User } from '../users/entities/user.entity';
import { RewardsService } from './rewards.service';
import { ProgramsModule } from '../programs/programs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([RewardEvent, User]),
        ProgramsModule,
    ],
    providers: [RewardsService],
    exports: [RewardsService],
})
export class RewardsModule { }
