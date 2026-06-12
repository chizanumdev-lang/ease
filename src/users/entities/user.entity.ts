import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Goal } from '../../goals/entities/goal.entity';
import { Program } from '../../programs/entities/program.entity';
import { QuizAttempt } from '../../quizzes/entities/quiz-attempt.entity';
import { Progress } from '../../progress/entities/progress.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  id: string; // Matches auth.users.id — set by Supabase Auth

  @Field()
  @Column({ unique: true })
  email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any> | null;

  @Field()
  @Column({ default: false, name: 'is_admin' })
  isAdmin: boolean;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => [Goal], { nullable: true })
  @OneToMany(() => Goal, (goal) => goal.user)
  goals: Goal[];

  @Field(() => [Program], { nullable: true })
  @OneToMany(() => Program, (program) => program.user)
  programs: Program[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.user)
  quizAttempts: QuizAttempt[];

  @OneToMany(() => Progress, (progress) => progress.user)
  progress: Progress[];
}
