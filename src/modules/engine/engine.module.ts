import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngineService } from './services/engine.service';
import { PlannerService } from './services/planner.service';
import { EngineResolver } from './resolvers/engine.resolver';
import { AiModule } from '../../ai/ai.module';
import { VideoModule } from '../../video/video.module';
import { AudioModule } from '../../audio/audio.module';
import { GoalCategory } from './entities/goal-category.entity';
import { GoalTemplate } from './entities/goal-template.entity';
import { WorkflowNode } from './entities/workflow-node.entity';
import { WorkflowEdge } from './entities/workflow-edge.entity';
import { TaskDefinition } from './entities/task-definition.entity';
import { UserProgram } from './entities/user-program.entity';
import { OrchestratorService } from './services/orchestrator.service';
import { SkeletonService } from './services/skeleton.service';
import { UserCognitiveProfile } from './entities/user-cognitive-profile.entity';
import { DayPlan } from '../../programs/entities/day-plan.entity';
import { Program } from '../../programs/entities/program.entity';
import { Task as DailyTask } from '../../tasks/entities/task.entity';
import { EngineTask } from './entities/task.entity';
import { TaskShard } from './entities/task-shard.entity';
import { AudioAsset } from './entities/audio-asset.entity';

@Module({
  imports: [
    AiModule,
    VideoModule,
    AudioModule,
    TypeOrmModule.forFeature([
      GoalCategory,
      GoalTemplate,
      WorkflowNode,
      WorkflowEdge,
      TaskDefinition,
      UserProgram,
      TaskShard,
      AudioAsset,
      UserCognitiveProfile,
      DayPlan,
      Program,
      DailyTask,
      EngineTask,
    ]),
  ],
  providers: [
    EngineService,
    PlannerService,
    OrchestratorService,
    SkeletonService,
    EngineResolver,
  ],
  exports: [EngineService, PlannerService, OrchestratorService, SkeletonService],
})
export class EngineModule {}
