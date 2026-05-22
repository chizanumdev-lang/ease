import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
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
@Entity('engine_tasks')
export class EngineTask {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'program_id' })
  programId: string;

  @ManyToOne(() => UserProgram, (program) => program.tasks)
  @JoinColumn({ name: 'programId' })
  program: UserProgram;

  @Field()
  @Column({ name: 'node_id' })
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
  @Column({ name: 'input_data', type: 'jsonb', default: {} })
  inputData: any;

  @Field(() => String, { nullable: true })
  @Column({ name: 'output_data', type: 'jsonb', default: {} })
  outputData: any;

  @Field({ nullable: true })
  @Column({ name: 'error_log', type: 'text', nullable: true })
  errorLog: string;

  @Field({ nullable: true })
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Field({ nullable: true })
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Field(() => [AudioAsset])
  @OneToMany(() => AudioAsset, (asset) => asset.task)
  audioAssets: AudioAsset[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
