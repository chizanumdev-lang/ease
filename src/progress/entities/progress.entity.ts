import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('progress')
export class Progress {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'date', name: 'checkin_date' })
  checkinDate: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  mood: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metrics: Record<string, any>;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
