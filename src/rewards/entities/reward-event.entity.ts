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

@Entity('reward_events')
export class RewardEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'event_type' })
    eventType: string;

    @Column({ type: 'int' })
    points: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, (user) => user.rewardEvents, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
