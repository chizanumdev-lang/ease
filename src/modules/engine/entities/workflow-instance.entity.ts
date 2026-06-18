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
import {
  ObjectType,
  Field,
  ID,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { WorkflowTemplate } from './workflow-template.entity';
import { WorkflowTask } from './workflow-task.entity';

export enum WorkflowStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(WorkflowStatus, {
  name: 'WorkflowStatus',
});

@ObjectType()
@Entity('engine_workflow_instances')
export class WorkflowInstance {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field()
  @Column({ name: 'template_id' })
  templateId: string;

  @Field(() => WorkflowTemplate)
  @ManyToOne(() => WorkflowTemplate)
  @JoinColumn({ name: 'template_id' })
  template: WorkflowTemplate;

  @Field()
  @Column({ name: 'user_goal', type: 'text' })
  userGoal: string;

  @Field(() => WorkflowStatus)
  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.PENDING,
  })
  status: WorkflowStatus;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 })
  progress: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', default: {} })
  metadata: any;

  @Field(() => [WorkflowTask])
  @OneToMany(() => WorkflowTask, (task) => task.program)
  tasks: WorkflowTask[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
