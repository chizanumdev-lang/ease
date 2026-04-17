export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedAt?: Date;
}

export interface DailyCompletion {
    date: string;
    completionRate: number;
}

import { ProgressionData } from '../../programs/progression.service';

export class WeeklyAnalyticsDto {
    currentStreak: number;
    completionRate: number;
    todayCompletionRate: number;
    weeklyCompletionRate: number;
    quizAverage: number;
    pointsEarned: number;
    badges: Badge[];
    dailyCompletions: DailyCompletion[];
    progression: ProgressionData;
}
