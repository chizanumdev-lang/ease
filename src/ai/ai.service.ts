import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AudioScriptData } from './interfaces/audio-script.interface';
import { AiGenerationLog } from '../admin/entities/ai-generation-log.entity';

/**
 * Simple in-memory LRU cache with TTL. Replaces Redis for AI response caching.
 * Each serverless cold start gets a fresh cache — that's fine, the main goal is
 * deduplicating identical prompts within the same invocation lifecycle.
 */
class MemoryCache {
  private cache = new Map<string, { value: string; expires: number }>();
  private maxSize: number;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: string, ttlSeconds: number): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }
}

interface AiProvider {
  name: string;
  priority: number;
  cooldownUntil: Date | null;
  generate: (prompt: string) => Promise<string>;
}

const DAILY_LIMITS: Record<string, number> = {
  gemini: 450,
  groq: 1000,
  cohere: 30,
  openrouter: 1000,
  mistral: 500,
};

@Injectable()
export class AiService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private cache: MemoryCache;
  private readonly logger = new Logger(AiService.name);
  private providers: AiProvider[];
  private usageCounts = new Map<string, number>();
  private locks: Record<string, boolean> = {
    gemini: false,
    groq: false,
    cohere: false,
    openrouter: false,
    mistral: false,
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
    // In-memory LRU cache — replaces Redis. Zero external dependencies.
    this.cache = new MemoryCache(200);
    this.usageCounts = new Map();

    const isDev = this.configService.get('NODE_ENV') === 'development';

    this.providers = [
      {
        name: 'groq',
        priority: 1,
        cooldownUntil: null,
        generate: (prompt) => this.callGroq(prompt),
      },
      {
        name: 'openrouter',
        priority: 2,
        cooldownUntil: null,
        generate: (prompt) => this.callOpenRouter(prompt),
      },
      {
        name: 'mistral',
        priority: 3,
        cooldownUntil: null,
        generate: (prompt) => this.callMistral(prompt),
      },
      {
        name: 'gemini',
        priority: 4,
        cooldownUntil: null,
        generate: (prompt) => this.callGemini(prompt),
      },
      {
        name: 'cohere',
        priority: 5,
        cooldownUntil: null,
        generate: (prompt) => this.callCohere(prompt),
      },
    ];

    // Add Ollama in development as a fallback
    if (isDev) {
      this.providers.push({
        name: 'ollama',
        priority: 10, // Lower priority, use as fallback
        cooldownUntil: null,
        generate: (prompt) => this.callOllama(prompt),
      });
    }
  }

  // No external connections to clean up — in-memory cache is GC'd automatically

  // ─── Provider Infrastructure ──────────────────────────────────────────────

  private getAvailableProviders(): AiProvider[] {
    const now = new Date();
    return this.providers
      .filter((p) => !p.cooldownUntil || p.cooldownUntil < now)
      .sort((a, b) => a.priority - b.priority);
  }

  private putOnCooldown(name: string, seconds = 600) {
    const provider = this.providers.find((p) => p.name === name);
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
    return (
      msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')
    );
  }

  private extractRetryDelay(error: any): number | null {
    try {
      // Gemini error details often contain RetryInfo
      const details = error?.response?.error?.details || error?.details || [];
      const retryInfo = details.find((d) => d['@type']?.includes('RetryInfo'));
      if (retryInfo?.retryDelay) {
        // Handle "28s" or "28.5s" string format
        return parseFloat(retryInfo.retryDelay.replace(/[^0-9.]/g, ''));
      }
    } catch (e) {
      this.logger.debug(`Failed to parse retry delay: ${e.message}`);
    }
    return null;
  }

  private getDailyUsage(provider: string): number {
    const key = `${provider}:${new Date().toISOString().slice(0, 10)}`;
    return this.usageCounts.get(key) ?? 0;
  }

  private incrementUsage(provider: string): void {
    const key = `${provider}:${new Date().toISOString().slice(0, 10)}`;
    this.usageCounts.set(key, (this.usageCounts.get(key) ?? 0) + 1);
  }

  async generate(prompt: string, metadata?: any): Promise<string> {
    const result = await this.callWithFallback(prompt, metadata);
    return result || '';
  }

  async generateCustomJson<T>(
    prompt: string,
    fallback: T,
    metadata?: any,
  ): Promise<T> {
    try {
      const result = await this.callWithFallback(prompt, metadata);
      if (!result) return fallback;

      const extracted = this.extractJson(result);
      if (!extracted) {
        this.logger.warn(
          'Failed to extract JSON from AI response, using fallback',
        );
        return fallback;
      }

      return extracted as T;
    } catch (e) {
      this.logger.error(`Failed to generate custom JSON: ${e.message}`);
      return fallback;
    }
  }

  private async callWithFallback(
    prompt: string,
    metadata?: any,
  ): Promise<string | null> {
    // ── Prompt caching: hash the prompt and check in-memory cache ──
    const cacheKey = `ai:${createHash('md5').update(prompt).digest('hex')}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.log('AI response served from cache');
      return cached;
    }

    const available = this.getAvailableProviders();
    for (const provider of available) {
      // Check mutex lock
      if (this.locks[provider.name]) {
        this.logger.debug(
          `Provider ${provider.name} is currently busy, trying next...`,
        );
        continue;
      }

      const usage = this.getDailyUsage(provider.name);
      const limit = DAILY_LIMITS[provider.name] ?? Infinity;
      if (usage >= limit) {
        this.logger.warn(
          `${provider.name} daily limit reached (${usage}/${limit}), skipping`,
        );
        continue;
      }

      this.locks[provider.name] = true;
      const startTime = Date.now();
      try {
        this.logger.log(`Calling provider: ${provider.name}`);
        const result = await provider.generate(prompt);
        const latency = Date.now() - startTime;

        this.incrementUsage(provider.name);

        // Log success
        this.aiLogRepository
          .save({
            type: 'ai_call',
            model: provider.name,
            prompt: prompt.substring(0, 500), // Truncate for log
            response: result.substring(0, 500),
            status: 'success',
            latency,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
            createdAt: new Date(),
          })
          .catch((err) => this.logger.error('Failed to save AI log', err));

        // Cache successful response (1 hour TTL for in-memory)
        this.cache.set(cacheKey, result, 3600);

        return result;
      } catch (error) {
        const latency = Date.now() - startTime;
        this.logger.error(
          `Provider ${provider.name} failed: ${error?.message || error}`,
        );
        this.handleProviderError(provider.name, error);

        // Log failure
        this.aiLogRepository
          .save({
            type: 'ai_call',
            model: provider.name,
            prompt: prompt.substring(0, 500),
            status: 'failure',
            errorMessage: error?.message || String(error),
            latency,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
            createdAt: new Date(),
          })
          .catch((err) => this.logger.error('Failed to save AI log', err));
      } finally {
        this.locks[provider.name] = false;
      }
    }
    return null;
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.genAI) throw new Error('Gemini not configured');
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async gradeVocalPerformance(
    audioBuffer: Buffer,
    targetScript: string,
    locale: string = 'fr-FR',
    mimeType: string = 'audio/mp3',
  ): Promise<any> {
    if (!audioBuffer) throw new Error('Audio buffer is empty');

    this.logger.log(
      `Grading vocal performance: ${locale}, ${mimeType}, ${audioBuffer.length} bytes`,
    );

    let geminiError: Error | null = null;

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash-latest',
        });

        const prompt = `
                You are an expert language coach. Analyze the attached audio recording of a student attempting to say: "${targetScript}" in ${locale}.
                
                TASKS:
                1. Compare the audio to the target script.
                2. Evaluate Pronunciation, Pace, and Tone (0-100).
                3. Identify specific words that were mispronounced.
                
                OUTPUT SCHEMA (Strict JSON):
                {
                    "score": number (overall 0-100),
                    "metrics": {
                        "pronunciation": number,
                        "pace": number,
                        "tone": number
                    },
                    "mistakes": [
                        { "word": string, "correctionLabel": "Pronunciation"|"Phonetic", "feedback": "Short encouraging tip" }
                    ],
                    "feedback": "Overall encouraging summary"
                }
                
                Return ONLY the raw JSON.`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: audioBuffer.toString('base64'),
              mimeType:
                mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a'
                  ? 'audio/aac'
                  : mimeType,
            },
          },
        ]);

        const responseText = result.response.text();
        this.logger.debug(`Gemini response: ${responseText}`);
        return this.extractJson(responseText);
      } catch (error) {
        geminiError = error;
        this.logger.warn(
          `Primary Gemini grading failed: ${error.message}. Trying Whisper + text LLM fallback...`,
        );
      }
    } else {
      this.logger.warn(
        'Gemini not configured for audio grading. Proceeding to Whisper + text LLM fallback.',
      );
    }

    // --- Fallback logic ---
    try {
      const cleanMime = mimeType.toLowerCase();
      const isGroqSupported =
        cleanMime.includes('mpeg') ||
        cleanMime.includes('mp3') ||
        cleanMime.includes('wav') ||
        cleanMime.includes('m4a') ||
        cleanMime.includes('ogg') ||
        cleanMime.includes('opus') ||
        cleanMime.includes('flac') ||
        cleanMime.includes('webm');

      let normalizedBuffer = audioBuffer;
      let filename = 'audio.wav';
      let typeForBlob = 'audio/wav';

      if (isGroqSupported) {
        if (cleanMime.includes('mp3')) {
          filename = 'audio.mp3';
          typeForBlob = 'audio/mp3';
        } else if (cleanMime.includes('m4a')) {
          filename = 'audio.m4a';
          typeForBlob = 'audio/m4a';
        } else if (cleanMime.includes('wav')) {
          filename = 'audio.wav';
          typeForBlob = 'audio/wav';
        } else {
          filename = `audio.${cleanMime.split('/')[1] || 'wav'}`;
          typeForBlob = cleanMime;
        }
      } else {
        this.logger.log(
          `Audio format ${mimeType} not natively supported by Groq Whisper. Converting to WAV...`,
        );
        normalizedBuffer = await this.convertAudioToWav(audioBuffer);
        filename = 'audio.wav';
        typeForBlob = 'audio/wav';
      }

      const transcriptionText = await this.transcribeWithGroq(
        normalizedBuffer,
        filename,
        typeForBlob,
        locale,
      );
      this.logger.log(
        `Whisper transcription successful: "${transcriptionText}"`,
      );

      const fallbackPrompt = `
            You are an expert language coach. Analyze a student's attempt to say: "${targetScript}" in ${locale}.
            The student actually said (transcribed): "${transcriptionText}".
            
            TASKS:
            1. Compare the student's transcription to the target script.
            2. Evaluate Pronunciation, Pace, and Tone (0-100). Since you only have the text transcription, estimate the Pace and Tone based on natural pauses or word completeness.
            3. Identify specific words that were mispronounced, missed, or added by comparing the target to the transcription.
            
            OUTPUT SCHEMA (Strict JSON):
            {
                "score": number (overall 0-100),
                "metrics": {
                    "pronunciation": number,
                    "pace": number,
                    "tone": number
                },
                "mistakes": [
                    { "word": string, "correctionLabel": "Pronunciation"|"Phonetic"|"Missing", "feedback": "Short encouraging tip" }
                ],
                "feedback": "Overall encouraging summary"
            }
            
            Return ONLY the raw JSON.`;

      const responseText = await this.generate(fallbackPrompt, {
        type: 'vocal_grading_fallback',
        locale,
      });
      if (!responseText)
        throw new Error('Text LLM fallback generated empty response');

      const resultJson = this.extractJson(responseText);
      if (!resultJson)
        throw new Error('Could not parse text LLM fallback response as JSON');

      return resultJson;
    } catch (fallbackError) {
      this.logger.error(
        `Vocal grading fallback failed: ${fallbackError.message}`,
        fallbackError.stack,
      );
      throw geminiError || fallbackError;
    }
  }

  private async convertAudioToWav(inputBuffer: Buffer): Promise<Buffer> {
    const { writeFileSync, readFileSync, unlinkSync } = require('fs');
    const { join } = require('path');
    const os = require('os');
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegStatic = require('ffmpeg-static');

    ffmpeg.setFfmpegPath(ffmpegStatic);

    const tempInputPath = join(os.tmpdir(), `vocal_input_${Date.now()}.bin`);
    const tempOutputPath = join(os.tmpdir(), `vocal_output_${Date.now()}.wav`);

    writeFileSync(tempInputPath, inputBuffer);

    return new Promise<Buffer>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .toFormat('wav')
        .on('end', () => {
          try {
            const outputBuffer = readFileSync(tempOutputPath);
            unlinkSync(tempInputPath);
            unlinkSync(tempOutputPath);
            resolve(outputBuffer);
          } catch (e) {
            reject(e);
          }
        })
        .on('error', (err) => {
          try {
            unlinkSync(tempInputPath);
            unlinkSync(tempOutputPath);
          } catch (e) {}
          reject(err);
        })
        .save(tempOutputPath);
    });
  }

  private async transcribeWithGroq(
    audioBuffer: Buffer,
    filename: string,
    mimeType: string,
    locale?: string,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-large-v3');

    if (locale) {
      const lang = locale.split('-')[0];
      formData.append('language', lang);
    }

    const response = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Groq Whisper transcription failed (${response.status}): ${errText}`,
      );
    }

    const data = await response.json();
    if (!data.text)
      throw new Error('Empty transcription text returned from Groq');
    return data.text;
  }

  private async callGroq(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });
    if (!res.ok)
      throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  private async callCohere(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('COHERE_API_KEY');
    if (!apiKey) throw new Error('COHERE_API_KEY not configured');

    const res = await fetch('https://api.cohere.com/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'command-r', message: prompt }),
    });
    if (!res.ok)
      throw new Error(`Cohere HTTP ${res.status}: ${await res.text()}`);
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
        model: 'meta-llama/llama-3.1-8b-instruct', // Highly stable Llama-3.1-8B model on OpenRouter
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });
    if (!res.ok)
      throw new Error(`OpenRouter HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }
  private async callMistral(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('MISTRAL_API_KEY');
    if (!apiKey) throw new Error('MISTRAL_API_KEY not configured');

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'open-mistral-nemo', // Current Mistral small model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });
    if (!res.ok)
      throw new Error(`Mistral HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  private async callOllama(prompt: string): Promise<string> {
    const url =
      this.configService.get<string>('OLLAMA_URL') || 'http://localhost:11434';
    const model =
      this.configService.get<string>('OLLAMA_MODEL') || 'llama3.2:3b';

    this.logger.debug(`Ollama call started: ${model}`);

    // Add generous timeout for local Ollama to prevent aborts on slow hardware
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      this.logger.error(`Ollama timeout reached (120s) for model ${model}`);
      controller.abort();
    }, 120000); // 120s timeout

    try {
      const res = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.6,
            num_predict: 512, // Limit response length to speed up generation
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = await res.json();
      return data.response;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateProgramPlan(goal: string, options: any): Promise<any> {
    if (!this.genAI) {
      this.logger.error('Gemini API key not configured');
      // Using fallback for now to avoid complete failure
      return this.getFallbackPlan();
    }

    const {
      duration = 30,
      minutesPerDay = 30,
      learningStyle = 'mixed',
      constraints = [],
      category = 'default',
    } = options;

    const earlyPhase = Math.floor(duration * 0.3);
    const midStart = earlyPhase + 1;
    const midEnd = Math.floor(duration * 0.7);
    const lateStart = midEnd + 1;

    const videoDuration = Math.round(minutesPerDay * 0.3);
    const quizDuration = Math.round(minutesPerDay * 0.1);
    const audioDuration = Math.round(minutesPerDay * 0.2);
    const journalDuration = Math.round(minutesPerDay * 0.15);
    const consistencyDuration = 2; // Fixed short commitment

    const systemInstruction = `You are a friendly, direct, and encouraging coach. 
        Create a ${duration}-day plan for the goal: "${goal}".
        
        WORDING STYLE:
        - Use simple, plain English (5th-grade level).
        - AVOID jargon like "curriculum," "foundation," "integration," "pedagogy," or "comprehension."
        - Use short, punchy titles.
        - Talk like a supportive friend who wants the user to succeed.
        
        DAILY FLOW (Index 0-5)
        0. Video (Watch)
        1. Quiz (Check-in)
        2. Audio (Practice)
        3. Journal (Write)
        4. Reflection (Review)
        5. Consistency (Commit)
        
        OUTPUT SCHEMA
        Return a raw JSON array. Every object must have ALL of these keys:
        {
          "dayNumber": integer,
          "theme": string (simple subtopic),
          "focusAreas": string[], (exactly 3 simple things we'll focus on today)
          
          "videoTask": { "title": string, "description": string, "searchQuery": string, "duration": ${videoDuration} },
          "quiz": { "title": "Quick Check", "questions": [{ "question": string, "options": string[4], "correctAnswer": integer, "explanation": string }, { "question": string, "options": string[4], "correctAnswer": integer, "explanation": string }] },
          "audioTask": { "title": string, "description": "Friendly summary of what we'll practice", "mood": "meditation"|"focus"|"ambient", "theme": string, "duration": ${audioDuration} },
          "consistencyTask": { "title": "Tomorrow's Promise", "description": "I'll be back tomorrow to keep going.", "duration": ${consistencyDuration} },
          "journalTask": { "title": string, "prompt": string, "duration": ${journalDuration} },
          "reflectionTask": { "title": "Day Wrap-up", "description": "Quick look at today", "reviewPoints": ["One win from today", "One plan for tomorrow"] }
        }
        
        QUALITY RULES:
        - videoTask.searchQuery must be a specific, high-quality YouTube search query.
        - Avoid generic coaching talk; be specific to "${goal}".`;

    try {
      // Call through the fallback chain (Gemini → Groq → Cohere)
      // Note: Gemini supports JSON mode which improves parsing reliability.
      // Groq/Cohere return plain text that we strip/parse ourselves.
      let text = await this.callWithFallback(systemInstruction);

      if (!text) {
        throw new Error('Empty content from AI');
      }

      // Strip any residual markdown fences just in case
      text = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const rawPlan = this.extractJson(text);
      if (!rawPlan || !Array.isArray(rawPlan)) {
        throw new Error('Parsed plan is not a valid array');
      }

      // Validate each day independently so one bad day doesn't kill the whole plan
      const plan = rawPlan.map((day: any, i: number) => {
        const dayNumber = day.dayNumber || i + 1;
        try {
          this.validateDay(day, dayNumber);
          return day;
        } catch (e) {
          this.logger.warn(
            `Validation failed for day ${dayNumber}: ${e.message}. Using fallback.`,
          );
          return this.getFallbackDay(dayNumber, category);
        }
      });

      this.logger.log(`AI plan generated: ${plan.length} days (validated)`);
      return plan;
    } catch (error) {
      this.logger.error(
        `Failed to generate program plan: ${error?.message || error}`,
      );
      // If quota or other error, return fallback plan instead of crashing
      this.logger.warn('Returning fallback program plan due to AI error');
      return this.getFallbackPlan(Math.min(duration, 7), category);
    }
  }

  async generateSingleDay(
    goal: string,
    dayNumber: number,
    totalDays: number,
    options: any,
    metadata?: any,
  ): Promise<any> {
    const {
      minutesPerDay = 30,
      learningStyle = 'mixed',
      constraints = [],
      category = 'default',
    } = options;

    const earlyPhase = Math.floor(totalDays * 0.3);
    const midEnd = Math.floor(totalDays * 0.7);
    const phase =
      dayNumber <= earlyPhase
        ? 'Foundation'
        : dayNumber <= midEnd
          ? 'Development'
          : 'Mastery';

    const videoDuration = Math.round(minutesPerDay * 0.3);
    const quizDuration = Math.round(minutesPerDay * 0.1);
    const audioDuration = Math.round(minutesPerDay * 0.2);
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
- SEARCH QUERY: videoTask.searchQuery MUST be a specific YouTube query for "${goal}" focused on "${phase}" and today's theme.
- Scannable, mobile-friendly content.
- Action-oriented titles.
- Reflection points: one today's win, one tomorrow's prep.

Return ONLY the raw JSON object starting with { and ending with }.`;

    try {
      const text = await this.callWithFallback(prompt, metadata);
      if (!text) throw new Error('All providers failed for single day');
      const day = this.extractJson(text);
      if (!day) throw new Error('Could not parse day JSON');
      this.validateDay(day, dayNumber);
      return day;
    } catch (error) {
      this.logger.error(
        `generateSingleDay failed for day ${dayNumber}: ${error?.message}`,
      );
      return this.getFallbackDay(dayNumber, category, goal);
    }
  }

  private async repairVideoUrl(
    theme: string,
    title: string,
  ): Promise<string | null> {
    try {
      const prompt = `Find a VALID, WORKING YouTube video URL for: "${theme} - ${title}".
            Use Google Search to find a real video.
            Return ONLY the URL string. Nothing else.`;

      const rawText = await this.callWithFallback(prompt);
      if (!rawText) return null;
      const text = rawText.trim();

      // Extract URL if surrounded by text
      const urlMatch = text.match(
        /https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/,
      );
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
      const response = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      );
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

      const result = await this.callWithFallback(prompt);
      return result ? result.trim() : topic;
    } catch (error) {
      this.logger.error('Failed to generate search query', error);
      return topic; // Fallback to raw topic
    }
  }

  async generateAudioScript(
    dayTheme: string,
    duration: number = 5,
    type: 'morning' | 'night' | 'task' = 'task',
  ): Promise<AudioScriptData> {
    const typeContext = {
      morning:
        'a morning affirmation session to start the day with energy and focus',
      night:
        'a nightly subliminal session for subconscious processing during deep rest',
      task: `an immersive focus session reinforcing a lesson about "${dayTheme}"`,
    };

    const wordCount = Math.max(750, duration * 150); // Targeting at least 750 words for 5-minute sessions to ensure valuable content
    const prompt = `
You are creating ${typeContext[type]} for a ${duration}-minute session.

**Goal/Theme**: "${dayTheme}"

**Session Structure**:
1. **Introduction (1 min)**: Set the space, guide the user to take a deep breath, ground themselves, and introduce today's masterclass theme: "${dayTheme}".
2. **Core Masterclass & Actionable Steps (Remaining time)**:
   - Provide high-impact, direct, and non-generic actionable advice that the user can apply immediately.
   - You MUST include a concrete, real-world live example or a short story/scenario that beautifully illustrates this concept in action.
   - Weave 10-15 powerful, positive subliminal affirmations specific to the goal (e.g., "I am...," "I possess...") naturally into the continuous narrative.
   - Explore the deep psychological shifts and cognitive rewards of mastering "${dayTheme}".
3. **Closing (1 min)**: Gently bring the focus back while grounding the new habits, concluding with a clear, positive next step.

**Requirements**:
1. **Word Count**: You MUST generate at least ${wordCount} words for the "backgroundNarration" to fill the ${duration}-minute duration. Do NOT summarize or use lazy filler text; write a high-value, highly engaging, and fully realized voiceover script.
2. **Pacing & Tone**: Friendly, encouraging, clear, and steady.
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
  "backgroundNarration": "...", // Rich, complete masterclass voiceover script of at least ${wordCount} words containing live examples and actionable advice
  "theme": "${dayTheme}"
}

Return ONLY the raw JSON object starting with { and ending with }.`;

    try {
      const response = await this.callWithFallback(prompt);
      if (!response)
        throw new Error('AI providers failed to generate audio script');

      const data = this.extractJson(response);
      if (!data)
        throw new Error('Failed to extract valid JSON from AI response');

      // Validation & Sanitization
      return {
        sessionType:
          data.sessionType || (type === 'night' ? 'sleep' : 'relaxation'),
        binauralFrequency:
          Number(data.binauralFrequency) || (type === 'night' ? 2 : 10),
        carrierFrequency: Number(data.carrierFrequency) || 200,
        affirmations: Array.isArray(data.affirmations)
          ? data.affirmations
          : ['I am growing every day'],
        backgroundNarration:
          data.backgroundNarration ||
          'Take a deep breath and settle into focus...',
        theme: data.theme || dayTheme,
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate audio script, using safe fallback',
        error,
      );
      const cleanTheme = dayTheme.replace(/^(Day \d+:?\s*)/i, '').trim();

      const intro = `Welcome to this dedicated session. Take a deep, centering breath. Allow your shoulders to drop, and let go of any tension as you ground yourself in this very moment. Today, we are diving deep into the masterclass of ${cleanTheme}. This is not just an abstract concept; it is a highly practical skill and state of mind that will radically transform your progress. In this ${duration}-minute immersion, we will unlock the core principles of ${cleanTheme} so you can integrate them seamlessly into your daily life.`;

      const core = `To truly master ${cleanTheme}, you must move beyond passive understanding and take active, deliberate steps. Let's look at a concrete, real-world example: imagine a high-performance professional facing a sudden, high-stress deadline. Instead of panicking or rushing, they pause, realign their focus, and apply the exact principles of ${cleanTheme} by breaking down the challenge into micro-actions and focusing solely on the next immediate step. By doing this, they enter a state of effortless flow, reducing cognitive load and accelerating their results. You can do the exact same thing starting today. Begin by identifying one small area in your routine where you can apply this concept. Protect your focus, eliminate distractions, and commit to executing it with absolute presence and high-value intent.`;

      const integration = `As you let these insights settle deep into your awareness, let these powerful affirmations sink into your subconscious. You are fully capable of embodying ${cleanTheme} every single day. With each breath, you are becoming more focused, more resilient, and more aligned with your ultimate goal. You have the discipline, the clarity, and the drive to excel. Trust in your ability to grow, adapt, and succeed. Now, gently bring your focus back to the physical space around you, carrying this high-performance energy forward into your next task. You are ready.`;

      const backgroundNarration = `${intro}\n\n${core}\n\n${integration}`;

      return {
        sessionType: type === 'night' ? 'sleep' : 'relaxation',
        binauralFrequency: type === 'night' ? 2 : 10,
        carrierFrequency: 200,
        affirmations: [
          `I am fully aligned with the power of ${cleanTheme}`,
          `I easily integrate ${cleanTheme} into my daily actions`,
          `My mind is focused, clear, and perfectly centered`,
          `I am growing, learning, and progressing every single day`,
          `I choose to act with clarity and absolute presence`,
        ],
        backgroundNarration,
        theme: dayTheme,
      };
    }
  }

  async generateProgramPreview(goal: string, options: any): Promise<any> {
    if (!this.genAI) return this.getFallbackPreview(goal, options);

    const { duration = 30, minutesPerDay = 30, category = 'default' } = options;

    const systemInstruction = `You are a friendly, direct, and encouraging coach. 
        Generate high-level metadata for a ${duration}-day learning journey based on the goal: "${goal}".
        
        TONE & STYLE:
        - Use simple, plain English (5th-grade level).
        - AVOID jargon like "curriculum," "foundation," "integration," or "pedagogy."
        - Use punchy, action-oriented words.
        - Talk like a supportive friend, not a textbook.
        
        OUTPUT SCHEMA:
        Return ONLY a raw JSON object:
        {
          "title": "Short, catchy name for the journey",
          "category": "One of: Skill, Habit, Career, Mental, Fitness",
          "primaryGoal": "The one big thing you will achieve",
          "description": "A quick, exciting summary of why this is great (max 120 chars)",
          "coachInsight": "A short, friendly note about what to expect first.",
          "sampleDays": [
            { "day": 1, "title": "Simple title for Day 1", "focus": "What you'll actually do" },
            { "day": 2, "title": "Simple title for Day 2", "focus": "What you'll actually do" },
            { "day": 3, "title": "Simple title for Day 3", "focus": "What you'll actually do" }
          ],
          "weeklyIntensity": [number, number, number, number, number, number, number] 
        }
        
        Return ONLY valid JSON.`;

    try {
      let text = await this.callWithFallback(systemInstruction);
      if (!text) throw new Error('Preview generation failed');
      text = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const preview = this.extractJson(text);
      if (!preview) {
        throw new Error('Failed to extract valid JSON preview');
      }

      // Self-repair: Ensure title exists
      if (!preview.title || preview.title === '') {
        preview.title = `${goal.charAt(0).toUpperCase() + goal.slice(1)} Mastery`;
      }

      // Self-repair: Ensure EVERY day in the roadmap has a title and focus
      if (Array.isArray(preview.sampleDays)) {
        preview.sampleDays = preview.sampleDays.map((d: any, i: number) => {
          const dayNum = d.day || i + 1;
          const focus = d.focus || d.description || 'Building on your progress';
          return {
            ...d,
            day: dayNum,
            title: d.title || `Day ${dayNum}: ${focus.substring(0, 20)}...`,
            focus: focus,
          };
        });
      }

      // Ensure schema validity
      if (!preview.weeklyIntensity) throw new Error('Incomplete preview data');
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
      description:
        'A transformative ' +
        (options.duration || 30) +
        '-day program built for your growth.',
      coachInsight:
        'This plan is balanced for sustainable progress and steady challenge.',
      sampleDays: [
        {
          day: 1,
          title: 'Foundations of ' + goal,
          focus: 'Setting the stage for your growth.',
        },
        {
          day: 2,
          title: 'Strategic Practice',
          focus: 'Applying core techniques.',
        },
        {
          day: 3,
          title: 'Initial Integration',
          focus: 'Connecting concepts together.',
        },
      ],
      weeklyIntensity: [20, 35, 60, 45, 80, 25, 30],
    };
  }

  private validateDay(day: any, dayIndex: number): void {
    const required = [
      'focusAreas',
      'videoTask',
      'quiz',
      'audioTask',
      'consistencyTask',
      'journalTask',
      'reflectionTask',
    ];

    for (const field of required) {
      if (!day[field])
        throw new Error(`Day ${dayIndex} missing field: ${field}`);
    }

    if (!Array.isArray(day.focusAreas) || day.focusAreas.length !== 3) {
      throw new Error(
        `Day ${dayIndex} focusAreas must be an array of exactly 3 strings`,
      );
    }

    if (!day.quiz || !day.quiz.questions || day.quiz.questions.length !== 2) {
      throw new Error(`Day ${dayIndex} quiz must have exactly 2 questions`);
    }
  }

  private getFallbackDay(
    dayNumber: number,
    goalCategory: string = 'default',
    goalTitle: string = 'productivity',
  ) {
    return {
      dayNumber,
      theme: 'Building Foundations',
      focusAreas: ['Core Concepts', 'Action Steps', 'Future Growth'],
      videoTask: {
        title: 'Introduction to Today',
        description: 'A quick overview of our focus for today.',
        searchQuery: `${goalTitle} foundations`,
        duration: 10,
      },
      quiz: {
        title: 'Quick Check',
        questions: [
          {
            question: 'What is our focus today?',
            options: ['Growth', 'Stagnation', 'Fear', 'Loss'],
            correctAnswer: 0,
            explanation: 'Growth is our primary objective.',
          },
          {
            question: 'Ready to proceed?',
            options: ['Yes', 'Not yet', 'Maybe', 'No'],
            correctAnswer: 0,
            explanation: 'Action is key.',
          },
        ],
      },
      audioTask: {
        title: 'Integration Audio',
        description: "Calmly process today's insights.",
        mood: 'meditation',
        theme: 'Calm growth',
        duration: 8,
      },
      consistencyTask: {
        title: "Tomorrow's Commitment",
        description: 'i will complete my routine tommorrow.',
        duration: 2,
      },
      journalTask: {
        title: "Today's Reflection",
        prompt: "What was your biggest takeaway from today's session?",
        duration: 5,
      },
      reflectionTask: {
        title: 'Daily Wrap-up',
        description: 'Review your progress and prep for tomorrow.',
        reviewPoints: ['Today went well.', 'Tomorrow will be better.'],
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

  private extractJson(text: string): any {
    if (!text) return null;
    try {
      // 1. Clean markdown code fences
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // 2. Try direct parse
      try {
        return JSON.parse(cleaned);
      } catch {
        // Ignore and try regex
      }

      // 3. Robust regex extraction (handles preamble/commentary)
      const jsonMatch =
        cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];

        // Sanitization for "Bad control character in string literal"
        // ONLY replace control characters inside double-quoted string literals!
        jsonString = jsonString.replace(/"([^"\\]|\\.)*"/g, (match) => {
          return match.replace(/[\u0000-\u001F]/g, (ctrl) => {
            if (ctrl === '\n') return '\\n';
            if (ctrl === '\r') return '\\r';
            if (ctrl === '\t') return '\\t';
            return '';
          });
        });

        try {
          return JSON.parse(jsonString);
        } catch (innerErr) {
          this.logger.warn(
            `JSON parse failed after sanitization: ${innerErr.message}`,
          );
          return null;
        }
      }

      return null;
    } catch (err) {
      this.logger.warn(`JSON extraction failed: ${err.message}`);
      return null;
    }
  }
}
