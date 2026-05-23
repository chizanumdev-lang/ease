import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskShard } from '../entities/task-shard.entity';
import { AiService } from '../../../ai/ai.service';
import { YoutubeService } from '../../../video/youtube/youtube.service';
import { AudioService } from '../../../audio/audio.service';
import { DayPlan } from '../../../programs/entities/day-plan.entity';
import { Program } from '../../../programs/entities/program.entity';
import { Task } from '../../../tasks/entities/task.entity';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  private readonly SHARD_TO_MOBILE_TYPE: Record<string, string> = {
    'tutorial-watch-template': 'video',
    'guided-session-template': 'video',
    'lecture-analysis-template': 'video',
    'observational-skill-template': 'video',
    'technique-demo-template': 'video',
    'audio-immersion-template': 'audio',
    'guided-audio-template': 'audio',
    'vocal-practice-template': 'audio',
    'recall-quiz-template': 'quiz',
    'knowledge-check-template': 'quiz',
    'problem-solving-template': 'quiz',
    'speaking-assessment-template': 'quiz',
    'reflective-journal-template': 'journal',
    'deep-work-journal-template': 'journal',
    'action-planning-template': 'journal',
    'creative-practice-template': 'journal',
    'habit-tracker-template': 'consistency',
    'daily-ritual-template': 'consistency',
    'micro-practice-template': 'consistency',
  };

  constructor(
    private aiService: AiService,
    @InjectRepository(TaskShard)
    private shardRepository: Repository<TaskShard>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(DayPlan)
    private dayPlanRepository: Repository<DayPlan>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    private youtubeService: YoutubeService,
    private audioService: AudioService,
  ) {}

  /**
   * DEBUG/ADMIN: Simulate which shards would be selected for a goal
   */
  async simulateBlueprintSelection(goal: string): Promise<any> {
    const blueprint = await this.generateDayBlueprint(1, goal);
    const shards = await this.shardRepository.find();

    return blueprint.map((draft) => {
      const shard = this.resolveShard(draft, shards);

      return {
        selectedShard: shard.name,
        // Use AI's generated title if available, otherwise fallback to DB displayName
        displayName: draft.title || shard.displayName,
        modality: shard.modality,
        draftContent: draft,
      };
    });
  }

  /**
   * STAGE 1: Early Orchestration
   * This should be called as soon as the user enters their goal in the wizard.
   */
  async orchestrateDay(
    dayPlanId: string,
    goal: string,
    context: any = {},
  ): Promise<void> {
    this.logger.log(`Starting Pipeline Orchestration for DayPlan ${dayPlanId}`);

    const dayPlan = await this.dayPlanRepository.findOne({
      where: { id: dayPlanId },
      relations: ['program'],
    });
    if (!dayPlan) throw new Error('DayPlan not found');

    if (dayPlan.status === 'generating') {
      this.logger.warn(
        `DayPlan ${dayPlanId} is already generating/hydrating. Skipping duplicate orchestration call.`,
      );
      return;
    }

    // Lock the day plan by setting status to generating
    dayPlan.status = 'generating';
    await this.dayPlanRepository.save(dayPlan);

    try {
      // 0. Clean up existing tasks
      await this.taskRepository.delete({ dayPlanId });

      // 1. PHASE: BLUEPRINTING (Thinking)
      const blueprint = await this.generateDayBlueprint(
        dayPlan.dayNumber,
        goal,
      );

      // 2. PHASE: SHELL CREATION (Instant)
      const shards = await this.shardRepository.find();
      const tasks: Task[] = [];

      for (let i = 0; i < blueprint.length; i++) {
        const draft = blueprint[i];

        const shard = this.resolveShard(draft, shards);

        const { mobileType, pattern } = this.detectPattern(shard);

        const task = this.taskRepository.create({
          dayPlanId: dayPlan.id,
          type: mobileType,
          title: draft.title || shard.displayName,
          description: draft.description || shard.description,
          duration: shard.typicalDurationMinutes || 10,
          order: i,
          metadata: {
            ...draft,
            pattern,
            shardId: shard.id,
            status: 'hydrating', // Mark as processing
          },
        });
        tasks.push(await this.taskRepository.save(task));
      }

      // 3. PHASE: HYDRATION (Resource Fetching with Retries)
      // We do this in the background, but prioritize the first few tasks
      await this.hydrateDayResources(tasks, shards, goal, dayPlan.id)
        .catch(async (err) => {
          this.logger.error(
            `Background Hydration Failed for DayPlan ${dayPlan.id}: ${err.message}`,
          );
          await this.dayPlanRepository.update(dayPlanId, { status: 'failed' });
        })
        .finally(async () => {
          // Ensure Program is marked as ready once initial hydration attempt is done
          const program = await this.programRepository.findOne({
            where: { id: dayPlan.programId },
          });
          if (program && program.status === 'generating') {
            program.status = 'ready';
            await this.programRepository.save(program);
            this.logger.log(
              `Program ${program.id} marked as READY after hydration attempt.`,
            );
          }
        });

      this.logger.log(
        `Blueprint created for ${dayPlan.id}. Hydration completed.`,
      );
    } catch (err) {
      this.logger.error(
        `Orchestration failed for DayPlan ${dayPlanId}: ${err.message}`,
      );
      await this.dayPlanRepository.update(dayPlanId, { status: 'failed' });

      // Also ensure program is marked ready if failed so user isn't stuck
      const program = await this.programRepository.findOne({
        where: { id: dayPlan.programId },
      });
      if (program && program.status === 'generating') {
        program.status = 'ready';
        await this.programRepository.save(program);
      }

      throw err;
    }
  }

  private async generateDayBlueprint(
    dayNumber: number,
    goal: string,
  ): Promise<any[]> {
    /**
     * SEMANTIC MAPPING LOGIC:
     * 1. Calculate target intensity based on program progression (e.g., lower for Day 1).
     * 2. Categorize all shards into 5 core pools (video, audio, quiz, journal, consistency).
     * 3. Filter each pool for shards that match the target intensity range (+/- 2).
     * 4. Rank candidates by keyword relevance to the user's specific goal (with concept expansion).
     * 5. Provide the top 4 candidates from EACH category to the AI (20 total).
     * This creates a "Map" that ensures the AI always sees the most relevant tasks.
     */
    const targetIntensity = Math.min(
      10,
      Math.max(1, 3 + Math.floor(dayNumber / 5)),
    );
    const categories = ['video', 'audio', 'quiz', 'journal', 'consistency'];
    const finalShards: any[] = [];

    // Concept Expansion Map to help rank related but non-literal shards
    const expansionMap: Record<string, string[]> = {
      fitness: [
        'workout',
        'gym',
        'health',
        'nutrition',
        'protein',
        'meal',
        'physical',
        'body',
        'muscle',
        'exercise',
        'fit',
      ],
      physical: ['fitness', 'workout', 'body', 'health', 'exercise', 'fit'],
      fit: ['fitness', 'workout', 'body', 'health', 'exercise', 'physical'],
      language: [
        'vocab',
        'speak',
        'listen',
        'grammar',
        'read',
        'write',
        'fluency',
        'french',
        'spanish',
        'japanese',
      ],
      french: ['language', 'vocab', 'speak', 'grammar'],
      coding: [
        'programming',
        'software',
        'dev',
        'code',
        'technical',
        'logic',
        'project',
        'script',
      ],
      business: [
        'entrepreneur',
        'startup',
        'finance',
        'market',
        'sales',
        'growth',
        'strategy',
        'budget',
        'spending',
      ],
    };

    const lowercaseGoal = goal.toLowerCase();
    const goalTerms = lowercaseGoal.split(/\s+/).filter((t) => t.length > 2);

    // Identify active themes for penalty logic
    const activeThemes = Object.keys(expansionMap).filter((theme) =>
      lowercaseGoal.includes(theme),
    );

    // Expand terms based on common themes
    const expandedTerms = [...goalTerms];
    for (const theme of activeThemes) {
      expandedTerms.push(...expansionMap[theme]);
    }

    for (const category of categories) {
      const candidates = await this.shardRepository.find({
        where: { category: category as any },
      });

      // Intensity filtering (prefer shards within +/- 2 of target)
      const intensityMatched = candidates.filter(
        (s) => Math.abs((s as any).intensity - targetIntensity) <= 2,
      );
      const pool = intensityMatched.length >= 4 ? intensityMatched : candidates;

      // Semantic ranking
      const ranked = pool.sort((a, b) => {
        const getScore = (shard: any) => {
          let s = 0;
          const name = shard.name.toLowerCase();
          const desc = shard.description.toLowerCase();
          const uses = (shard.metadata?.uses || []).map((u: string) =>
            u.toLowerCase(),
          );

          // Positive Match
          for (const term of expandedTerms) {
            if (name.includes(term)) s += 5; // Boosted name match
            if (desc.includes(term)) s += 2;
            if (uses.some((u: string) => u.includes(term))) s += 3;
          }

          // Negative Penalty: If shard matches a DIFFERENT theme strongly, penalize it
          for (const [theme, themeTerms] of Object.entries(expansionMap)) {
            if (activeThemes.includes(theme)) continue; // Skip active themes

            // If shard contains terms from an UNRELATED theme, penalize heavily
            const hasOtherThemeMatch = themeTerms.some(
              (t) =>
                name.includes(t) || uses.some((u: string) => u.includes(t)),
            );
            if (hasOtherThemeMatch) s -= 10;
          }

          // Generic Shard Bonus: If no matches, prefer generic templates over specific irrelevant ones
          const isGeneric =
            name === 'watch-tutorial' ||
            name === 'audio-listening' ||
            name === 'check-in' ||
            name === 'daily-journal' ||
            name === 'generic-quiz';
          if (isGeneric) s += 1;

          return s;
        };
        return getScore(b) - getScore(a) || 0.5 - Math.random();
      });

      // Take top 4 from each category to give AI enough options but high relevance
      finalShards.push(...ranked.slice(0, 4));
    }

    // 2. PHASE: Blueprinting
    const prompt = `
      You are the Cognitive Architect for Ease. 
      USER GOAL: "${goal}"
      DAY NUMBER: ${dayNumber} (Target Intensity: ${targetIntensity}/10)

      TASK: Create a 5-task "Daily Shard Chain" using EXACTLY 5 templates from the list below.
      Each template represents a core functional behavior. Use the "metadata.uses" mapping to determine which template best fits the user's specific progress for today.
      
      SELECTED TEMPLATES FOR MAPPING:
      ${finalShards.map((s) => `- [${s.category.toUpperCase()}] ${s.name}: ${s.description}. Common Uses: ${s.metadata?.uses?.join(', ') || 'General'}`).join('\n')}

      WORDING STYLE:
      - 5th-grade level English.
      - NO AI jargon (comprehensive, embark, vital, journey, tailored, personalized).
      - Punchy, goal-specific coaching.
      - Act like a high-performance coach who knows the user's specific goal deeply.

      OUTPUT SCHEMA:
      Return ONLY a raw JSON array of EXACTLY 5 objects.
      
      {
        "shardName": "exact-template-name-from-list",
        "category": "exact category from the list (video, audio, quiz, journal, consistency)",
        "modality": "exact modality of the selected template",
        "title": "Action Title (Goal-specific)",
        "description": "Short summary (Goal-specific)",
        "searchQuery": "Specific YouTube search query (if video template)",
        "questions": ["Q1?", "Q2?"], // (if generic quiz template)
        "scenario": "A detailed situational scenario that needs a decision (if problem-solving-template)",
        "options": [ // (if problem-solving-template)
          { "id": "1", "text": "Option 1", "feedback": "Why it's right/wrong", "correct": false },
          { "id": "2", "text": "Option 2", "feedback": "Why it's right/wrong", "correct": true }
        ],
        "narrationScript": "At least 600 words of highly detailed and specific coaching. NO generic intros. Focus on 'How' and 'Why' this specific task helps with ${goal}. This must be long and comprehensive to ensure a spoken length of at least 4-5 minutes. IMPORTANT PACING: If this is a physical exercise, breathing routine, or meditation, you MUST include explicit count-downs (e.g. 'Hold for 10 seconds. 10... 9... 8...') so the user has actual time to perform the movements. Do not rush through."
      }

      STRICT REQUIREMENTS:
      1. Exactly 5 Tasks: No more, no less.
      2. Modality Diversity: You MUST pick exactly 1 Video, 1 Audio, 1 Quiz, 1 Journal, and 1 Consistency template from the provided list.
      3. No Repeats: Do not use the same template twice.
      4. Intensity Alignment: Prioritize tasks that match the day's intensity (${targetIntensity}).
    `;

    const result = await this.aiService.generateCustomJson<any>(prompt, []);

    // Handle cases where AI wraps the array in an object like { "tasks": [...] }
    if (result && !Array.isArray(result)) {
      if (result.tasks && Array.isArray(result.tasks)) {
        return result.tasks;
      }
      if (result.blueprint && Array.isArray(result.blueprint)) {
        return result.blueprint;
      }
      // If it's an object but not a known wrapper, wrap it ourselves if it looks like a single task
      if (result.shardName) {
        return [result];
      }
      return [];
    }

    return Array.isArray(result) ? result : [];
  }

  private async hydrateDayResources(
    tasks: Task[],
    shards: TaskShard[],
    goal: string,
    dayPlanId: string,
  ) {
    // Sort tasks by priority for hydration (Video first)
    const priority = (t: Task) =>
      t.type === 'video' ? 0 : t.type === 'audio' ? 1 : 2;
    const sortedTasks = [...tasks].sort((a, b) => priority(a) - priority(b));

    for (const task of sortedTasks) {
      try {
        const shard = shards.find((s) => s.id === task.metadata.shardId);
        await this.hydrateSingleTask(task, shard, goal, dayPlanId);

        // Mark task as ready
        task.metadata.status = 'ready';
        await this.taskRepository.save(task);
      } catch (err) {
        this.logger.error(`Failed to hydrate task ${task.id}: ${err.message}`);
        task.metadata.status = 'error';
        await this.taskRepository.save(task);
      }
    }

    // Mark DayPlan as ready when all critical tasks are done
    await this.dayPlanRepository.update(dayPlanId, { status: 'ready' });
  }

  private async hydrateSingleTask(
    task: Task,
    shard: any,
    goal: string,
    dayPlanId: string,
  ) {
    const metadata = task.metadata;

    // 1. Handle VIDEO Hydration (with Retry Loop)
    if (task.type === 'video' && metadata.searchQuery) {
      const videoUrl = await this.fetchVideoWithRetry(
        goal,
        metadata.searchQuery,
      );
      task.videoUrl = videoUrl;
    }

    // Auto-expand short scripts to ensure full 4-5 mins length
    if (metadata.pattern === 'vocal-test' || task.type === 'audio') {
      const currentScript =
        metadata.narrationScript ||
        metadata.targetScript ||
        metadata.description ||
        `Session for ${goal}`;
      const wordCount = currentScript.split(/\s+/).filter(Boolean).length;
      if (wordCount < 180) {
        this.logger.log(
          `Initial script is too short (${wordCount} words). Expanding via AI to ensure 4-5 mins of duration.`,
        );
        const expansionPrompt = `
                You are the cognitive elite voice coach for Ease.
                We have an audio lesson for the user's goal: "${goal}".
                The task title is: "${task.title}".
                The current script outline is: "${currentScript}".
                
                Your task is to expand this into a highly detailed, comprehensive, goal-specific voice coaching script of AT LEAST 600 words.
                The voice coach is instructing the student. 
                
                CRITICAL: 
                - The length must be at least 600 words so that the spoken track is 4-5 minutes long.
                - Style: Simple 5th-grade English. NO AI jargon (vital, journey, tailored, embark, comprehensive).
                - Write ONLY the raw text script of the narration. DO NOT include any formatting like "Narrator:", "Host:", bracketed audio cues, asterisks, or markdown formatting. Just write the exact spoken words, paragraphs, and guidance so it can be converted to speech.
                - Pacing & Pauses: If the task involves physical movement, stretching, or breathing, you MUST include explicit spoken count-downs or guided timing (e.g., "Hold this stretch for 15 seconds. Let's count. 15... 14... 13...") to give the user actual time to perform the actions in real-time. Do not rush through the instructions without giving them time to execute.
            `;
        try {
          const expandedScript = await this.aiService.generate(expansionPrompt);
          if (expandedScript && expandedScript.trim().length > 100) {
            metadata.narrationScript = expandedScript.trim();
            this.logger.log(
              `Successfully expanded initial script to ${metadata.narrationScript.split(/\s+/).length} words.`,
            );
          }
        } catch (err) {
          this.logger.error(`Failed to expand initial script: ${err.message}`);
        }
      }
    }

    // 2. Handle VOCAL TEST Hydration
    if (metadata.pattern === 'vocal-test') {
      const ttsScript =
        metadata.narrationScript ||
        metadata.targetScript ||
        metadata.description ||
        `Practice speaking about ${goal}`;
      const filename = `vocal_model_${dayPlanId}_${task.id}`;
      metadata.audioUrl = await this.audioService.generateAudioTrack(
        ttsScript,
        'calm',
        filename,
        true,
      );
    }

    // 3. Handle AUDIO Hydration
    if (task.type === 'audio' && !metadata.audioUrl) {
      const script =
        metadata.narrationScript ||
        metadata.description ||
        `Session for ${goal}`;
      const filename = `audio_task_${dayPlanId}_${task.id}`;
      metadata.audioUrl = await this.audioService.generateAudioTrack(
        script,
        'focus',
        filename,
      );
    }
  }

  private async fetchVideoWithRetry(
    goal: string,
    query: string,
  ): Promise<string> {
    try {
      const video = await this.youtubeService.getRecommendedVideo(goal, query);
      if (video?.url) return video.url;
      throw new Error('No video found');
    } catch (err) {
      this.logger.warn(
        `Initial video search failed for "${query}". Retrying with goal: "${goal}"`,
      );
      // Retry with broader goal
      const fallback = await this.youtubeService.getRecommendedVideo(
        goal,
        goal,
      );
      return fallback?.url || 'https://www.youtube.com/watch?v=inpok4MKVLM';
    }
  }

  private resolveShard(draft: any, shards: TaskShard[]): TaskShard {
    const draftName = draft.shardName || '';

    // 1. Exact or Case-Insensitive matching
    let shard = shards.find((s) => s.name === draftName);
    if (!shard)
      shard = shards.find(
        (s) => s.name.toLowerCase() === draftName.toLowerCase(),
      );

    // 2. Clean prefix matching (e.g., "video-observational-skill-template" -> "observational-skill-template")
    if (!shard) {
      const prefixes = [
        'video-',
        'audio-',
        'quiz-',
        'journal-',
        'consistency-',
      ];
      let cleanName = draftName.toLowerCase();
      for (const prefix of prefixes) {
        if (cleanName.startsWith(prefix)) {
          cleanName = cleanName.substring(prefix.length);
          break;
        }
      }
      shard = shards.find((s) => s.name.toLowerCase() === cleanName);
    }

    // 3. Intended Category Fallback (from draft.category, draft.modality, or extracted from shardName prefix)
    if (!shard) {
      let category = (draft.category || '').toLowerCase();
      if (!category) {
        const prefixes = ['video', 'audio', 'quiz', 'journal', 'consistency'];
        for (const prefix of prefixes) {
          if (draftName.toLowerCase().startsWith(prefix + '-')) {
            category = prefix;
            break;
          }
        }
      }
      if (category) {
        shard = shards.find((s) => s.category.toLowerCase() === category);
      }
    }

    // 4. Modality fallback
    if (!shard) {
      const intendedModality = (draft.modality || '').toLowerCase();
      shard = shards.find((s) => s.modality.toLowerCase() === intendedModality);
    }

    // 5. Ultimate fallback
    return shard || shards[0];
  }

  private detectPattern(shard: TaskShard): {
    mobileType: string;
    pattern: string;
  } {
    const name = shard.name.toLowerCase();

    // Explicit Template Mapping
    const patternMap: Record<string, { type: string; pattern: string }> = {
      'tutorial-watch-template': { type: 'video', pattern: 'standard' },
      'lecture-analysis-template': { type: 'video', pattern: 'analysis' },
      'observational-skill-template': { type: 'video', pattern: 'observation' },
      'technique-demo-template': { type: 'video', pattern: 'technique' },
      'vocal-practice-template': { type: 'audio', pattern: 'vocal-test' },
      'recall-quiz-template': { type: 'quiz', pattern: 'spaced-recall' },
      'problem-solving-template': { type: 'quiz', pattern: 'problem-solving' },
      'speaking-assessment-template': { type: 'quiz', pattern: 'vocal-test' },
      'deep-work-journal-template': { type: 'journal', pattern: 'deep-work' },
      'action-planning-template': { type: 'journal', pattern: 'planning' },
      'daily-ritual-template': { type: 'consistency', pattern: 'ritual' },
    };

    if (patternMap[name]) {
      return {
        mobileType: patternMap[name].type,
        pattern: patternMap[name].pattern,
      };
    }

    const modality = shard.modality?.toLowerCase() || '';
    let mobileType = 'video';
    let pattern = 'standard';

    if (
      name.includes('vocal') ||
      name.includes('speak') ||
      name.includes('pronunciation')
    ) {
      pattern = 'vocal-test';
      mobileType = 'quiz';
    } else if (modality.includes('watch') || modality.includes('video')) {
      mobileType = 'video';
    } else if (modality.includes('write') || modality.includes('journal')) {
      mobileType = 'journal';
    } else if (modality.includes('listen') || modality.includes('audio')) {
      mobileType = 'audio';
    } else if (modality.includes('quiz') || modality.includes('test')) {
      mobileType = 'quiz';
    } else {
      mobileType = this.SHARD_TO_MOBILE_TYPE[name] || 'video';
    }

    return { mobileType, pattern };
  }
}
