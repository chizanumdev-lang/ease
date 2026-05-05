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
  @Column()
  templateId: string;

  @ManyToOne(() => GoalTemplate, (template) => template.nodes)
  @JoinColumn({ name: 'templateId' })
  template: GoalTemplate;

  @Field()
  @Column()
  taskDefinitionId: string;

  @Field(() => TaskDefinition)
  @ManyToOne(() => TaskDefinition)
  @JoinColumn({ name: 'taskDefinitionId' })
  taskDefinition: TaskDefinition;

  @Field()
  @Column()
  label: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', default: {} })
  config: any;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 })
  positionX: number;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 })
  positionY: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
