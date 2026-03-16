import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { Program } from './entities/program.entity';
import { DayPlan } from './entities/day-plan.entity';
import { Task } from '../tasks/entities/task.entity';
import { AudioTrack } from '../audio/entities/audio-track.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { Goal } from '../goals/entities/goal.entity';
import { AdaptationLog } from './entities/adaptation-log.entity';
import { Progress } from '../progress/entities/progress.entity';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';
import { VideoModule } from '../video/video.module';
import { AudioModule } from '../audio/audio.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Program,
            DayPlan,
            Task,
            AudioTrack,
            Quiz,
            QuizAttempt,
            Goal,
            AdaptationLog,
            Progress
        ]),
        BullModule.registerQueue({
            name: 'audio-generation',
        }),
        UsersModule,
        AiModule,
        VideoModule,
        AudioModule,
    ],
    controllers: [ProgramsController],
    providers: [ProgramsService],
    exports: [ProgramsService],
})
export class ProgramsModule { }
