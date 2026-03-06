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
import { Quiz } from './quiz.entity';

@Entity('quiz_attempts')
export class QuizAttempt {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'jsonb' })
    answers: number[];

    @Column({ type: 'int' })
    score: number;

    @Column({ default: false })
    passed: boolean;

    @Column({ name: 'quiz_id' })
    quizId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quiz_id' })
    quiz: Quiz;

    @ManyToOne(() => User, (user) => user.quizAttempts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
