import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskShard } from '../entities/task-shard.entity';
import { AiService } from '../../../ai/ai.service';
import { YoutubeService } from '../../../video/youtube/youtube.service';
import { AudioService } from '../../../audio/audio.service';
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
    private audioService: AudioService,
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

    // 0. Clean up existing tasks for this day to prevent duplicates on retries
    await this.taskRepository.delete({ dayPlanId });
    this.logger.log(`Cleaned up existing tasks for DayPlan ${dayPlanId}`);

    // 1. Get candidate shards
    const shards = await this.shardRepository.find();
    
    // 2. Use AI to select the best 4-6 shards
    const selectionPrompt = `
      You are the Cognitive Coordinator for Ease.
      USER GOAL: "${goal}"
      DAY NUMBER: ${dayPlan.dayNumber}
      
      Select exactly 5 task types from the list that best fit this goal and day.
      Choose a mix of: Awareness (Learning), Action (Practice), and Reflection.
      
      AVAILABLE SHARDS:
      ${shards.map(s => `- ${s.name}: ${s.description}`).join('\n')}
      
      Return a JSON array of strings containing the EXACT shard names.
      Format: ["name-1", "name-2", "name-3", "name-4", "name-5"]
    `;

    const selectedNamesRaw = await this.aiService.generateCustomJson<string[]>(selectionPrompt, []);
    const normalize = (s: string) => s.toLowerCase().trim().replace(/[-_]/g, ' ');
    const selectedNormalized = (selectedNamesRaw || []).map(normalize);

    let selectedShards = shards.filter(s => {
      const shardNameNorm = normalize(s.name);
      return selectedNormalized.some(sel => sel === shardNameNorm || sel.includes(shardNameNorm) || shardNameNorm.includes(sel));
    });

    if (selectedShards.length === 0 && shards.length > 0) {
        const shuffled = [...shards].sort(() => 0.5 - Math.random());
        selectedShards = shuffled.slice(0, 5);
    }

    // 2.5 Sort shards by logical progression (Video -> Practice -> Reflection/Review)
    // This ensures Awareness/Learning happens first and Review/Reflection happens last.
    const getModalityPriority = (modality: string = '', name: string = ''): number => {
      const m = modality.toLowerCase();
      const n = name.toLowerCase();
      
      // Awareness/Learning (Lowest numbers = First)
      if (m.includes('watch') || m.includes('video') || n.includes('tutorial')) return 1;
      if (m.includes('listen') || m.includes('audio')) return 2;
      
      // Verification (Middle)
      if (m.includes('quiz') || m.includes('test') || n.includes('recall')) return 5;
      
      // Application/Action (High numbers)
      if (m.includes('practice') || m.includes('app') || m.includes('action') || m.includes('practical') || m.includes('speaking')) return 10;
      if (m.includes('habit') || m.includes('consistency')) return 11;
      if (m.includes('social')) return 12;

      // Reflection/Review (Highest numbers = Last)
      if (m.includes('write') || m.includes('journal') || m.includes('reflect') || n.includes('review') || n.includes('journal')) return 100;
      
      return 50; // Default for unknown
    };

    selectedShards.sort((a, b) => getModalityPriority(a.modality, a.name) - getModalityPriority(b.modality, b.name));
    this.logger.log(`Sorted shards into logical order: ${selectedShards.map(s => s.name).join(' -> ')}`);

    // 3. Generate content SEQUENTIALLY to allow context grounding
    // This ensures that a Quiz can reference the specific Video content generated just before it.
    const plannedContext: Array<{ type: string; title: string; output: any }> = [];
    
    for (let i = 0; i < selectedShards.length; i++) {
      const shard = selectedShards[i];
      
      const contextPrompt = plannedContext.length > 0
        ? `PREVIOUS TASKS IN THIS RITUAL:
           ${plannedContext.map(p => `- ${p.type} ("${p.title}"): ${JSON.stringify(p.output)}`).join('\n')}`
        : '';

      const contentPrompt = `
        Create specific content for the task shard "${shard.name}" for the goal: "${goal}".
        Day ${dayPlan.dayNumber} of the journey.
        
        SHARD DESCRIPTION: ${shard.description}
        
        ${contextPrompt}
        
        INSTRUCTION:
        Generate the specific JSON content for this task.
        CRITICAL: If this task (e.g. Quiz or Reflection) depends on previous tasks (e.g. Video), base the content DIRECTLY on the details provided in the PREVIOUS TASKS context. 
        Avoid abstract questions. Ground everything in the specific output of preceding tasks.
        
        IF generating a "searchQuery" for a video task:
        - Keep it under 5 words.
        - Make it highly searchable on YouTube (e.g., "how to build consistency habit" instead of "I want to build a habit of consistency in my daily life").
        
        Return JSON: { "title": "...", "description": "...", "searchQuery": "...", "questions": [...], "prompt": "..." }
      `;

      const content = await this.aiService.generateCustomJson<any>(contentPrompt, {});
      
      // Determine mobile type
      let mobileType: string = 'video';
      const modality = shard.modality?.toLowerCase() || '';
      if (modality.includes('watch') || modality.includes('video')) mobileType = 'video';
      else if (modality.includes('write') || modality.includes('journal')) mobileType = 'journal';
      else if (modality.includes('listen') || modality.includes('audio')) mobileType = 'audio';
      else if (modality.includes('reflect')) mobileType = 'reflection';
      else if (modality.includes('quiz') || modality.includes('test')) mobileType = 'quiz';
      else if (modality.includes('practice') || modality.includes('app')) mobileType = 'micro-app';
      else if (modality.includes('habit') || modality.includes('consistency')) mobileType = 'consistency';
      else mobileType = SHARD_TO_MOBILE_TYPE[shard.name] || 'video';

      let videoUrl: string | undefined;
      let audioUrl: string | undefined;

      if (mobileType === 'video' && content.searchQuery) {
        try {
          const video = await this.youtubeService.getRecommendedVideo(goal, content.searchQuery);
          videoUrl = video?.url || 'https://www.youtube.com/watch?v=inpok4MKVLM';
        } catch {
          videoUrl = 'https://www.youtube.com/watch?v=inpok4MKVLM';
        }
      }

      if (mobileType === 'audio') {
        try {
          const script = content.script || content.description || `A guided ${content.title || shard.displayName} session for the goal: ${goal}.`;
          const mood = content.mood || 'focus';
          const filename = `task_${dayPlan.id}_${i}`;
          this.logger.log(`Generating audio for task ${i}: "${content.title}"`);
          audioUrl = await this.audioService.generateAudioTrack(script, mood, filename);
          this.logger.log(`Audio generated: ${audioUrl}`);
        } catch (err) {
          this.logger.error(`Failed to generate audio for task ${i}:`, err);
          // Fallback to ambient background
          audioUrl = 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3';
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
          audioUrl: audioUrl,
        }
      });
      
      await this.taskRepository.save(task);
      
      // Add to context for next tasks in the loop
      plannedContext.push({
        type: mobileType,
        title: task.title,
        output: content
      });
    }

    await this.dayPlanRepository.update(dayPlan.id, { status: 'ready' });
    this.logger.log(`DayPlan ${dayPlanId} orchestrated with ${plannedContext.length} grounded tasks.`);
  }
}
