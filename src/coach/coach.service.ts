/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { GoalsService } from '../goals/goals.service';
import { TasksService } from '../tasks/tasks.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import { ProgressService } from '../progress/progress.service';
import { Task } from '../tasks/entities/task.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { Progress } from '../progress/entities/progress.entity';

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);

  constructor(
    private configService: ConfigService,
    private goalsService: GoalsService,
    private tasksService: TasksService,
    private quizzesService: QuizzesService,
    private progressService: ProgressService,
  ) {}

  async generateCoachMessage(userId: string, userMessage: string) {
    try {
      const apiKey = this.configService.get<string>('GROQ_API_KEY');
      if (!apiKey) {
        throw new Error('Groq API key not configured');
      }

      // 1. Gather Context
      const context = await this.gatherContext(userId);

      // 2. Construct Prompt
      const systemInstruction = `
      You are "Ease AI", a supportive, empathetic, slightly analytical accountability coach.
      Your goal is to help the user achieve their goals by analyzing their data and providing actionable advice.
      
      User Context:
      ${JSON.stringify(context, null, 2)}
      
      Pending Tasks (their current upcoming tasks for today):
      ${context.upcoming_tasks.map((t) => `- [${t.type}] ${t.title}: ${t.description || ''}`).join('\n')}
      
      Response Contract (JSON):
      {
        "reply": string (max 2-3 sentences, effectively addressing the user. you can mention their upcoming tasks if relevant to what they say),
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

      // 3. Call Groq
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userMessage },
            ],
            response_format: { type: 'json_object' },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Groq error: ${response.status} ${await response.text()}`,
        );
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) throw new Error('Empty AI response');

      // 4. Validate Response
      const schema = z.object({
        reply: z.string(),
        tone: z.enum(['supportive', 'direct', 'analytical']),
        suggested_actions: z
          .array(
            z.object({
              type: z.enum([
                'reduce_load',
                'increase_difficulty',
                'reschedule',
                'encourage_review',
              ]),
              details: z.string(),
            }),
          )
          .optional(),
        safety_flag: z.boolean(),
      });

      const parsed = schema.parse(JSON.parse(text));

      // 5. Hard Gaurdrail for Safety
      if (parsed.safety_flag) {
        return {
          reply:
            "I'm hearing that you're going through a tough time. While I'm an AI coach and can't provide professional help, please reach out to a qualified professional or a support hotline if you're in distress. Your well-being is the most important thing.",
          tone: 'supportive',
          safety_flag: true,
          suggested_actions: [],
        };
      }

      return parsed;
    } catch (error: any) {
      this.logger.error('AI Coach Error', error);

      // Smart Fallback when API credits are depleted
      const lowerMsg = userMessage.toLowerCase();
      let reply =
        "I hear you. Let's keep focusing on small wins today. What else is on your mind?";
      let actions: any[] = [];
      let tone: 'supportive' | 'direct' | 'analytical' = 'supportive';

      if (
        lowerMsg.includes('hello') ||
        lowerMsg.includes('hi ') ||
        lowerMsg === 'hi'
      ) {
        reply =
          "Hello! I'm your Ease AI Coach. I'm here to help you stick to your goals and build great habits. What's our focus for today?";
        actions = [{ type: 'encourage_review', details: 'Review daily plan' }];
      } else if (
        lowerMsg.includes('tired') ||
        lowerMsg.includes('exhausted') ||
        lowerMsg.includes('burnout')
      ) {
        reply =
          "It sounds like you need some rest, and that's perfectly okay. Listening to your body is part of the process. Should we reduce today's load?";
        tone = 'supportive';
        actions = [
          { type: 'reduce_load', details: "Lighten today's schedule" },
          { type: 'reschedule', details: 'Move tasks to tomorrow' },
        ];
      } else if (lowerMsg.includes('meditat') || lowerMsg.includes('breath')) {
        reply =
          'Taking time to breathe and center yourself is a wonderful choice. Are you ready to begin your session now?';
        actions = [{ type: 'encourage_review', details: 'Start session' }];
      } else if (lowerMsg.includes('focus') || lowerMsg.includes('distract')) {
        reply =
          'Distractions happen to the best of us. Try the Pomodoro technique: 25 minutes of deep focus, then a 5-minute break. Ready to try?';
        tone = 'analytical';
        actions = [
          { type: 'increase_difficulty', details: 'Start a focus timer' },
        ];
      } else if (lowerMsg.includes('goal') || lowerMsg.includes('plan')) {
        reply =
          "Your current trajectory looks good, but consistency is key. Let's break your next milestone into smaller, actionable steps.";
        tone = 'analytical';
        actions = [{ type: 'encourage_review', details: 'Review roadmap' }];
      } else if (lowerMsg.includes('bored') || lowerMsg.includes('easy')) {
        reply =
          'If things are feeling a bit too comfortable, it might be time to challenge yourself. Shall we increase the difficulty of your next tasks?';
        tone = 'direct';
        actions = [{ type: 'increase_difficulty', details: 'Level up tasks' }];
      }

      return {
        reply,
        tone,
        safety_flag: false,
        suggested_actions: actions,
      };
    }
  }

  private async gatherContext(userId: string) {
    const [
      activeGoal,
      recentTasks,
      recentQuizzes,
      recentProgress,
      upcomingTasks,
    ] = await Promise.all([
      this.goalsService.findActive(userId).catch(() => null),
      this.tasksService.findRecent(userId).catch(() => []) as Promise<Task[]>,
      this.quizzesService.findRecentAttempts(userId).catch(() => []) as Promise<
        QuizAttempt[]
      >,
      this.progressService.findRecent(userId).catch(() => []) as Promise<
        Progress[]
      >,
      this.tasksService.findUpcomingTasks(userId).catch(() => []) as Promise<
        Task[]
      >,
    ]);

    // Calculate basic stats for the prompt
    const completedTasks = recentTasks.filter((t) => t.completed).length;
    const avgQuizScore =
      recentQuizzes.length > 0
        ? recentQuizzes.reduce((acc, q) => acc + q.score, 0) /
          recentQuizzes.length
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
      upcoming_tasks: upcomingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: t.type,
      })),
      raw_progress: recentProgress.map((p) => ({
        date: p.checkinDate,
        mood: p.mood,
      })),
    };
  }
}
