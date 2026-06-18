import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { EngineService } from '../services/engine.service';
import { PlannerService } from '../services/planner.service';
import { AiPromptingService } from '../services/ai-prompting.service';
import { WorkflowCategory } from '../entities/workflow-category.entity';
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub() as any;

import { TaskDefinition } from '../entities/task-definition.entity';
import { WorkflowTemplate } from '../entities/workflow-template.entity';
import { NodeInput, EdgeInput } from '../dto/blueprint-input';
import { ShardSimulationResult } from '../dto/shard-simulation.dto';

@Resolver()
export class EngineResolver {
  constructor(
    private readonly engineService: EngineService,
    private readonly plannerService: PlannerService,
    private readonly aiPromptingService: AiPromptingService,
  ) {}

  @Query(() => [WorkflowCategory])
  async getCategories() {
    return this.engineService.findAllCategories();
  }

  @Query(() => [TaskDefinition])
  async getTaskDefinitions() {
    return this.engineService.findAllTaskDefinitions();
  }

  @Query(() => WorkflowInstance)
  async getProgram(@Args('id') id: string) {
    return this.engineService.findProgramById(id);
  }

  @Mutation(() => WorkflowInstance)
  async createProgram(
    @Args('templateId') templateId: string,
    @Args('userGoal') userGoal: string,
    @Args('userId') userId: string,
  ) {
    const program = await this.plannerService.planProgram(
      userId,
      templateId,
      userGoal,
    );
    pubSub.publish('programCreated', { programCreated: program });
    return program;
  }

  @Mutation(() => WorkflowTemplate)
  async saveBlueprint(
    @Args('templateId') templateId: string,
    @Args({ name: 'nodes', type: () => [NodeInput] }) nodes: NodeInput[],
    @Args({ name: 'edges', type: () => [EdgeInput] }) edges: EdgeInput[],
  ) {
    return this.engineService.saveBlueprint(templateId, nodes, edges);
  }

  @Subscription(() => WorkflowInstance)
  programCreated() {
    return pubSub.asyncIterator('programCreated');
  }

  @Query(() => [ShardSimulationResult])
  async simulateBlueprint(@Args('prompt') prompt: string) {
    return this.aiPromptingService.simulateBlueprintSelection(prompt);
  }

  @Query(() => String)
  async hello() {
    return 'Ease Adaptive Engine Online';
  }
}
