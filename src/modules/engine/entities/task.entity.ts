import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { UserProgram } from './user-program.entity';
import { WorkflowNode } from './workflow-node.entity';
import { AudioAsset } from './audio-asset.entity';

export enum ExecutionStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(ExecutionStatus, {
  name: 'ExecutionStatus',
});

@ObjectType()
@Entity('tasks')
export class Task {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  programId: string;

  @ManyToOne(() => UserProgram, (program) => program.tasks)
  @JoinColumn({ name: 'programId' })
  program: UserProgram;

  @Field()
  @Column()
  nodeId: string;

  @Field(() => WorkflowNode)
  @ManyToOne(() => WorkflowNode)
  @JoinColumn({ name: 'nodeId' })
  node: WorkflowNode;

  @Field(() => ExecutionStatus)
  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.QUEUED,
  })
  status: ExecutionStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', default: {} })
  inputData: any;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', default: {} })
  outputData: any;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  errorLog: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Field(() => [AudioAsset])
  @OneToMany(() => AudioAsset, (asset) => asset.task)
  audioAssets: AudioAsset[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
