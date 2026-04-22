import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Goal } from '../../goals/entities/goal.entity';
import { Program } from '../../programs/entities/program.entity';
import { QuizAttempt } from '../../quizzes/entities/quiz-attempt.entity';
import { Progress } from '../../progress/entities/progress.entity';
import { RewardEvent } from '../../rewards/entities/reward-event.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    name: string;

    @Column({ type: 'jsonb', nullable: true })
    settings: Record<string, any>;

    @Column({ nullable: true })
    refreshToken: string;

    @Column({ default: false })
    isAdmin: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Goal, (goal) => goal.user)
    goals: Goal[];

    @OneToMany(() => Program, (program) => program.user)
    programs: Program[];

    @OneToMany(() => QuizAttempt, (attempt) => attempt.user)
    quizAttempts: QuizAttempt[];

    @OneToMany(() => Progress, (progress) => progress.user)
    progress: Progress[];

    @OneToMany(() => RewardEvent, (reward) => reward.user)
    rewardEvents: RewardEvent[];
}
