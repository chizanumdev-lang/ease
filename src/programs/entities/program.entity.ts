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
import { User } from '../../users/entities/user.entity';
import { Goal } from '../../goals/entities/goal.entity';
import { DayPlan } from './day-plan.entity';

@Entity('programs')
export class Program {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ default: 'generating' })
    status: string; // 'generating' | 'ready' | 'failed'

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'int' })
    duration: number;

    @Column({ name: 'goal_id' })
    goalId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => Goal, (goal) => goal.programs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'goal_id' })
    goal: Goal;

    @ManyToOne(() => User, (user) => user.programs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => DayPlan, (dayPlan) => dayPlan.program)
    dayPlans: DayPlan[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
