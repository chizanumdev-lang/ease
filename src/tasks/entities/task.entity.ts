import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DayPlan } from '../../programs/entities/day-plan.entity';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

export interface BaseTaskMetadata {
  shardId?: string;
  status?: 'hydrating' | 'ready' | 'error';
  pattern?: string;
}

export interface VideoTaskMetadata extends BaseTaskMetadata {
  searchQuery?: string;
}

export interface AudioTaskMetadata extends BaseTaskMetadata {
  narrationScript?: string;
  targetScript?: string;
  audioUrl?: string;
}

export interface QuizTaskMetadata extends BaseTaskMetadata {
  questions?: string[];
  scenario?: string;
  options?: any[];
  cards?: any[];
}

export type TaskMetadata = VideoTaskMetadata &
  AudioTaskMetadata &
  QuizTaskMetadata & { [key: string]: any };

@ObjectType('DailyTask')
@Entity('tasks')
export class Task {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'text' })
  title: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  type: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  duration: number;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'scheduled_at' })
  scheduledAt?: Date;

  @Field()
  @Column({ default: false })
  completed: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'video_url' })
  videoUrl?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'quiz_id' })
  quizId?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  content?: string;

  @Field(() => Int)
  @Column({ default: 0, name: 'watched_seconds' })
  watchedSeconds: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true, name: 'total_duration' })
  totalDuration?: number;

  @Field(() => Int)
  @Column({ default: 0 })
  order: number;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: TaskMetadata;

  @Field()
  @Index()
  @Column({ name: 'day_plan_id' })
  dayPlanId: string;

  @ManyToOne(() => DayPlan, (dayPlan) => dayPlan.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'day_plan_id' })
  dayPlan: DayPlan;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
