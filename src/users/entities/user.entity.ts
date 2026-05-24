import {
  Entity,
  PrimaryGeneratedColumn,
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
import { Progress } from '../../progress/entities/progress.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Field()
  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any> | null;

  @Column({ type: 'varchar', nullable: true, name: 'refresh_token' })
  refreshToken: string | null;

  @Field()
  @Column({ default: false, name: 'is_admin' })
  isAdmin: boolean;

  @Field()
  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'verification_code' })
  verificationCode: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'verification_expires' })
  verificationExpires: Date | null;



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
