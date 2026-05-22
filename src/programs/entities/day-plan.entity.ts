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
  status: string; // 'pending' | 'ready' | 'failed'

  @Field(() => [String], { nullable: true })
  @Column({ type: 'jsonb', nullable: true, name: 'focus_areas' })
  focusAreas: string[];

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
