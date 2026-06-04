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
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Goal } from '../../goals/entities/goal.entity';
import { DayPlan } from './day-plan.entity';
import { RitualTrack } from '../../audio/entities/ritual-track.entity';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('programs')
export class Program {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column({ default: 'generating' })
  status: string; // 'generating' | 'ready' | 'failed'

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Field(() => Int)
  @Column({ type: 'int' })
  duration: number;

  @Field()
  @Column({ type: 'float', default: 0, name: 'mastery_score' })
  masteryScore: number;

  @Field()
  @Column({ type: 'varchar', default: 'Novice', name: 'competence_level' })
  competenceLevel: string;

  @Field()
  @Column({ name: 'goal_id' })
  goalId: string;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Goal, (goal) => goal.programs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: Goal;

  @ManyToOne(() => User, (user) => user.programs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => [DayPlan], { nullable: true })
  @OneToMany(() => DayPlan, (dayPlan) => dayPlan.program)
  dayPlans: DayPlan[];

  @Field(() => [RitualTrack], { nullable: true })
  @OneToMany(() => RitualTrack, (ritualTrack) => ritualTrack.program)
  ritualTracks: RitualTrack[];

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
