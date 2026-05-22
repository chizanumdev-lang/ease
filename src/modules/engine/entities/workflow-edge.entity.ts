import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GoalTemplate } from './goal-template.entity';
import { WorkflowNode } from './workflow-node.entity';

@ObjectType()
@Entity('workflow_edges')
export class WorkflowEdge {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => GoalTemplate, (template) => template.edges)
  @JoinColumn({ name: 'template_id' })
  template: GoalTemplate;

  @Field()
  @Column({ name: 'from_node_id' })
  fromNodeId: string;

  @Field(() => WorkflowNode)
  @ManyToOne(() => WorkflowNode)
  @JoinColumn({ name: 'from_node_id' })
  fromNode: WorkflowNode;

  @Field()
  @Column({ name: 'to_node_id' })
  toNodeId: string;

  @Field(() => WorkflowNode)
  @ManyToOne(() => WorkflowNode)
  @JoinColumn({ name: 'to_node_id' })
  toNode: WorkflowNode;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
