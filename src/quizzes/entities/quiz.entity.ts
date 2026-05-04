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
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { DayPlan } from '../../programs/entities/day-plan.entity';
import { QuizAttempt } from './quiz-attempt.entity';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('quizzes')
export class Quiz {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    title: string;

    @Field(() => GraphQLJSON)
    @Column({ type: 'jsonb' })
    questions: Array<{
        question: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
    }>;

    @Field()
    @Column({ name: 'day_plan_id' })
    dayPlanId: string;

    @ManyToOne(() => DayPlan, (dayPlan) => dayPlan.quizzes, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'day_plan_id' })
    dayPlan: DayPlan;

    @Field(() => [QuizAttempt], { nullable: true })
    @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
    attempts: QuizAttempt[];

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
