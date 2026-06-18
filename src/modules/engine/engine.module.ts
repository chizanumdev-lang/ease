import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngineService } from './services/engine.service';
import { PlannerService } from './services/planner.service';
import { EngineResolver } from './resolvers/engine.resolver';
import { AiModule } from '../../ai/ai.module';
import { VideoModule } from '../../video/video.module';
import { AudioModule } from '../../audio/audio.module';
import { WorkflowCategory } from './entities/workflow-category.entity';
import { WorkflowTemplate } from './entities/workflow-template.entity';
import { WorkflowNode } from './entities/workflow-node.entity';
import { WorkflowEdge } from './entities/workflow-edge.entity';
import { TaskDefinition } from './entities/task-definition.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { OrchestratorService } from './services/orchestrator.service';
import { SkeletonService } from './services/skeleton.service';
import { AiPromptingService } from './services/ai-prompting.service';
import { MediaHydrationService } from './services/media-hydration.service';
import { UserCognitiveProfile } from './entities/user-cognitive-profile.entity';
import { DayPlan } from '../../programs/entities/day-plan.entity';
import { Program } from '../../programs/entities/program.entity';
import { Task as DailyTask } from '../../tasks/entities/task.entity';
import { WorkflowTask } from './entities/workflow-task.entity';
import { TaskShard } from './entities/task-shard.entity';
import { AudioAsset } from './entities/audio-asset.entity';

@Module({
  imports: [
    AiModule,
    VideoModule,
    AudioModule,
    TypeOrmModule.forFeature([
      WorkflowCategory,
      WorkflowTemplate,
      WorkflowNode,
      WorkflowEdge,
      TaskDefinition,
      WorkflowInstance,
      TaskShard,
      AudioAsset,
      UserCognitiveProfile,
      DayPlan,
      Program,
      DailyTask,
      WorkflowTask,
    ]),
  ],
  providers: [
    EngineService,
    PlannerService,
    OrchestratorService,
    SkeletonService,
    AiPromptingService,
    MediaHydrationService,
    EngineResolver,
  ],
  exports: [
    EngineService,
    PlannerService,
    OrchestratorService,
    SkeletonService,
    AiPromptingService,
    MediaHydrationService,
  ],
})
export class EngineModule {}
