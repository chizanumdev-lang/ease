import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { GoalsService } from '../goals/goals.service';
import { TasksService } from '../tasks/tasks.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import { ProgressService } from '../progress/progress.service';
import { Goal } from '../goals/entities/goal.entity';
import { Task } from '../tasks/entities/task.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { Progress } from '../progress/entities/progress.entity';

@Injectable()
export class CoachService {
    private genAI: GoogleGenerativeAI;
    private readonly logger = new Logger(CoachService.name);

    constructor(
        private configService: ConfigService,
        private goalsService: GoalsService,
        private tasksService: TasksService,
        private quizzesService: QuizzesService,
        private progressService: ProgressService,
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY is not defined in the environment variables.');
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    async generateCoachMessage(userId: string, userMessage: string) {
        try {
            if (!this.genAI) {
                throw new Error('Gemini API key not configured');
            }

            // 1. Gather Context
            const context = await this.gatherContext(userId);

            // 2. Construct Prompt
            const systemInstruction = `
      You are "Ease AI", a supportive, empathetic, slightly analytical accountability coach.
      Your goal is to help the user achieve their goals by analyzing their data and providing actionable advice.
      
      User Context:
      ${JSON.stringify(context, null, 2)}
      
      Response Contract (JSON):
      {
        "reply": string (max 2-3 sentences, effectively addressing the user),
        "tone": "supportive" | "direct" | "analytical",
        "suggested_actions": [
          { "type": "reduce_load" | "increase_difficulty" | "reschedule" | "encourage_review", "details": string }
        ],
        "safety_flag": boolean (true if user expresses self-harm, severe distress, or medical issues)
      }
      
      Guidelines:
      - Be concise.
      - If progress is good, celebrate.
      - If progress is stalled, suggest small, manageable steps.
      - If safety_flag is true, 'reply' must trigger a generic support message fallback in the client or be a safe, non-clinical response.
      `;

            // 3. Call Gemini
            const model = this.genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: systemInstruction,
                generationConfig: { responseMimeType: "application/json" }
            });

            const result = await model.generateContent(userMessage);
            const response = await result.response;
            const text = response.text();

            if (!text) throw new Error('Empty AI response');

            // 4. Validate Response
            const schema = z.object({
                reply: z.string(),
                tone: z.enum(['supportive', 'direct', 'analytical']),
                suggested_actions: z.array(z.object({
                    type: z.enum(['reduce_load', 'increase_difficulty', 'reschedule', 'encourage_review']),
                    details: z.string(),
                })).optional(),
                safety_flag: z.boolean(),
            });

            const parsed = schema.parse(JSON.parse(text));

            // 5. Hard Gaurdrail for Safety
            if (parsed.safety_flag) {
                return {
                    reply: "I'm hearing that you're going through a tough time. While I'm an AI coach and can't provide professional help, please reach out to a qualified professional or a support hotline if you're in distress. Your well-being is the most important thing.",
                    tone: 'supportive',
                    safety_flag: true,
                    suggested_actions: []
                };
            }

            return parsed;

        } catch (error) {
            this.logger.error('AI Coach Error', error);
            // Fallback
            return {
                reply: "I'm having a little trouble connecting to my brain right now. But looking at your progress, keep creating small wins! We can chat more later.",
                tone: 'supportive',
                safety_flag: false,
                suggested_actions: [{ type: 'encourage_review', details: 'Check back later' }]
            };
        }
    }

    private async gatherContext(userId: string) {
        const [activeGoal, recentTasks, recentQuizzes, recentProgress] = await Promise.all([
            this.goalsService.findActive(userId).catch(() => null) as Promise<Goal | null>,
            this.tasksService.findRecent(userId).catch(() => []) as Promise<Task[]>,
            this.quizzesService.findRecentAttempts(userId).catch(() => []) as Promise<QuizAttempt[]>,
            this.progressService.findRecent(userId).catch(() => []) as Promise<Progress[]>,
        ]);

        // Calculate basic stats for the prompt
        const completedTasks = recentTasks.filter(t => t.completed).length;
        const avgQuizScore = recentQuizzes.length > 0
            ? recentQuizzes.reduce((acc, q) => acc + q.score, 0) / recentQuizzes.length
            : 0;

        return {
            goal: activeGoal ? activeGoal.title : 'No active goal',
            recent_activity: {
                tasks_completed_last_7_days: completedTasks,
                total_tasks_assigned: recentTasks.length,
                avg_quiz_score: Math.round(avgQuizScore),
                checkins_last_7_days: recentProgress.length,
                latest_mood: recentProgress[0]?.mood || 'unknown',
            },
            raw_progress: recentProgress.map(p => ({ date: p.checkinDate, mood: p.mood })),
        };
    }
}
