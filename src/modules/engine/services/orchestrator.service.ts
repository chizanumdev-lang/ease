import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskShard } from '../entities/task-shard.entity';
import { AiService } from '../../../ai/ai.service';
import { YoutubeService } from '../../../video/youtube/youtube.service';
import { Program } from '../../../programs/entities/program.entity';
import { DayPlan } from '../../../programs/entities/day-plan.entity';
import { Task } from '../../../tasks/entities/task.entity';

const SHARD_TO_MOBILE_TYPE: Record<string, string> = {
  'watch-tutorial': 'video',
  'quick-quiz': 'quiz',
  'binaural-session': 'audio',
  'journal-entry': 'journal',
  'daily-reflection': 'reflection',
  'commitment-check': 'consistency',
};

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private aiService: AiService,
    @InjectRepository(TaskShard)
    private shardRepository: Repository<TaskShard>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(DayPlan)
    private dayPlanRepository: Repository<DayPlan>,
    private youtubeService: YoutubeService,
  ) {}

  /**
   * The core engine loop. 
   * Instead of hardcoded tasks, this picks shards based on:
   * 1. User Goal Domain
   * 2. Current Progress (Day #)
   * 3. Cognitive Profile (Energy/Attention - Future)
   */
  async orchestrateDay(dayPlanId: string, goal: string, context: any = {}): Promise<void> {
    this.logger.log(`Orchestrating Day for Plan ${dayPlanId} (Goal: ${goal})`);
    
    const dayPlan = await this.dayPlanRepository.findOne({ 
      where: { id: dayPlanId },
      relations: ['program'] 
    });
    if (!dayPlan) throw new Error('DayPlan not found');

    // 1. Get candidate shards (all for now, filtered by modality later)
    const shards = await this.shardRepository.find();
    this.logger.log(`Found ${shards.length} total shards in database`);
    
    // 2. Use AI to select the best 4-6 shards for this specific goal/day
    const selectionPrompt = `
      You are the Cognitive Coordinator for Ease.
      USER GOAL: "${goal}"
      DAY NUMBER: ${dayPlan.dayNumber}
      
      The user is building a habit of "${goal}". Select shards that provide a progression of learning, practice, and reflection.
      
      AVAILABLE TASK TYPES (SHARDS):
      ${shards.map(s => `- ${s.name}: ${s.description} (Modality: ${s.modality}, Energy: ${s.energyLevel})`).join('\n')}
      
      Select exactly 5 task types from the list above that best fit this goal and day.
      Choose a mix of:
      1. Awareness (Learning/Watching)
      2. Action (Practice/Micro-App)
      3. Reflection (Journaling/Reflection)
      
      Return a JSON array of strings containing the EXACT shard names.
      Format: ["name-1", "name-2", "name-3", "name-4", "name-5"]
      
      RULES:
      1. Only use names provided in the AVAILABLE TASK TYPES list.
      2. Choose a diverse mix of modalities.
    `;

    const selectedNamesRaw = await this.aiService.generateCustomJson<string[]>(selectionPrompt, []);
    this.logger.log(`AI selection (raw): ${JSON.stringify(selectedNamesRaw)}`);

    // Resilient matching: lowerCase, trim, and remove special chars for comparison
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[-_]/g, ' ');
    const selectedNormalized = (selectedNamesRaw || []).map(normalize);

    const selectedShards = shards.filter(s => {
      const shardNameNorm = normalize(s.name);
      return selectedNormalized.some(sel => sel === shardNameNorm || sel.includes(shardNameNorm) || shardNameNorm.includes(sel));
    });

    this.logger.log(`Matched ${selectedShards.length} shards after normalization`);

    if (selectedShards.length === 0 && shards.length > 0) {
        this.logger.warn('No shards matched AI selection. Falling back to dynamic selection.');
        // Fallback: pick 5 random shards to avoid "default list" feel
        const shuffled = [...shards].sort(() => 0.5 - Math.random());
        selectedShards.push(...shuffled.slice(0, 5));
    }

    // 3. Generate content for ALL selected shards in ONE call (Efficiency)
    const contentPrompt = `
      Create specific content for these ${selectedShards.length} task shards for the goal: "${goal}".
      Day ${dayPlan.dayNumber} of the journey.
      
      SHARDS TO HYDRATE:
      ${selectedShards.map(s => `- ${s.name}: ${s.description}`).join('\n')}
      
      Requirements for each:
      - Title: Punchy and action-oriented (e.g. "Draft your consistency contract" instead of "Consistency Journal")
      - Description: Clear, encouraging instructions
      - Fields: Include specific fields like "searchQuery" for videos, "questions" for quizzes, "prompt" for journals.
      
      Return a JSON object where keys are shard names:
      {
        "shard-name-1": { "title": "...", "description": "...", "searchQuery": "..." },
        "shard-name-2": { ... }
      }
    `;

    const batchContent = await this.aiService.generateCustomJson<Record<string, any>>(contentPrompt, {});
    this.logger.log(`Generated content for ${Object.keys(batchContent).length} tasks`);

    // 4. Save as Tasks
    for (let i = 0; i < selectedShards.length; i++) {
      const shard = selectedShards[i];
      const content = batchContent[shard.name] || {};
      
      let videoUrl: string | undefined;
      
      // Determine mobile type with robust fallback
      let mobileType: string = 'video'; // Safe default
      const modality = shard.modality?.toLowerCase() || '';
      
      if (modality.includes('watch') || modality.includes('video')) mobileType = 'video';
      else if (modality.includes('write') || modality.includes('journal')) mobileType = 'journal';
      else if (modality.includes('listen') || modality.includes('audio')) mobileType = 'audio';
      else if (modality.includes('reflect')) mobileType = 'reflection';
      else if (modality.includes('quiz') || modality.includes('test')) mobileType = 'quiz';
      else if (modality.includes('practice') || modality.includes('app')) mobileType = 'micro-app';
      else if (modality.includes('habit') || modality.includes('consistency')) mobileType = 'consistency';
      else {
        // Fallback to shard name mapping if modality is ambiguous
        mobileType = SHARD_TO_MOBILE_TYPE[shard.name] || 'video';
      }
      
      if (mobileType === 'video' && content.searchQuery) {
        try {
          const video = await this.youtubeService.getRecommendedVideo(goal, content.searchQuery);
          if (video && video.url && !video.url.includes('/results?')) {
            videoUrl = video.url;
          } else {
             // Fallback to a high-quality meditation/focus video if specific search fails
             videoUrl = 'https://www.youtube.com/watch?v=inpok4MKVLM'; // Deep Focus
          }
        } catch (error) {
          this.logger.error(`Failed to fetch video for task: ${error.message}`);
          videoUrl = 'https://www.youtube.com/watch?v=inpok4MKVLM';
        }
      }

      const task = this.taskRepository.create({
        dayPlanId: dayPlan.id,
        type: mobileType,
        title: content.title || shard.displayName,
        description: content.description || shard.description,
        duration: shard.typicalDurationMinutes || 10,
        order: i,
        videoUrl: videoUrl,
        metadata: {
          ...content,
          shardId: shard.id,
          modality: shard.modality,
          energy: shard.energyLevel
        }
      });
      
      await this.taskRepository.save(task);
    }

    this.logger.log(`Saved ${selectedShards.length} tasks to DayPlan ${dayPlan.id}`);

    await this.dayPlanRepository.update(dayPlan.id, { status: 'ready' });
    this.logger.log(`DayPlan ${dayPlan.id} marked as ready`);
  }
}
