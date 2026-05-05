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
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Quiz } from './quiz.entity';

@ObjectType()
@Entity('quiz_attempts')
@Index(['userId', 'createdAt'])
export class QuizAttempt {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => [Int])
    @Column({ type: 'jsonb' })
    answers: number[];

    @Field(() => Int)
    @Column({ type: 'int' })
    score: number;

    @Field()
    @Column({ default: false })
    passed: boolean;

    @Field()
    @Column({ name: 'quiz_id' })
    quizId: string;

    @Field()
    @Column({ name: 'user_id' })
    userId: string;

    @Field(() => Quiz)
    @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quiz_id' })
    quiz: Quiz;

    @ManyToOne(() => User, (user) => user.quizAttempts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
