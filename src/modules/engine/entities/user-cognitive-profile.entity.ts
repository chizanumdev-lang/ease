import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';

@Entity('user_cognitive_profiles')
export class UserCognitiveProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'attention_span', type: 'float', default: 0.5 })
  attentionSpan: number; // 0-1 (derived from video watch % and quiz speed)

  @Column({ name: 'energy_level', type: 'float', default: 0.5 })
  energyLevel: number; // 0-1 (derived from time of day usage and task completion)

  @Column({ name: 'grit_score', type: 'float', default: 0.5 })
  gritScore: number; // 0-1 (derived from consistency streak and recovery after miss)

  @Column({ name: 'learning_speed', type: 'float', default: 0.5 })
  learningSpeed: number; // 0-1 (derived from quiz scores)

  @Column('jsonb', { name: 'preferred_modalities', default: {} })
  preferredModalities: Record<string, number>; // { 'video': 0.8, 'audio': 0.4 }

  @Column('jsonb', { name: 'skill_gaps', default: {} })
  skillGaps: Record<string, number>; // { 'vocabulary': 0.7, 'focus': 0.2 }

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
