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

@Entity('progress')
export class Progress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date', name: 'checkin_date' })
    checkinDate: Date;

    @Column({ nullable: true })
    mood: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'jsonb', nullable: true })
    metrics: Record<string, any>;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, (user) => user.progress, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
