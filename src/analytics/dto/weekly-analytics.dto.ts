import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { ProgressionData } from '../../programs/progression.service';

@ObjectType()
export class Badge {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field()
    description: string;

    @Field()
    icon: string;

    @Field()
    earned: boolean;

    @Field({ nullable: true })
    earnedAt?: Date;
}

@ObjectType()
export class DailyCompletion {
    @Field()
    date: string;

    @Field(() => Int)
    completionRate: number;
}

@ObjectType()
export class WeeklyAnalyticsDto {
    @Field(() => Int)
    currentStreak: number;

    @Field(() => Int)
    completionRate: number;

    @Field(() => Int)
    todayCompletionRate: number;

    @Field(() => Int)
    weeklyCompletionRate: number;

    @Field(() => Int)
    quizAverage: number;

    @Field(() => Int)
    pointsEarned: number;

    @Field(() => [Badge])
    badges: Badge[];

    @Field(() => [DailyCompletion])
    dailyCompletions: DailyCompletion[];

    @Field(() => GraphQLJSON, { nullable: true })
    progression: any;

}

