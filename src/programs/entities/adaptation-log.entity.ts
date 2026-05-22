import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Program } from './program.entity';

@Entity('adaptation_logs')
export class AdaptationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'program_id' })
  programId: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ name: 'rule_triggered' })
  ruleTriggered: string;

  @Column({ name: 'action_taken', type: 'text' })
  actionTaken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
