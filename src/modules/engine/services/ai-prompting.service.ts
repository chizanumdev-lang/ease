import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AiService } from '../../../ai/ai.service';
import { TaskShard } from '../entities/task-shard.entity';
import { Task } from '../../../tasks/entities/task.entity';
import { DayPlan } from '../../../programs/entities/day-plan.entity';

export interface AiDraftTask {
  shardName?: string;
  category?: string;
  modality?: string;
  title?: string;
  description?: string;
  searchQuery?: string;
  questions?: string[];
  scenario?: string;
  options?: Record<string, unknown>[];
  cards?: Record<string, string>[];
  narrationScript?: string;
  targetScript?: string;
}

@Injectable()
export class AiPromptingService {
  private readonly logger = new Logger(AiPromptingService.name);

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
  ) {}

  async simulateBlueprintSelection(goal: string): Promise<Record<string, unknown>[]> {
    const blueprint = await this.generateDayBlueprint(1, goal);
    const shards = await this.shardRepository.find();

    return blueprint.map((draft) => {
      const shard = this.resolveShard(draft, shards);
      return {
        selectedShard: shard.name,
        displayName: draft.title || shard.displayName,
        modality: shard.modality,
        draftContent: draft,
      };
    });
  }

  async adaptiveFillFromSkeleton(dayPlan: DayPlan, goal: string): Promise<AiDraftTask[]> {
    const skeleton = dayPlan.skeleton!;
    const shards = await this.shardRepository.find({
      where: { name: In(skeleton.selectedShards) },
    });

    const [pastJournals, pastQueries, completionStats] = await Promise.all([
      this.fetchPastJournals(dayPlan.programId, dayPlan.dayNumber),
      this.fetchPastVideoQueries(dayPlan.programId, dayPlan.dayNumber),
      this.fetchCompletionStats(dayPlan.programId, dayPlan.dayNumber),
    ]);

    const shardList = shards
      .map((s) => `- ${s.name} [${s.category}]: ${s.description}`)
      .join('\n');

    const prompt = `
You are filling in the content for Day ${dayPlan.dayNumber} of a personalised learning program.

GOAL: "${goal}"
THEME: "${skeleton.theme}"
FOCUS AREAS: ${skeleton.focusAreas.join(', ')}
DAY DIFFICULTY: ${skeleton.difficultyArc}/10
VIDEO TOPIC INTENT: "${skeleton.videoIntent}"
JOURNAL FOCUS: "${skeleton.journalFocus}"

ASSIGNED SHARDS — use EXACTLY these, in this order:
${shardList}

USER CONTEXT (use this to personalise the content):
- Past video search queries (DO NOT repeat any): ${pastQueries.length > 0 ? pastQueries.join(', ') : 'None yet.'}
- Past journal entries: ${pastJournals.length > 0 ? pastJournals.join('\n') : 'None yet.'}
- Tasks completed so far: ${completionStats.completed} completed, ${completionStats.missed} missed
${completionStats.missed > completionStats.completed ? '- They are struggling — keep today manageable and encouraging.' : '- They are doing well — push them a little harder today.'}

WORDING STYLE: 5th-grade English. Punchy. NO AI jargon (embark, vital, journey, tailored).

OUTPUT SCHEMA: Return ONLY a raw JSON array of exactly ${shards.length} objects:
[
  {
    "shardName": "exact-shard-name",
    "category": "video|audio|quiz|journal|consistency",
    "modality": "shard modality",
    "title": "Action Title",
    "description": "Short summary",
    "searchQuery": "YouTube search query (video only, not a repeat)",
    "questions": ["Q1?", "Q2?"],
    "narrationScript": "600+ word coaching script (audio only)",
    "scenario": "Decision scenario (problem-solving only)",
    "options": [{ "id": "1", "text": "...", "feedback": "...", "correct": false }]
  }
]`.trim();

    const result = await this.aiService.generateCustomJson<
      { tasks?: AiDraftTask[]; blueprint?: AiDraftTask[] } | AiDraftTask[]
    >(prompt, []);

    if (result && !Array.isArray(result)) {
      if (result.tasks && Array.isArray(result.tasks)) return result.tasks;
      if (result.blueprint && Array.isArray(result.blueprint)) return result.blueprint;
      return [];
    }
    return Array.isArray(result) ? result : [];
  }

  async generateDayBlueprint(dayNumber: number, goal: string, programId?: string): Promise<AiDraftTask[]> {
    const targetIntensity = Math.min(10, Math.max(1, 3 + Math.floor(dayNumber / 5)));
    const categories = ['video', 'audio', 'quiz', 'journal', 'consistency'];
    const finalShards: TaskShard[] = [];

    const expansionMap: Record<string, string[]> = {
      fitness: ['workout', 'gym', 'health', 'nutrition', 'protein', 'meal', 'physical', 'body', 'muscle', 'exercise', 'fit'],
      physical: ['fitness', 'workout', 'body', 'health', 'exercise', 'fit'],
      fit: ['fitness', 'workout', 'body', 'health', 'exercise', 'physical'],
      language: ['vocab', 'speak', 'listen', 'grammar', 'read', 'write', 'fluency', 'french', 'spanish', 'japanese'],
      french: ['language', 'vocab', 'speak', 'grammar'],
      coding: ['programming', 'software', 'dev', 'code', 'technical', 'logic', 'project', 'script'],
      business: ['entrepreneur', 'startup', 'finance', 'market', 'sales', 'growth', 'strategy', 'budget', 'spending'],
    };

    const lowercaseGoal = goal.toLowerCase();
    const goalTerms = lowercaseGoal.split(/\s+/).filter((t) => t.length > 2);
    const activeThemes = Object.keys(expansionMap).filter((theme) => lowercaseGoal.includes(theme));

    const expandedTerms = [...goalTerms];
    for (const theme of activeThemes) {
      expandedTerms.push(...expansionMap[theme]);
    }

    for (const category of categories) {
      const candidates = await this.shardRepository.find({ where: { category: category as any } });
      const intensityMatched = candidates.filter((s) => Math.abs((s as any).intensity - targetIntensity) <= 2);
      const pool = intensityMatched.length >= 4 ? intensityMatched : candidates;

      const ranked = pool.sort((a, b) => {
        const getScore = (shard: TaskShard) => {
          let s = 0;
          const name = shard.name.toLowerCase();
          const desc = shard.description.toLowerCase();
          const uses = (shard.metadata?.uses || []).map((u: string) => u.toLowerCase());

          for (const term of expandedTerms) {
            if (name.includes(term)) s += 5;
            if (desc.includes(term)) s += 2;
            if (uses.some((u: string) => u.includes(term))) s += 3;
          }

          for (const [theme, themeTerms] of Object.entries(expansionMap)) {
            if (activeThemes.includes(theme)) continue;
            const hasOtherThemeMatch = themeTerms.some((t) => name.includes(t) || uses.some((u: string) => u.includes(t)));
            if (hasOtherThemeMatch) s -= 10;
          }

          const isGeneric = ['watch-tutorial', 'audio-listening', 'check-in', 'daily-journal', 'generic-quiz'].includes(name);
          if (isGeneric) s += 1;

          return s;
        };
        return getScore(b) - getScore(a) || 0.5 - Math.random();
      });

      finalShards.push(ranked[0]);
    }

    let pastQueries: string[] = [];
    let pastJournals: string[] = [];
    let completedTasksCount = 0;
    let missedTasksCount = 0;

    if (programId && dayNumber > 1) {
      try {
        const pastTasks = await this.taskRepository
          .createQueryBuilder('task')
          .innerJoinAndSelect('task.dayPlan', 'dayPlan')
          .where('dayPlan.program_id = :programId', { programId })
          .andWhere('dayPlan.day_number < :dayNumber', { dayNumber })
          .getMany();

        pastQueries = pastTasks.filter((t) => t.type === 'video' && t.metadata?.searchQuery).map((t) => t.metadata?.searchQuery as string);
        pastJournals = pastTasks.filter((t) => t.type === 'journal' && t.content && t.content.length > 10).map((t) => `Day ${t.dayPlan.dayNumber}: "${t.content}"`);
        completedTasksCount = pastTasks.filter((t) => t.completed).length;
        missedTasksCount = pastTasks.length - completedTasksCount;
      } catch (e) {
        this.logger.warn(`Failed to fetch past context: ${(e as Error).message}`);
      }
    }

    const prompt = `
      You are the Cognitive Architect for Ease. 
      USER GOAL: "${goal}"
      DAY NUMBER: ${dayNumber} (Target Intensity: ${targetIntensity}/10)

      PAST PERFORMANCE CONTEXT:
      - Completed Tasks: ${completedTasksCount}
      - Missed Tasks: ${missedTasksCount}

      PAST VIDEO SEARCH QUERIES (DO NOT REPEAT):
      ${pastQueries.length > 0 ? pastQueries.join(', ') : 'None yet.'}

      PAST JOURNAL ENTRIES:
      ${pastJournals.length > 0 ? pastJournals.join('\n') : 'None yet.'}

      TASK: Create a 5-task "Daily Shard Chain" using EXACTLY the 5 templates provided below.
      
      SELECTED TEMPLATES FOR MAPPING:
      ${finalShards.map((s) => `- [${s.category.toUpperCase()}] ${s.name}: ${s.description}. Common Uses: ${s.metadata?.uses?.join(', ') || 'General'}`).join('\n')}

      WORDING STYLE:
      - 5th-grade level English.
      - NO AI jargon.
      - Punchy, goal-specific coaching.

      OUTPUT SCHEMA:
      Return ONLY a raw JSON array of EXACTLY 5 objects.
      
      {
        "shardName": "exact-template-name-from-list",
        "category": "exact category from the list",
        "modality": "exact modality of the selected template",
        "title": "Action Title",
        "description": "Short summary",
        "searchQuery": "Specific YouTube search query",
        "questions": ["Q1?", "Q2?"],
        "scenario": "A detailed situational scenario",
        "options": [
          { "id": "1", "text": "Option 1", "feedback": "...", "correct": false }
        ],
        "cards": [
          { "front": "Concept", "back": "Answer" }
        ],
        "narrationScript": "At least 600 words of highly detailed coaching..."
      }
    `;

    const result = await this.aiService.generateCustomJson<any>(prompt, []);
    if (result && !Array.isArray(result)) {
      if (result.tasks && Array.isArray(result.tasks)) return result.tasks;
      if (result.blueprint && Array.isArray(result.blueprint)) return result.blueprint;
      if (result.shardName) return [result];
      return [];
    }
    return Array.isArray(result) ? result : [];
  }

  resolveShard(draft: AiDraftTask, shards: TaskShard[]): TaskShard {
    const draftName = draft.shardName || '';
    let shard = shards.find((s) => s.name === draftName) || shards.find((s) => s.name.toLowerCase() === draftName.toLowerCase());

    if (!shard) {
      const prefixes = ['video-', 'audio-', 'quiz-', 'journal-', 'consistency-'];
      let cleanName = draftName.toLowerCase();
      for (const prefix of prefixes) {
        if (cleanName.startsWith(prefix)) {
          cleanName = cleanName.substring(prefix.length);
          break;
        }
      }
      shard = shards.find((s) => s.name.toLowerCase() === cleanName);
    }

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
      if (category) shard = shards.find((s) => s.category.toLowerCase() === category);
    }

    if (!shard) {
      const intendedModality = (draft.modality || '').toLowerCase();
      shard = shards.find((s) => s.modality.toLowerCase() === intendedModality);
    }

    return shard || shards[0];
  }

  detectPattern(shard: TaskShard): { mobileType: string; pattern: string } {
    const name = shard.name.toLowerCase();
    const patternMap: Record<string, { mobileType: string; pattern: string }> = {
      'tutorial-watch-template': { mobileType: 'video', pattern: 'standard' },
      'lecture-analysis-template': { mobileType: 'video', pattern: 'analysis' },
      'observational-skill-template': { mobileType: 'video', pattern: 'observation' },
      'technique-demo-template': { mobileType: 'video', pattern: 'technique' },
      'vocal-practice-template': { mobileType: 'audio', pattern: 'vocal-test' },
      'recall-quiz-template': { mobileType: 'quiz', pattern: 'spaced-recall' },
      'problem-solving-template': { mobileType: 'quiz', pattern: 'problem-solving' },
      'speaking-assessment-template': { mobileType: 'quiz', pattern: 'vocal-test' },
      'deep-work-journal-template': { mobileType: 'journal', pattern: 'deep-work' },
      'action-planning-template': { mobileType: 'journal', pattern: 'planning' },
      'daily-ritual-template': { mobileType: 'consistency', pattern: 'ritual' },
    };

    if (patternMap[name]) return patternMap[name];

    const modality = shard.modality?.toLowerCase() || '';
    let mobileType = 'video';
    let pattern = 'standard';

    if (name.includes('vocal') || name.includes('speak') || name.includes('pronunciation')) {
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

  private async fetchPastJournals(programId: string, currentDayNumber: number): Promise<string[]> {
    try {
      const pastTasks = await this.taskRepository.createQueryBuilder('task')
        .innerJoinAndSelect('task.dayPlan', 'dayPlan')
        .where('dayPlan.program_id = :programId', { programId })
        .andWhere('dayPlan.day_number < :dayNumber', { dayNumber: currentDayNumber })
        .andWhere('task.type = :type', { type: 'journal' })
        .andWhere('task.content IS NOT NULL')
        .orderBy('dayPlan.day_number', 'DESC')
        .take(5).getMany();

      return pastTasks.filter((t) => t.content && t.content.length > 10).map((t) => `Day ${t.dayPlan.dayNumber}: "${t.content}"`);
    } catch {
      return [];
    }
  }

  private async fetchPastVideoQueries(programId: string, currentDayNumber: number): Promise<string[]> {
    try {
      const pastTasks = await this.taskRepository.createQueryBuilder('task')
        .innerJoinAndSelect('task.dayPlan', 'dayPlan')
        .where('dayPlan.program_id = :programId', { programId })
        .andWhere('dayPlan.day_number < :dayNumber', { dayNumber: currentDayNumber })
        .andWhere('task.type = :type', { type: 'video' })
        .getMany();

      return pastTasks.filter((t) => t.metadata?.searchQuery).map((t) => t.metadata?.searchQuery as string);
    } catch {
      return [];
    }
  }

  private async fetchCompletionStats(programId: string, currentDayNumber: number): Promise<{ completed: number; missed: number }> {
    try {
      const pastTasks = await this.taskRepository.createQueryBuilder('task')
        .innerJoin('task.dayPlan', 'dayPlan')
        .where('dayPlan.program_id = :programId', { programId })
        .andWhere('dayPlan.day_number < :dayNumber', { dayNumber: currentDayNumber })
        .select(['task.completed'])
        .getMany();

      const completed = pastTasks.filter((t) => t.completed).length;
      return { completed, missed: pastTasks.length - completed };
    } catch {
      return { completed: 0, missed: 0 };
    }
  }
}
