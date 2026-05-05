import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { GoalTemplate } from './goal-template.entity';
import { Task } from './task.entity';

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
  @Column()
  userId: string;

  @Field()
  @Column()
  templateId: string;

  @Field(() => GoalTemplate)
  @ManyToOne(() => GoalTemplate)
  @JoinColumn({ name: 'templateId' })
  template: GoalTemplate;

  @Field()
  @Column({ type: 'text' })
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

  @Field(() => [Task])
  @OneToMany(() => Task, (task) => task.program)
  tasks: Task[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
