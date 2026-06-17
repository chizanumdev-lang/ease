import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { Program } from './program.entity';
import { Task } from '../../tasks/entities/task.entity';
import { AudioTrack } from '../../audio/entities/audio-track.entity';
import { Quiz } from '../../quizzes/entities/quiz.entity';

@ObjectType()
@Entity('day_plans')
export class DayPlan {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int)
  @Column({ type: 'int', name: 'day_number' })
  dayNumber: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  theme: string;

  @Field()
  @Column({ default: 'pending' })
  status: string; // 'pending' | 'generating' | 'ready' | 'failed'

  /**
   * Phase 1 skeleton: pre-baked structure generated cheaply at program creation.
   * Contains shard selections, theme, difficulty arc, and content intent.
   * Populated before any Task records exist.
   */
  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  skeleton: {
    selectedShards: string[]; // exact shard names, one per category
    theme: string;
    focusAreas: string[];
    videoIntent: string; // broad topic for YouTube search
    journalFocus: string; // what aspect to prompt the user on
    difficultyArc: number; // 1–10
  } | null;

  /**
   * Tracks whether Phase 1 skeleton has been generated for this day.
   * 'none'  → not yet generated (use legacy generateDayBlueprint fallback)
   * 'ready' → skeleton exists, orchestrator uses adaptiveFillFromSkeleton
   */
  @Field()
  @Column({ default: 'none', name: 'skeleton_status' })
  skeletonStatus: string;

  @Field(() => [String], { nullable: true })
  @Column({ type: 'jsonb', nullable: true, name: 'focus_areas' })
  focusAreas: string[];

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true, name: 'locked_at' })
  lockedAt: Date | null;

  @Field()
  @Index()
  @Column({ name: 'program_id' })
  programId: string;

  @ManyToOne(() => Program, (program) => program.dayPlans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Field(() => [Task], { nullable: true })
  @OneToMany(() => Task, (task) => task.dayPlan)
  tasks: Task[];

  @Field(() => [AudioTrack], { nullable: true })
  @OneToMany(() => AudioTrack, (audioTrack) => audioTrack.dayPlan)
  audioTracks: AudioTrack[];

  @Field(() => [Quiz], { nullable: true })
  @OneToMany(() => Quiz, (quiz) => quiz.dayPlan)
  quizzes: Quiz[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
