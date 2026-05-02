import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from '../../../ai/ai.service';
import { UserProgram, ProgramStatus } from '../entities/user-program.entity';
import { GoalTemplate } from '../entities/goal-template.entity';
import { Task, ExecutionStatus } from '../entities/task.entity';
import { WorkflowNode } from '../entities/workflow-node.entity';
import { TaskDefinition, CapabilityType } from '../entities/task-definition.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(
    @InjectRepository(UserProgram)
    private programRepo: Repository<UserProgram>,
    @InjectRepository(GoalTemplate)
    private templateRepo: Repository<GoalTemplate>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    private aiService: AiService,
    @InjectQueue('engine_queue')
    private engineQueue: Queue,
  ) {}

  /**
   * The "Master Planner" entry point.
   * Takes a template (blueprint) and personalizes it for a user's goal.
   */
  async planProgram(userId: string, templateId: string, userGoal: string): Promise<UserProgram> {
    this.logger.log(`Planning program for user ${userId} with goal: "${userGoal}"`);

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

    // 3. Generate Sub-Prompts for each node using the Meta-Prompt
    const tasks: Task[] = [];
    
    for (const node of template.nodes) {
      this.logger.debug(`Generating plan for node: ${node.label} (${node.taskDefinition.capability})`);
      
      let inputData = { ...node.config };
      
      // If the node requires AI input, generate it
      if (node.taskDefinition.capability === CapabilityType.TEXT || node.taskDefinition.capability === CapabilityType.AUDIO) {
        inputData = await this.generateNodeInput(template, node, userGoal);
      }

      const task = this.taskRepo.create({
        programId: savedProgram.id,
        nodeId: node.id,
        status: ExecutionStatus.QUEUED,
        inputData,
      });
      
      tasks.push(task);
    }

    const savedTasks = await this.taskRepo.save(tasks);

    // 4. Queue the first task(s)
    // For now, we queue ALL tasks to the distributed workers. 
    // The workers will handle them based on priority or dependencies later.
    for (const task of savedTasks) {
      await this.engineQueue.add('process_task', { taskId: task.id });
    }

    // 5. Update program status to ACTIVE
    savedProgram.status = ProgramStatus.ACTIVE;
    await this.programRepo.save(savedProgram);

    return this.findFullProgram(savedProgram.id);
  }

  private async generateNodeInput(template: GoalTemplate, node: WorkflowNode, userGoal: string): Promise<any> {
    const prompt = `
      You are the "Adaptive Engine" for Ease. 
      Your job is to generate specific input data for a single task node in a larger workflow.

      MASTER BLUEPRINT CONTEXT:
      Program Title: "${template.title}"
      Master Instructions (Meta-Prompt): "${template.metaPrompt}"
      
      USER CONTEXT:
      User's Personal Goal: "${userGoal}"
      
      CURRENT TASK NODE:
      Label: "${node.label}"
      Task Capability: "${node.taskDefinition.capability}"
      Base Config: ${JSON.stringify(node.config)}

      INSTRUCTION:
      Based on the Master Instructions and the User's Goal, generate the specific JSON input needed for this "${node.label}" task.
      The output must be a valid JSON object that fits the task's requirements.
      
      If it's a TEXT/Scripting task, generate the personalized script.
      If it's an AUDIO task, generate the mood, theme, and duration hints.
      
      Return ONLY the raw JSON object.
    `;

    return this.aiService.generateCustomJson(prompt, node.config);
  }

  private async findFullProgram(id: string): Promise<UserProgram> {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: ['template', 'tasks', 'tasks.node', 'tasks.node.taskDefinition'],
    });

    if (!program) throw new Error(`Program ${id} not found`);
    return program;
  }
}
