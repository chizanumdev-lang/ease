import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { WorkflowCategory } from './workflow-category.entity';
import { WorkflowNode } from './workflow-node.entity';
import { WorkflowEdge } from './workflow-edge.entity';

@ObjectType()
@Entity('goal_templates')
export class WorkflowTemplate {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'category_id' })
  categoryId: string;

  @Field(() => WorkflowCategory)
  @ManyToOne(() => WorkflowCategory, (category) => category.templates)
  @JoinColumn({ name: 'category_id' })
  category: WorkflowCategory;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field()
  @Column({ name: 'meta_prompt', type: 'text' })
  metaPrompt: string;

  @Field()
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Field(() => Int)
  @Column({ default: 1 })
  version: number;

  @Field(() => [WorkflowNode])
  @OneToMany(() => WorkflowNode, (node) => node.template)
  nodes: WorkflowNode[];

  @Field(() => [WorkflowEdge])
  @OneToMany(() => WorkflowEdge, (edge) => edge.template)
  edges: WorkflowEdge[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
