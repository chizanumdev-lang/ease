import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('api_cost_logs')
export class ApiCostLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  service: string; // e.g., 'openai', 'gemini', 'elevenlabs'

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  cost: number;

  @Column({ nullable: true })
  currency: string; // e.g., 'USD'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
