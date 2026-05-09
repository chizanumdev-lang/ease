import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsService } from './programs.service';
import { ProgressionService } from './progression.service';
import { ProgramsResolver } from './programs.resolver';
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

import { ProgramsController } from './programs.controller';

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
        UsersModule,
        AiModule,
        VideoModule,
        AudioModule,
    ],
    controllers: [ProgramsController],
    providers: [ProgramsService, ProgressionService, ProgramsResolver],
    exports: [ProgramsService, ProgressionService],
})
export class ProgramsModule { }
