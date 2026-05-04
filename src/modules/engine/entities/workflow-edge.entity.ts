import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
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
  @Column()
  templateId: string;

  @ManyToOne(() => GoalTemplate, (template) => template.edges)
  @JoinColumn({ name: 'templateId' })
  template: GoalTemplate;

  @Field()
  @Column()
  fromNodeId: string;

  @Field(() => WorkflowNode)
  @ManyToOne(() => WorkflowNode)
  @JoinColumn({ name: 'fromNodeId' })
  fromNode: WorkflowNode;

  @Field()
  @Column()
  toNodeId: string;

  @Field(() => WorkflowNode)
  @ManyToOne(() => WorkflowNode)
  @JoinColumn({ name: 'toNodeId' })
  toNode: WorkflowNode;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
