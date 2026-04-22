import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('ai_generation_logs')
export class AiGenerationLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    type: string; // e.g., 'program_generation', 'task_adaptation'

    @Column()
    model: string; // e.g., 'gpt-4o', 'gemini-1.5-pro'

    @Column({ type: 'text', nullable: true })
    prompt: string;

    @Column({ type: 'text', nullable: true })
    response: string;

    @Column()
    status: 'success' | 'failure';

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage: string;

    @Column({ type: 'int', nullable: true })
    latency: number; // in milliseconds

    @Column({ name: 'token_count', type: 'int', nullable: true })
    tokenCount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
