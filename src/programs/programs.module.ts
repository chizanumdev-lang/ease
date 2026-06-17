import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsService } from './programs.service';
import { ProgramSetupService } from './program-setup.service';
import { ProgramAudioService } from './program-audio.service';


import { ProgramsResolver } from './programs.resolver';
import { ProgramSchedulerService } from './program-scheduler.service';
import { ProgramAdaptationService } from './program-adaptation.service';
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
import { EngineModule } from '../modules/engine/engine.module';

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
      Progress,
    ]),
    UsersModule,
    AiModule,
    VideoModule,
    AudioModule,
    EngineModule,
  ],
  controllers: [ProgramsController],
  providers: [
    ProgramSetupService,
    ProgramAudioService,
    ProgramsService,
    ProgramSchedulerService,
    ProgramAdaptationService,
    ProgramsResolver,
  ],
  exports: [
    ProgramSetupService,
    ProgramAudioService,
    ProgramsService,
    ProgramSchedulerService,
    ProgramAdaptationService,
  ],
})
export class ProgramsModule {}
