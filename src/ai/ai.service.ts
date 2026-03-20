import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { AudioScriptData } from './interfaces/audio-script.interface';


interface AiProvider {
    name: string;
    priority: number;
    cooldownUntil: Date | null;
    generate: (prompt: string) => Promise<string>;
}

const DAILY_LIMITS: Record<string, number> = {
    gemini: 450,  // keep buffer below 500 hard limit
    groq:   1000, // conservative — free tier is 14,400/day
    cohere: 30,   // ~1k/month ÷ 30 days
};

@Injectable()
export class AiService implements OnModuleInit, OnModuleDestroy {
    private genAI: GoogleGenerativeAI;
    private redis: Redis;
    private readonly logger = new Logger(AiService.name);
    private providers: AiProvider[];
    private locks: Record<string, boolean> = {
        gemini: false,
        groq: false,
        cohere: false,
    };

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY not found in configuration');
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    onModuleInit() {
        // Build a lean Redis client reusing the same URL as BullMQ.
        // Falls back to localhost for local dev (same as BullMQ fallback).
        const redisUrl = this.configService.get<string>('KV_URL') ||
                         this.configService.get<string>('REDIS_URL');
        if (redisUrl) {
            this.redis = new Redis(redisUrl, { tls: redisUrl.startsWith('rediss://') ? {} : undefined, lazyConnect: true });
        } else {
            const host = this.configService.get<string>('REDIS_HOST', 'localhost');
            const port = this.configService.get<number>('REDIS_PORT', 6379);
            this.redis = new Redis({ host, port, lazyConnect: true });
        }
        this.redis.connect().catch(() => this.logger.warn('Redis not reachable — caching and quota tracking disabled'));

        this.providers = [
            {
                name: 'gemini',
                priority: 1,
                cooldownUntil: null,
                generate: (prompt) => this.callGemini(prompt),
            },
            {
                name: 'groq',
                priority: 2,
                cooldownUntil: null,
                generate: (prompt) => this.callGroq(prompt),
            },
            {
                name: 'cohere',
                priority: 3,
                cooldownUntil: null,
                generate: (prompt) => this.callCohere(prompt),
            },
        ];
    }

    async onModuleDestroy() {
        await this.redis?.quit();
    }

    // ─── Provider Infrastructure ──────────────────────────────────────────────

    private getAvailableProviders(): AiProvider[] {
        const now = new Date();
        return this.providers
            .filter(p => !p.cooldownUntil || p.cooldownUntil < now)
            .sort((a, b) => a.priority - b.priority);
    }

    private putOnCooldown(name: string, seconds = 600) {
        const provider = this.providers.find(p => p.name === name);
        if (provider) {
            provider.cooldownUntil = new Date(Date.now() + seconds * 1000);
            this.logger.warn(`${name} on cooldown for ${seconds} seconds`);
        }
    }

    private handleProviderError(providerName: string, error: any) {
        if (this.isQuotaError(error)) {
            const retryDelay = this.extractRetryDelay(error);
            // Default to 60s if no specific hint, otherwise hint + 5s buffer
            const cooldownSec = retryDelay ? Math.ceil(retryDelay + 5) : 60;
            this.putOnCooldown(providerName, cooldownSec);
        } else {
            // General error cooldown: 1 minute
            this.putOnCooldown(providerName, 60);
        }
    }

    private isQuotaError(error: any): boolean {
        const msg = (error?.message || '').toLowerCase();
        return msg.includes('429') || msg.includes('quota') || msg.includes('rate limit');
    }

    private extractRetryDelay(error: any): number | null {
        try {
            // Gemini error details often contain RetryInfo
            const details = error?.response?.error?.details || error?.details || [];
            const retryInfo = details.find(d => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
                // Handle "28s" or "28.5s" string format
                return parseFloat(retryInfo.retryDelay.replace(/[^0-9.]/g, ''));
            }
        } catch (e) {
            this.logger.debug(`Failed to parse retry delay: ${e.message}`);
        }
        return null;
    }

    private async getDailyUsage(provider: string): Promise<number> {
        try {
            const key = `usage:${provider}:${new Date().toISOString().slice(0, 10)}`;
            return parseInt((await this.redis.get(key)) ?? '0', 10);
        } catch { return 0; }
    }

    private async incrementUsage(provider: string) {
        try {
            const key = `usage:${provider}:${new Date().toISOString().slice(0, 10)}`;
            await this.redis.incr(key);
            await this.redis.expire(key, 86400);
        } catch { /* non-critical */ }
    }

    private async callWithFallback(prompt: string): Promise<string | null> {
        // ── Prompt caching: hash the prompt and check Redis (7-day TTL) ──
        const cacheKey = `ai:${createHash('md5').update(prompt).digest('hex')}`;
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.log('AI response served from cache');
                return cached;
            }
        } catch { /* cache miss — continue normally */ }

        const available = this.getAvailableProviders();
        for (const provider of available) {
            // Check mutex lock
            if (this.locks[provider.name]) {
                this.logger.debug(`Provider ${provider.name} is currently busy, trying next...`);
                continue;
            }

            const usage = await this.getDailyUsage(provider.name);
            const limit = DAILY_LIMITS[provider.name] ?? Infinity;
            if (usage >= limit) {
                this.logger.warn(`${provider.name} daily limit reached (${usage}/${limit}), skipping`);
                continue;
            }

            this.locks[provider.name] = true;
            try {
                this.logger.log(`Calling provider: ${provider.name}`);
                const result = await provider.generate(prompt);
                await this.incrementUsage(provider.name);

                // Cache successful response for 7 days
                try { await this.redis.setex(cacheKey, 604800, result); } catch { /* non-critical */ }

                return result;
            } catch (error) {
                this.logger.error(`Provider ${provider.name} failed: ${error?.message || error}`);
                this.handleProviderError(provider.name, error);
            } finally {
                this.locks[provider.name] = false;
            }
        }
        return null;
    }

    private async callGemini(prompt: string): Promise<string> {
        if (!this.genAI) throw new Error('Gemini not configured');
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }

    private async callGroq(prompt: string): Promise<string> {
        const apiKey = this.configService.get<string>('GROQ_API_KEY');
        if (!apiKey) throw new Error('GROQ_API_KEY not configured');

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            }),
        });
        if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        return data.choices[0].message.content;
    }

    private async callCohere(prompt: string): Promise<string> {
        const apiKey = this.configService.get<string>('COHERE_API_KEY');
        if (!apiKey) throw new Error('COHERE_API_KEY not configured');

        const res = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'command-r', message: prompt }),
        });
        if (!res.ok) throw new Error(`Cohere HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        return data.text;
    }

    async generateProgramPlan(goal: string, options: any): Promise<any> {
        if (!this.genAI) {
            this.logger.error('Gemini API key not configured');
            // Using fallback for now to avoid complete failure
            return this.getFallbackPlan();
        }

        const { duration = 30, minutesPerDay = 30, learningStyle = 'mixed', constraints = [], category = 'default' } = options;

        const earlyPhase = Math.floor(duration * 0.3);
        const midStart = earlyPhase + 1;
        const midEnd = Math.floor(duration * 0.7);
        const lateStart = midEnd + 1;

        const videoDuration = Math.round(minutesPerDay * 0.25);
        const exerciseDuration = Math.round(minutesPerDay * 0.20);
        const lessonDuration = Math.round(minutesPerDay * 0.15);
        const audioDuration = Math.round(minutesPerDay * 0.15);

        const systemInstruction = `You are an expert curriculum designer and personal coach specializing in 
structured habit and skill development programs.

CONTEXT
Goal: "${goal}"
Duration: ${duration} days (generate ALL ${duration} days)
Daily commitment: ${minutesPerDay} minutes
Learning style: ${learningStyle}
Constraints: ${constraints.join(', ') || 'none'}

PROGRESSION RULES
- Days 1-${earlyPhase}: Foundation. Introduce core concepts. Keep tasks simple and confidence-building.
- Days ${midStart}-${midEnd}: Development. Increase complexity. Build on prior days explicitly.
- Days ${lateStart}-${duration}: Mastery. Challenge the user. Reference and synthesize earlier learning.
- Each day's theme must be a specific, distinct subtopic of the goal — not a generic label.
- No exercise, technique, or journal prompt may repeat across days.

PER-TASK TIME BUDGET (must sum to ${minutesPerDay} minutes)
- videoTask: ${videoDuration} minutes
- exerciseTask: ${exerciseDuration} minutes  
- lessonTask: ${lessonDuration} minutes
- quiz: 3 minutes
- journalTask: 5 minutes
- audioTask: ${audioDuration} minutes
- mindfulnessTask: 5 minutes
- reflectionTask: 3 minutes

OUTPUT SCHEMA
Return a raw JSON array — no markdown, no code fences, no commentary, 
no trailing commas. Every object must have ALL of these keys:

{
  "dayNumber": integer,
  "theme": string (specific subtopic, e.g. "Fingerstyle Thumb Independence" not "Basics"),
  
  "videoTask": {
    "title": string,
    "description": string (explain what the user will learn and why it matters today),
    "searchQuery": string (precise YouTube query, e.g. "fingerstyle guitar thumb independence beginner lesson")
  },
  
  "exerciseTask": {
    "title": string,
    "description": string,
    "steps": string[] (exactly 4 steps, each actionable and specific to today's theme),
    "durationMinutes": ${exerciseDuration}
  },
  
  "lessonTask": {
    "title": string,
    "description": string,
    "keyPoints": string[] (exactly 4 points, each a complete insight not a heading)
  },
  
  "quiz": {
    "title": string,
    "questions": [
      {
        "question": string (tests comprehension of today's lesson/video content, not surface recall),
        "options": string[] (exactly 4 options, one clearly correct, others plausible),
        "correctAnswer": integer (0-based index),
        "explanation": string (why the correct answer is right — shown after the user answers)
      }
    ]
    // exactly 2 questions
  },
  
  "journalTask": {
    "title": string,
    "prompt": string (open-ended, personal — connects today's theme to the user's own life or progress)
  },
  
  "audioTask": {
    "title": string,
    "description": string,
    "mood": "meditation" | "focus" | "ambient",
    "theme": string (1-sentence description of what the audio session should focus on)
  },
  
  "mindfulnessTask": {
    "title": string,
    "description": string,
    "technique": string (named technique with brief how-to, e.g. "Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s")
  },
  
  "reflectionTask": {
    "title": string,
    "description": string,
    "reviewPoints": string[] (exactly 2 points — one reviewing today, one previewing tomorrow)
  }
}

QUALITY RULES
- videoTask.searchQuery must be specific enough to return a real tutorial (include skill level + modality).
- quiz questions must test understanding of the lesson content, not just theme recall.
- journalTask.prompt must be unique per day and personally engaging.
- audioTask.theme feeds into audio script generation — make it emotionally resonant and goal-relevant.
- mindfulnessTask.technique must vary across days (no technique may repeat).

Return ONLY the raw JSON array starting with [ and ending with ].`;

        try {
            // Call through the fallback chain (Gemini → Groq → Cohere)
            // Note: Gemini supports JSON mode which improves parsing reliability.
            // Groq/Cohere return plain text that we strip/parse ourselves.
            let text = await this.callWithFallback(systemInstruction);

            if (!text) {
                throw new Error('Empty content from AI');
            }

            // Strip any residual markdown fences just in case
            text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

            let rawPlan = JSON.parse(text);
            
            // Validate each day independently so one bad day doesn't kill the whole plan
            const plan = rawPlan.map((day: any, i: number) => {
                const dayNumber = day.dayNumber || i + 1;
                try {
                    this.validateDay(day, dayNumber);
                    return day;
                } catch (e) {
                    this.logger.warn(`Validation failed for day ${dayNumber}: ${e.message}. Using fallback.`);
                    return this.getFallbackDay(dayNumber, category);
                }
            });

            this.logger.log(`AI plan generated: ${plan.length} days (validated)`);
            return plan;
        } catch (error) {
            this.logger.error(`Failed to generate program plan: ${error?.message || error}`);
            // If quota or other error, return fallback plan instead of crashing
            this.logger.warn('Returning fallback program plan due to AI error');
            return this.getFallbackPlan(Math.min(duration, 7), category);
        }
    }

    async generateSingleDay(goal: string, dayNumber: number, totalDays: number, options: any): Promise<any> {
        const { minutesPerDay = 30, learningStyle = 'mixed', constraints = [], category = 'default' } = options;

        const earlyPhase = Math.floor(totalDays * 0.3);
        const midEnd = Math.floor(totalDays * 0.7);
        const phase = dayNumber <= earlyPhase ? 'Foundation' :
                      dayNumber <= midEnd ? 'Development' : 'Mastery';

        const videoDuration = Math.round(minutesPerDay * 0.25);
        const exerciseDuration = Math.round(minutesPerDay * 0.20);
        const lessonDuration = Math.round(minutesPerDay * 0.15);
        const audioDuration = Math.round(minutesPerDay * 0.15);

        const prompt = `You are an expert curriculum designer creating a single day of a ${totalDays}-day learning plan.

CONTEXT
Goal: "${goal}"
Day: ${dayNumber} of ${totalDays} (Phase: ${phase})
Daily commitment: ${minutesPerDay} minutes
Learning style: ${learningStyle}
Constraints: ${constraints.join(', ') || 'none'}

PROGRESSION
- Foundation (days 1-${earlyPhase}): introduce core concepts, keep simple and confidence-building.
- Development (days ${earlyPhase + 1}-${midEnd}): increase complexity, build on prior days.
- Mastery (days ${midEnd + 1}-${totalDays}): challenge the user, reference earlier learning.
This is Day ${dayNumber} (${phase}) — calibrate difficulty accordingly.

PER-TASK TIME BUDGET
- videoTask: ${videoDuration} min
- exerciseTask: ${exerciseDuration} min
- lessonTask: ${lessonDuration} min
- quiz: 3 min (2 questions)
- journalTask: 5 min
- audioTask: ${audioDuration} min
- mindfulnessTask: 5 min
- reflectionTask: 3 min

OUTPUT SCHEMA
Return a single raw JSON object — no markdown, no code fences, no commentary:

{
  "dayNumber": ${dayNumber},
  "theme": string (specific subtopic, not a generic label),
  "videoTask": { "title": string, "description": string, "searchQuery": string },
  "exerciseTask": { "title": string, "description": string, "steps": string[4], "durationMinutes": ${exerciseDuration} },
  "lessonTask": { "title": string, "description": string, "keyPoints": string[4] },
  "quiz": { "title": string, "questions": [{ "question": string, "options": string[4], "correctAnswer": integer, "explanation": string }, ...] },
  "journalTask": { "title": string, "prompt": string },
  "audioTask": { "title": string, "description": string, "mood": "meditation"|"focus"|"ambient", "theme": string },
  "mindfulnessTask": { "title": string, "description": string, "technique": string },
  "reflectionTask": { "title": string, "description": string, "reviewPoints": string[2] }
}

Return ONLY the raw JSON object starting with { and ending with }.`;

        try {
            let text = await this.callWithFallback(prompt);
            if (!text) throw new Error('All providers failed for single day');
            text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
            const day = JSON.parse(text);
            this.validateDay(day, dayNumber);
            return day;
        } catch (error) {
            this.logger.error(`generateSingleDay failed for day ${dayNumber}: ${error?.message}`);
            return this.getFallbackDay(dayNumber, category);
        }
    }

    private async repairVideoUrl(theme: string, title: string): Promise<string | null> {
        try {
            const prompt = `Find a VALID, WORKING YouTube video URL for: "${theme} - ${title}".
            Use Google Search to find a real video.
            Return ONLY the URL string. Nothing else.`;

            const model = this.genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                // @ts-ignore
                tools: [{ googleSearch: {} }],
            });

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            // Extract URL if surrounded by text
            const urlMatch = text.match(/https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/);
            const candidateUrl = urlMatch ? urlMatch[0] : text;

            if (candidateUrl && candidateUrl.includes('youtube.com/watch')) {
                const isValid = await this.validateYouTubeUrl(candidateUrl);
                if (isValid) return candidateUrl;
            }

            return null;
        } catch (error) {
            this.logger.error('Error repairing video URL', error);
            return null;
        }
    }

    private async validateYouTubeUrl(url: string): Promise<boolean> {
        try {
            // Use oEmbed endpoint to check existence
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    private async validateLink(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async generateSearchQuery(topic: string): Promise<string> {
        try {
            const prompt = `Generate a YouTube search query for finding a high-quality video about: "${topic}". 
            Return ONLY the query string. No quotes, no explanations.`;

            const model = this.genAI.getGenerativeModel({
                // IMPORTANT: NEVER CHANGE THIS MODEL! MUST BE gemini-2.5-flash.
                model: "gemini-2.5-flash",
            });

            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            this.logger.error('Failed to generate search query', error);
            return topic; // Fallback to raw topic
        }
    }

    async generateAudioScript(dayTheme: string, duration: number = 5): Promise<AudioScriptData> {
        const prompt = `
You are creating a subliminal audio script for a ${duration}-minute session.

**Context**: The user just completed a learning task about: "${dayTheme}"

**Requirements**:
1. Generate affirmations that reinforce today's lesson (8-12 statements)
2. Each affirmation should be:
   - Present tense ("I am mastering...", "My skills grow...")
   - Specific to the theme (mention concrete techniques/concepts from today)
   - Emotionally resonant (confidence, capability, progress)
3. Create a gentle background narration (~600 words) for ambient voiceover
4. Specify the optimal binaural beat frequency for this session type

**Session Types & Frequencies**:
- Focus/Learning: 14-30 Hz (Beta waves) - Active concentration
- Relaxation/Integration: 8-13 Hz (Alpha waves) - Calm alertness  
- Deep meditation: 4-7 Hz (Theta waves) - Subconscious processing
- Sleep preparation: 0.5-3 Hz (Delta waves) - Deep rest

**Output strict JSON**:
{
  "sessionType": "focus" | "relaxation" | "meditation" | "sleep",
  "binauralFrequency": 14.5,  // Target brainwave Hz
  "carrierFrequency": 200,    // Base tone (100-300 Hz recommended)
  "affirmations": [
    "I am mastering thumb independence in fingerstyle guitar",
    "My muscle memory improves with each practice session"
  ],
  "backgroundNarration": "As you settle into this moment, notice how your body remembers the movements you practiced today...",
  "theme": "${dayTheme}"
}

Return ONLY the raw JSON object starting with { and ending with }.
`;

        try {
            const response = await this.callWithFallback(prompt);
            if (!response) throw new Error('AI providers failed to generate audio script');
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Failed to extract JSON from AI response');
            
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            this.logger.error('Failed to generate audio script', error);
            // Fallback
            return {
                sessionType: 'relaxation',
                binauralFrequency: 10,
                carrierFrequency: 200,
                affirmations: [
                    "I am absorbing today's lessons with ease",
                    "My mind is calm and ready to integrate new skills",
                    "I am growing more capable every day"
                ],
                backgroundNarration: "As you settle into this moment, allow your mind to drift back through what you've learned today. Feel the progress you've made, and let it settle deep within your foundation.",
                theme: dayTheme
            };
        }
    }


    private validateDay(day: any, dayIndex: number): void {
        const required = ['videoTask', 'exerciseTask', 'lessonTask', 'quiz',
            'journalTask', 'audioTask', 'mindfulnessTask', 'reflectionTask'];

        for (const field of required) {
            if (!day[field]) throw new Error(`Day ${dayIndex} missing field: ${field}`);
        }

        if (!day.quiz || !day.quiz.questions || day.quiz.questions.length !== 2) {
            throw new Error(`Day ${dayIndex} quiz must have exactly 2 questions`);
        }
    }

    private getFallbackDay(dayNumber: number, goalCategory: string = 'default') {
        const categories: Record<string, string[]> = {
            'language': [
                'Basic Greetings & Alphabet',
                'Common Vocabulary',
                'Simple Sentence Structure',
                'Listening Comprehension',
                'Speaking Practice',
                'Review & Conversation',
                'Immersive Practice'
            ],
            'fitness': [
                'Form & Technique',
                'Core Activation',
                'Strength Foundations',
                'Cardio Endurance',
                'Active Recovery & Flex',
                'High Intensity Intervals',
                'Full Body Flow'
            ],
            'productivity': [
                'Time Blocking Basics',
                'Prioritization Techniques',
                'Managing Distractions',
                'Deep Work Strategies',
                'Workflow Optimization',
                'Review & Rest',
                'System Consolidation'
            ],
            'study': [
                'Setting Up the Environment',
                'Information Intake Methods',
                'Active Recall & Spaced Repetition',
                'Synthesizing Notes',
                'Mock Testing',
                'Reviewing Mistakes',
                'Final Consolidation'
            ]
        };

        const themes = categories[(goalCategory || '').toLowerCase()] || [
            'Introduction & Foundations',
            'Core Skills',
            'Building Momentum',
            'Deepening Understanding',
            'Practice & Refinement',
            'Review & Consolidation',
            'Application',
        ];
        
        const theme = themes[(dayNumber - 1) % themes.length];
        return {
            dayNumber: dayNumber,
            theme,
            videoTask: {
                title: `Day ${dayNumber}: ${theme} — Video Lesson`,
                description: `Watch a focused lesson on ${theme}.`,
                searchQuery: `${theme} beginner tutorial`,
            },
            exerciseTask: {
                title: `Day ${dayNumber}: Guided Exercise`,
                description: `A hands-on exercise to reinforce ${theme}.`,
                steps: ['Step 1: Warm up', 'Step 2: Core drill', 'Step 3: Apply the concept', 'Step 4: Cool down'],
            },
            lessonTask: {
                title: `Day ${dayNumber}: Reading Lesson`,
                description: `Study the key concepts of ${theme}.`,
                keyPoints: ['Key concept 1', 'Key concept 2', 'Key concept 3'],
            },
            quiz: {
                title: `Day ${dayNumber} Quiz`,
                questions: [
                    { question: 'What was the main focus today?', options: ['Consistency', 'Speed', 'Technique'], correctAnswer: 0 },
                    { question: 'What is the next step?', options: ['Practice more', 'Move on', 'Skip it'], correctAnswer: 0 },
                ],
            },
            journalTask: {
                title: `Day ${dayNumber}: Journal Check-in`,
                prompt: `What did you find most challenging about ${theme} today, and how will you approach it tomorrow?`,
            },
            audioTask: {
                title: `Day ${dayNumber}: Nightly Audio`,
                description: `A calming audio session to close out the day.`,
                mood: dayNumber % 3 === 0 ? 'ambient' : dayNumber % 2 === 0 ? 'focus' : 'meditation',
            },
            mindfulnessTask: {
                title: `Day ${dayNumber}: Mindfulness Break`,
                description: 'Take a short break to reset your focus.',
                technique: ['4-7-8 breathing', 'body scan', '5-4-3-2-1 grounding', 'box breathing'][(dayNumber - 1) % 4],
            },
            reflectionTask: {
                title: `Day ${dayNumber}: Evening Reflection`,
                description: `Review what you learned about ${theme}.`,
                reviewPoints: ['What went well?', 'What was challenging?', 'What will I do differently tomorrow?'],
            },
        };
    }

    private getFallbackPlan(duration: number = 7, category: string = 'default') {
        const days: any[] = [];
        for (let i = 1; i <= duration; i++) {
            days.push(this.getFallbackDay(i, category));
        }
        return days;
    }
}
