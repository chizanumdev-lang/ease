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
import { DayPlan } from '../../programs/entities/day-plan.entity';
import { QuizAttempt } from './quiz-attempt.entity';

@Entity('quizzes')
export class Quiz {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'jsonb' })
    questions: Array<{
        question: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
    }>;

    @Column({ name: 'day_plan_id' })
    dayPlanId: string;

    @ManyToOne(() => DayPlan, (dayPlan) => dayPlan.quizzes, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'day_plan_id' })
    dayPlan: DayPlan;

    @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
    attempts: QuizAttempt[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
