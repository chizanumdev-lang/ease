import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { AudioScriptData } from './interfaces/audio-script.interface';
import { AiGenerationLog } from '../admin/entities/ai-generation-log.entity';

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
    openrouter: 1000,
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
        openrouter: false,
    };

    constructor(
        private configService: ConfigService,
        @InjectRepository(AiGenerationLog)
        private aiLogRepository: Repository<AiGenerationLog>,
    ) {
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
        const options: any = {
            tls: redisUrl?.startsWith('rediss://') ? {} : undefined,
            lazyConnect: true,
            maxRetriesPerRequest: 1, // Don't hang if Redis is down
            retryStrategy: (times: number) => {
                if (times > 3) {
                    this.logger.error('Redis connection failed after 3 attempts. Caching disabled.');
                    return null; // stop retrying
                }
                return Math.min(times * 200, 1000);
            }
        };

        if (redisUrl) {
            this.redis = new Redis(redisUrl, options);
        } else {
            const host = this.configService.get<string>('REDIS_HOST', 'localhost');
            const port = this.configService.get<number>('REDIS_PORT', 6379);
            this.redis = new Redis({ ...options, host, port });
        }

        // Add explicit error listener to stop ioredis from throwing unhandled errors to process.stderr
        this.redis.on('error', (err) => {
            if ((err as any).code === 'ETIMEDOUT' || (err as any).code === 'ECONNREFUSED') {
                // Silently log once or handle gracefully
                this.logger.debug(`Redis Background connection issue: ${err.message}`);
            } else {
                this.logger.warn(`Redis Error: ${err.message}`);
            }
        });

        this.redis.connect().catch((err) => {
            this.logger.warn(`Redis not reachable — caching and quota tracking disabled: ${err.message}`);
        });

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
            {
                name: 'openrouter',
                priority: 4,
                cooldownUntil: null,
                generate: (prompt) => this.callOpenRouter(prompt),
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
            const startTime = Date.now();
            try {
                this.logger.log(`Calling provider: ${provider.name}`);
                const result = await provider.generate(prompt);
                const latency = Date.now() - startTime;

                await this.incrementUsage(provider.name);

                // Log success
                this.aiLogRepository.save({
                    type: 'ai_call',
                    model: provider.name,
                    prompt: prompt.substring(0, 500), // Truncate for log
                    response: result.substring(0, 500),
                    status: 'success',
                    latency,
                    createdAt: new Date(),
                }).catch(err => this.logger.error('Failed to save AI log', err));

                // Cache successful response for 7 days
                try { await this.redis.setex(cacheKey, 604800, result); } catch { /* non-critical */ }

                return result;
            } catch (error) {
                const latency = Date.now() - startTime;
                this.logger.error(`Provider ${provider.name} failed: ${error?.message || error}`);
                this.handleProviderError(provider.name, error);

                // Log failure
                this.aiLogRepository.save({
                    type: 'ai_call',
                    model: provider.name,
                    prompt: prompt.substring(0, 500),
                    status: 'failure',
                    errorMessage: error?.message || String(error),
                    latency,
                    createdAt: new Date(),
                }).catch(err => this.logger.error('Failed to save AI log', err));
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

    private async callOpenRouter(prompt: string): Promise<string> {
        const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
        if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://ease.app', // Optional, for OpenRouter tracking
                'X-Title': 'Ease App',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-lite:free', // Great free model
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            }),
        });
        if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}: ${await res.text()}`);
        const data = await res.json();
        return data.choices[0].message.content;
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

        const videoDuration = Math.round(minutesPerDay * 0.30);
        const quizDuration = Math.round(minutesPerDay * 0.10);
        const audioDuration = Math.round(minutesPerDay * 0.20);
        const journalDuration = Math.round(minutesPerDay * 0.15);
        const consistencyDuration = 2; // Fixed short commitment

        const systemInstruction = `You are an expert curriculum designer and personal coach specializing in 
structured habit and skill development programs.

CONTEXT
Goal: "${goal}"
Duration: ${duration} days (generate ALL ${duration} days)
Daily commitment: ${minutesPerDay} minutes
Learning style: ${learningStyle}
Constraints: ${constraints.join(', ') || 'none'}

DAILY FLOW (STRICT ORDER - Indexing 0-5)
0. Video (Concept)
1. Quiz (Comprehension)
2. Audio (Integration - Binaural/Subliminal)
3. Journal (Intention)
4. Reflection (Daily Win/Preview)
5. Consistency (Tomorrow's Commitment)

OUTPUT SCHEMA
Return a raw JSON array — no markdown, no code fences, no commentary, no trailing commas. Every object must have ALL of these keys:

{
  "dayNumber": integer,
  "theme": string (specific subtopic),
  "focusAreas": string[], (exactly 3 key concepts for today)
  
  "videoTask": { "title": string, "description": string, "searchQuery": string, "duration": ${videoDuration} },
  "quiz": { "title": string, "questions": [{ "question": string, "options": string[4], "correctAnswer": integer, "explanation": string }, { "question": string, "options": string[4], "correctAnswer": integer, "explanation": string }] },
  "audioTask": { "title": string, "description": string, "mood": "meditation"|"focus"|"ambient", "theme": string, "duration": ${audioDuration} },
  "consistencyTask": { "title": "Tomorrow's Commitment", "description": "i will complete my routine tommorrow.", "duration": ${consistencyDuration} },
  "journalTask": { "title": string, "prompt": string, "duration": ${journalDuration} },
  "reflectionTask": { "title": string, "description": string, "reviewPoints": string[2] }
}

QUALITY RULES
- QUIZ GROUNDING: Questions MUST test comprehension of the day's specific theme and video content. Do not ask generic life-coaching questions.
- AUDIO SCRIPT: The description should be a script summary for a voice-guided session designed for binaural beat background.
- Each task must be scannable and mobile-friendly.
- videoTask.searchQuery must be specific enough to return a real tutorial.
- reflectionTask.reviewPoints must be exactly 2 (one today's win, one tomorrow's prep).`;

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

        const videoDuration = Math.round(minutesPerDay * 0.30);
        const quizDuration = Math.round(minutesPerDay * 0.10);
        const audioDuration = Math.round(minutesPerDay * 0.20);
        const journalDuration = Math.round(minutesPerDay * 0.15);
        const consistencyDuration = 2; // Fixed short commitment

        const prompt = `You are an expert curriculum designer creating a single day of a ${totalDays}-day learning plan.

CONTEXT
Goal: "${goal}"
Day: ${dayNumber} of ${totalDays} (Phase: ${phase})
Daily commitment: ${minutesPerDay} minutes
Learning style: ${learningStyle}
Constraints: ${constraints.join(', ') || 'none'}

DAILY FLOW (STRICT ORDER - Indexing 0-5)
0. Video (Concept)
1. Quiz (Comprehension)
2. Audio (Integration - Binaural/Subliminal)
3. Journal (Intention)
4. Reflection (Daily Win/Preview)
5. Consistency (Tomorrow's Commitment)

OUTPUT SCHEMA
Return a single raw JSON object — no markdown, no code fences, no commentary:

{
  "dayNumber": ${dayNumber},
  "theme": string (specific subtopic),
  "focusAreas": string[], (exactly 3 key points)
  
  "videoTask": { "title": string, "description": string, "searchQuery": string, "duration": ${videoDuration} },
  "quiz": { "title": string, "questions": [{ "question": string, "options": string[4], "correctAnswer": integer, "explanation": string }, { "question": string, "options": string[4], "correctAnswer": integer, "explanation": string }] },
  "audioTask": { "title": string, "description": string, "mood": "meditation"|"focus"|"ambient", "theme": string, "duration": ${audioDuration} },
  "consistencyTask": { "title": "Tomorrow's Commitment", "description": "i will complete my routine tommorrow.", "duration": ${consistencyDuration} },
  "journalTask": { "title": string, "prompt": string, "duration": ${journalDuration} },
  "reflectionTask": { "title": string, "description": string, "reviewPoints": string[2] }
}

QUALITY RULES
- QUIZ GROUNDING: Questions MUST test comprehension of the day's specific theme and content. No generic questions.
- AUDIO SCRIPT: The description should be a script summary designed for binaural beat background.
- Scannable, mobile-friendly content.
- Action-oriented titles.
- Reflection points: one today's win, one tomorrow's prep.

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

    async generateAudioScript(dayTheme: string, duration: number = 5, type: 'morning' | 'night' | 'task' = 'task'): Promise<AudioScriptData> {
        const typeContext = {
            morning: 'a morning affirmation session to start the day with energy and focus',
            night: 'a nightly subliminal session for subconscious processing during deep rest',
            task: `an immersive focus session reinforcing a lesson about "${dayTheme}"`
        };

        const wordCount = duration * 150; // Targeting ~150 words per minute
        const prompt = `
You are creating ${typeContext[type]} for a ${duration}-minute session.

**Goal/Theme**: "${dayTheme}"

**Session Structure**:
1. **Introduction (1 min)**: Set the space, focus on breathing, and introduce today's theme: "${dayTheme}".
2. **Core Lesson & Affirmations (Remaining time)**: 
   - Weave affirmations specific to the goal (I am..., I have...) into a continuous, flowing narrative.
   - Deeply explore the implications of mastering "${dayTheme}".
3. **Closing (1 min)**: Gently bring the focus back while grounding the new subconscious patterns.

**Requirements**:
1. **Word Count**: You MUST generate at least ${wordCount} words for the "backgroundNarration" to fill the ${duration}-minute duration properly.
2. **Pacing**: Use descriptive, evocative language.
3. **Affirmations**: Provide 10-15 powerful statements in the "affirmations" array.
4. **Binaural Frequency**: Specify the optimal frequency for this session type:
   ${type === 'morning' ? '- Recommended: 10-14 Hz (Alpha/Beta for alertness)' : ''}
   ${type === 'night' ? '- Recommended: 0.5-4 Hz (Delta for deep sleep preparation)' : ''}
   ${type === 'task' ? '- Recommended: 8-12 Hz (Alpha for flow state and learning)' : ''}

**Output strict JSON**:
{
  "sessionType": "${type === 'morning' ? 'relaxation' : type === 'night' ? 'sleep' : 'focus'}",
  "binauralFrequency": number, // Target brainwave Hz
  "carrierFrequency": 200,    // Base tone (100-300 Hz recommended)
  "affirmations": [
    "I am mastering...",
    "My mind is..."
  ],
  "backgroundNarration": "...", // Long, continuous script of at least ${wordCount} words
  "theme": "${dayTheme}"
}

Return ONLY the raw JSON object.
`;

        try {
            const response = await this.callWithFallback(prompt);
            if (!response) throw new Error('AI providers failed to generate audio script');
            
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Failed to extract JSON from AI response');
            
            const data = JSON.parse(jsonMatch[0]);
            
            // Validation & Sanitization
            return {
                sessionType: data.sessionType || (type === 'night' ? 'sleep' : 'relaxation'),
                binauralFrequency: Number(data.binauralFrequency) || (type === 'night' ? 2 : 10),
                carrierFrequency: Number(data.carrierFrequency) || 200,
                affirmations: Array.isArray(data.affirmations) ? data.affirmations : ["I am growing every day"],
                backgroundNarration: data.backgroundNarration || "Take a deep breath and settle into focus...",
                theme: data.theme || dayTheme
            };
        } catch (error) {
            this.logger.error('Failed to generate audio script', error);
            // Fallback
            return {
                sessionType: type === 'night' ? 'sleep' : 'relaxation',
                binauralFrequency: type === 'night' ? 2 : 10,
                carrierFrequency: 200,
                affirmations: [
                    "I am absorbing today's lessons with ease",
                    "My mind is calm and ready to integrate new skills",
                    "I am growing more capable every day"
                ],
                backgroundNarration: "As you settle into this moment, allow your mind to drift back through what you want to achieve. Feel the progress you've made, and let it settle deep within your foundation.",
                theme: dayTheme
            };
        }
    }


    async generateProgramPreview(goal: string, options: any): Promise<any> {
        if (!this.genAI) return this.getFallbackPreview(goal, options);

        const { duration = 30, minutesPerDay = 30, category = 'default' } = options;

        const systemInstruction = `You are an expert curriculum designer. Generate high-level metadata for a ${duration}-day learning program based on the goal: "${goal}".
        
        OUTPUT SCHEMA:
        Return ONLY a raw JSON object:
        {
          "title": "Concise, inspiring program name",
          "category": "One of: Skill, Habit, Career, Mental, Fitness",
          "primaryGoal": "The single most important outcome",
          "description": "Short, compelling program summary (max 120 chars)",
          "coachInsight": "A one-sentence personalized coaching note about the journey ahead and its intensity progression.",
          "sampleDays": [
            { "day": 1, "title": "Foundation focused title", "description": "Action-oriented summary" },
            { "day": 2, "title": "Progression focused title", "description": "Action-oriented summary" },
            { "day": 3, "title": "Integration focused title", "description": "Action-oriented summary" }
          ],
          "weeklyIntensity": [number, number, number, number, number, number, number] 
        }

        INTENSITY LOGIC:
        The "weeklyIntensity" array represents relative effort (0-100) for 7 representative days. 
        It should reflect a healthy progression: start lower for foundation, peak for challenge, and vary slightly for recovery.
        
        Return ONLY valid JSON.`;

        try {
            let text = await this.callWithFallback(systemInstruction);
            if (!text) throw new Error('Preview generation failed');
            text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
            const preview = JSON.parse(text);
            
            // Ensure schema validity
            if (!preview.title || !preview.weeklyIntensity) throw new Error('Incomplete preview data');
            return preview;
        } catch (error) {
            this.logger.error(`Preview generation failed: ${error.message}`);
            return this.getFallbackPreview(goal, options);
        }
    }

    private getFallbackPreview(goal: string, options: any) {
        return {
            title: goal.substring(0, 30) + ' Journey',
            category: options.category || 'Skill',
            primaryGoal: 'Master ' + goal.substring(0, 20),
            description: 'A transformative ' + (options.duration || 30) + '-day program built for your growth.',
            coachInsight: 'This plan is balanced for sustainable progress and steady challenge.',
            sampleDays: [
                { day: 1, title: 'Foundations of ' + goal, description: 'Setting the stage for your growth.' },
                { day: 2, title: 'Strategic Practice', description: 'Applying core techniques.' },
                { day: 3, title: 'Initial Integration', description: 'Connecting concepts together.' }
            ],
            weeklyIntensity: [20, 35, 60, 45, 80, 25, 30]
        };
    }

    private validateDay(day: any, dayIndex: number): void {
        const required = ['focusAreas', 'videoTask', 'quiz', 'audioTask', 'consistencyTask', 'journalTask', 'reflectionTask'];

        for (const field of required) {
            if (!day[field]) throw new Error(`Day ${dayIndex} missing field: ${field}`);
        }

        if (!Array.isArray(day.focusAreas) || day.focusAreas.length !== 3) {
            throw new Error(`Day ${dayIndex} focusAreas must be an array of exactly 3 strings`);
        }

        if (!day.quiz || !day.quiz.questions || day.quiz.questions.length !== 2) {
            throw new Error(`Day ${dayIndex} quiz must have exactly 2 questions`);
        }
    }

    private getFallbackDay(dayNumber: number, goalCategory: string = 'default') {
        return {
            dayNumber,
            theme: 'Building Foundations',
            focusAreas: ['Core Concepts', 'Action Steps', 'Future Growth'],
            videoTask: {
                title: 'Introduction to Today',
                description: 'A quick overview of our focus for today.',
                searchQuery: 'productivity foundations',
                duration: 10
            },
            quiz: {
                title: 'Quick Check',
                questions: [
                    { question: 'What is our focus today?', options: ['Growth', 'Stagnation', 'Fear', 'Loss'], correctAnswer: 0, explanation: 'Growth is our primary objective.' },
                    { question: 'Ready to proceed?', options: ['Yes', 'Not yet', 'Maybe', 'No'], correctAnswer: 0, explanation: 'Action is key.' }
                ]
            },
            audioTask: {
                title: 'Integration Audio',
                description: 'Calmly process today\'s insights.',
                mood: 'meditation',
                theme: 'Calm growth',
                duration: 8
            },
            consistencyTask: {
                title: 'Tomorrow\'s Commitment',
                description: 'i will complete my routine tommorrow.',
                duration: 2
            },
            journalTask: {
                title: 'Today\'s Reflection',
                prompt: 'What was your biggest takeaway from today\'s session?',
                duration: 5
            },
            reflectionTask: {
                title: 'Daily Wrap-up',
                description: 'Review your progress and prep for tomorrow.',
                reviewPoints: ['Today went well.', 'Tomorrow will be better.']
            }
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
