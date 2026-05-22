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
import { GoalTemplate } from './goal-template.entity';
import { EngineTask } from './task.entity';

export enum ProgramStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(ProgramStatus, {
  name: 'ProgramStatus',
});

@ObjectType()
@Entity('user_programs_engine')
export class UserProgram {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @Field()
  @Column({ name: 'template_id' })
  templateId: string;

  @Field(() => GoalTemplate)
  @ManyToOne(() => GoalTemplate)
  @JoinColumn({ name: 'template_id' })
  template: GoalTemplate;

  @Field()
  @Column({ name: 'user_goal', type: 'text' })
  userGoal: string;

  @Field(() => ProgramStatus)
  @Column({
    type: 'enum',
    enum: ProgramStatus,
    default: ProgramStatus.PENDING,
  })
  status: ProgramStatus;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 })
  progress: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', default: {} })
  metadata: any;

  @Field(() => [EngineTask])
  @OneToMany(() => EngineTask, (task) => task.program)
  tasks: EngineTask[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
