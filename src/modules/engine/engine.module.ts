import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngineService } from './services/engine.service';
import { PlannerService } from './services/planner.service';
import { EngineResolver } from './resolvers/engine.resolver';
import { AiModule } from '../../ai/ai.module';
import { GoalCategory } from './entities/goal-category.entity';
import { GoalTemplate } from './entities/goal-template.entity';
import { WorkflowNode } from './entities/workflow-node.entity';
import { WorkflowEdge } from './entities/workflow-edge.entity';
import { TaskDefinition } from './entities/task-definition.entity';
import { UserProgram } from './entities/user-program.entity';
import { Task } from './entities/task.entity';
import { AudioAsset } from './entities/audio-asset.entity';
import { TaskShard } from './entities/task-shard.entity';
import { OrchestratorService } from './services/orchestrator.service';
import { UserCognitiveProfile } from './entities/user-cognitive-profile.entity';
import { DayPlan } from '../../programs/entities/day-plan.entity';
import { Program } from '../../programs/entities/program.entity';

@Module({
  imports: [
    AiModule,
    TypeOrmModule.forFeature([
      GoalCategory,
      GoalTemplate,
      WorkflowNode,
      WorkflowEdge,
      TaskDefinition,
      UserProgram,
      Task,
      AudioAsset,
      TaskShard,
      UserCognitiveProfile,
      DayPlan,
      Program,
    ]),
  ],
  providers: [EngineService, PlannerService, OrchestratorService, EngineResolver],
  exports: [EngineService, PlannerService, OrchestratorService],
})
export class EngineModule {}
