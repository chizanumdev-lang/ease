import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowCategory } from '../entities/workflow-category.entity';
import { WorkflowInstance, WorkflowStatus } from '../entities/workflow-instance.entity';
import { WorkflowTemplate } from '../entities/workflow-template.entity';
import { WorkflowNode } from '../entities/workflow-node.entity';
import { WorkflowEdge } from '../entities/workflow-edge.entity';
import { TaskDefinition } from '../entities/task-definition.entity';

@Injectable()
export class EngineService {
  constructor(
    @InjectRepository(WorkflowCategory)
    private categoryRepo: Repository<WorkflowCategory>,
    @InjectRepository(WorkflowInstance)
    private programRepo: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowTemplate)
    private templateRepo: Repository<WorkflowTemplate>,
    @InjectRepository(TaskDefinition)
    private taskDefRepo: Repository<TaskDefinition>,
    @InjectRepository(WorkflowNode)
    private nodeRepo: Repository<WorkflowNode>,
    @InjectRepository(WorkflowEdge)
    private edgeRepo: Repository<WorkflowEdge>,
  ) {}

  async findAllCategories(): Promise<WorkflowCategory[]> {
    return this.categoryRepo.find({ relations: ['templates'] });
  }

  async findAllTaskDefinitions(): Promise<TaskDefinition[]> {
    return this.taskDefRepo.find();
  }

  async createProgram(
    userId: string,
    templateId: string,
    userGoal: string,
  ): Promise<WorkflowInstance> {
    const program = this.programRepo.create({
      userId,
      templateId,
      userGoal,
      status: WorkflowStatus.PENDING,
      progress: 0,
    });
    return this.programRepo.save(program);
  }

  async findProgramById(id: string): Promise<WorkflowInstance> {
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

  async saveBlueprint(
    templateId: string,
    nodes: any[],
    edges: any[],
  ): Promise<WorkflowTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
    });
    if (!template) throw new Error(`Template ${templateId} not found`);

    // Clear existing nodes and edges for this template
    await this.edgeRepo.delete({ templateId });
    await this.nodeRepo.delete({ templateId });

    // Save new nodes
    const savedNodes = await Promise.all(
      nodes.map((n) => {
        const node = this.nodeRepo.create({
          id: n.id, // Assuming the UI provides consistent IDs
          templateId,
          taskDefinitionId: n.data.taskDefinitionId,
          label: n.data.label,
          config: n.data.config || {},
          positionX: n.position.x,
          positionY: n.position.y,
        });
        return this.nodeRepo.save(node);
      }),
    );

    // Save new edges
    await Promise.all(
      edges.map((e) => {
        const edge = this.edgeRepo.create({
          templateId,
          fromNodeId: e.source,
          toNodeId: e.target,
        });
        return this.edgeRepo.save(edge);
      }),
    );

    return template;
  }
}
