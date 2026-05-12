import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { GoalTemplate } from './goal-template.entity';
import { TaskDefinition } from './task-definition.entity';

@ObjectType()
@Entity('workflow_nodes')
export class WorkflowNode {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => GoalTemplate, (template) => template.nodes)
  @JoinColumn({ name: 'template_id' })
  template: GoalTemplate;

  @Field()
  @Column({ name: 'task_definition_id' })
  taskDefinitionId: string;

  @Field(() => TaskDefinition)
  @ManyToOne(() => TaskDefinition)
  @JoinColumn({ name: 'task_definition_id' })
  taskDefinition: TaskDefinition;

  @Field()
  @Column()
  label: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', default: {} })
  config: any;

  @Field(() => Float)
  @Column({ name: 'position_x', type: 'float', default: 0 })
  positionX: number;

  @Field(() => Float)
  @Column({ name: 'position_y', type: 'float', default: 0 })
  positionY: number;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
