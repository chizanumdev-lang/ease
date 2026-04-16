import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { DayPlan } from '../../programs/entities/day-plan.entity';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    type: string;

    @Column({ nullable: true })
    duration: number;

    @Column({ type: 'timestamp', nullable: true, name: 'scheduled_at' })
    scheduledAt?: Date;

    @Column({ default: false })
    completed: boolean;

    @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
    completedAt?: Date;

    @Column({ nullable: true, name: 'video_url' })
    videoUrl?: string;

    @Column({ nullable: true, name: 'quiz_id' })
    quizId?: string;

    @Column({ type: 'text', nullable: true })
    content?: string;

    @Column({ default: 0, name: 'watched_seconds' })
    watchedSeconds: number;

    @Column({ nullable: true, name: 'total_duration' })
    totalDuration?: number;

    @Column({ default: 0 })
    order: number;

    @Index()
    @Column({ name: 'day_plan_id' })
    dayPlanId: string;

    @ManyToOne(() => DayPlan, (dayPlan) => dayPlan.tasks, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'day_plan_id' })
    dayPlan: DayPlan;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
