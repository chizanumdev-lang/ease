import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from '../../../ai/ai.service';
import { UserProgram, ProgramStatus } from '../entities/user-program.entity';
import { GoalTemplate } from '../entities/goal-template.entity';
import { EngineTask, ExecutionStatus } from '../entities/task.entity';
import { WorkflowNode } from '../entities/workflow-node.entity';
import { WorkflowEdge } from '../entities/workflow-edge.entity';
import {
  TaskDefinition,
  CapabilityType,
} from '../entities/task-definition.entity';

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(
    @InjectRepository(UserProgram)
    private programRepo: Repository<UserProgram>,
    @InjectRepository(GoalTemplate)
    private templateRepo: Repository<GoalTemplate>,
    @InjectRepository(EngineTask)
    private taskRepo: Repository<EngineTask>,
    private aiService: AiService,
  ) {}

  async planProgram(
    userId: string,
    templateId: string,
    userGoal: string,
  ): Promise<UserProgram> {
    this.logger.log(
      `Planning program for user ${userId} with goal: "${userGoal}"`,
    );

    // 1. Fetch the blueprint
    const template = await this.templateRepo.findOne({
      where: { id: templateId, isActive: true },
      relations: ['nodes', 'nodes.taskDefinition', 'edges'],
    });

    if (!template) {
      throw new Error('Goal template not found or inactive');
    }

    // 2. Create the UserProgram instance
    const program = this.programRepo.create({
      userId,
      templateId,
      userGoal,
      status: ProgramStatus.PENDING,
      progress: 0,
      metadata: {
        plannedAt: new Date().toISOString(),
        version: template.version,
      },
    });

    const savedProgram = await this.programRepo.save(program);

    // 3. Process nodes in topological order to maintain causal consistency
    // Deduplicate nodes first to prevent processing the same node multiple times if TypeORM relations are duplicated
    const uniqueNodesMap = new Map(template.nodes.map((n) => [n.id, n]));
    const uniqueNodes = Array.from(uniqueNodesMap.values());

    const sortedNodes = this.topologicalSort(uniqueNodes, template.edges);
    const plannedContext = new Map<string, any>();
    const tasks: EngineTask[] = [];

    for (const node of sortedNodes) {
      this.logger.debug(
        `Generating context-aware plan for node: ${node.label} (${node.taskDefinition.capability})`,
      );

      // Get results from direct predecessors to provide context
      const predecessorIds = template.edges
        .filter((e) => e.toNodeId === node.id)
        .map((e) => e.fromNodeId);

      const context = predecessorIds
        .map((id) => ({
          nodeLabel: uniqueNodesMap.get(id)?.label,
          output: plannedContext.get(id),
        }))
        .filter((c) => c.output);

      let inputData = { ...node.config };

      // Generate AI-driven input with dependency context
      if (
        node.taskDefinition.capability === CapabilityType.TEXT ||
        node.taskDefinition.capability === CapabilityType.AUDIO
      ) {
        inputData = await this.generateNodeInput(
          template,
          node,
          userGoal,
          context,
        );
      }

      plannedContext.set(node.id, inputData);

      const task = this.taskRepo.create({
        programId: savedProgram.id,
        nodeId: node.id,
        status: ExecutionStatus.QUEUED,
        inputData,
      });

      tasks.push(task);
    }

    const savedTasks = await this.taskRepo.save(tasks);

    // 4. Update program status to ACTIVE
    savedProgram.status = ProgramStatus.ACTIVE;
    await this.programRepo.save(savedProgram);

    return this.findFullProgram(savedProgram.id);
  }

  private async generateNodeInput(
    template: GoalTemplate,
    node: WorkflowNode,
    userGoal: string,
    context: any[],
  ): Promise<any> {
    const contextPrompt =
      context.length > 0
        ? `PREVIOUS TASK CONTEXT (This task depends on these):
         ${context.map((c) => `Task "${c.nodeLabel}": ${JSON.stringify(c.output)}`).join('\n')}`
        : '';

    const prompt = `
      You are the "Adaptive Engine" for Ease. 
      Your job is to generate specific input data for a single task node in a larger workflow.

      MASTER BLUEPRINT CONTEXT:
      Program Title: "${template.title}"
      Master Instructions (Meta-Prompt): "${template.metaPrompt}"
      
      USER CONTEXT:
      User's Personal Goal: "${userGoal}"
      
      ${contextPrompt}
      
      CURRENT TASK NODE:
      Label: "${node.label}"
      Task Capability: "${node.taskDefinition.capability}"
      Base Config: ${JSON.stringify(node.config)}

      INSTRUCTION:
      Based on the Master Instructions, the User's Goal, and the provided PREVIOUS TASK CONTEXT, generate the specific JSON input needed for this "${node.label}" task.
      
      CRITICAL RULE: This task MUST be grounded in the PREVIOUS TASK CONTEXT if provided.
      - If this is a Quiz or reflection: Generate questions/prompts that DIRECTLY reference specific details from the "output" of the previous tasks.
      - DO NOT generate abstract or generic questions like "How do you feel?".
      - INSTEAD, ask things like "In the video about X, what was the 3rd step mentioned?".
      
      The output must be a valid JSON object matching the structure of the "Base Config".
      Return ONLY the raw JSON object.
    `;

    return this.aiService.generateCustomJson(prompt, node.config);
  }

  private topologicalSort(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
  ): WorkflowNode[] {
    const sorted: WorkflowNode[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) throw new Error('Cycle detected in workflow');
      if (!visited.has(nodeId)) {
        temp.add(nodeId);
        const outgoingEdges = edges.filter((e) => e.fromNodeId === nodeId);
        for (const edge of outgoingEdges) {
          visit(edge.toNodeId);
        }
        temp.delete(nodeId);
        visited.add(nodeId);
        const node = nodes.find((n) => n.id === nodeId);
        if (node) sorted.unshift(node);
      }
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) visit(node.id);
    }

    // DO NOT REVERSE here. With unshift(node) after recursive visits,
    // the sources end up at the front of the array.
    return sorted;
  }

  private async findFullProgram(id: string): Promise<UserProgram> {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: [
        'template',
        'tasks',
        'tasks.node',
        'tasks.node.taskDefinition',
      ],
    });

    if (!program) throw new Error(`Program ${id} not found`);
    return program;
  }
}
