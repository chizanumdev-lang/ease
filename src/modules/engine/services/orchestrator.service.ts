import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskShard } from '../entities/task-shard.entity';
import { AiService } from '../../../ai/ai.service';
import { Program } from '../../../programs/entities/program.entity';
import { DayPlan } from '../../../programs/entities/day-plan.entity';
import { Task } from '../../../tasks/entities/task.entity';

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
      
      AVAILABLE TASK TYPES (SHARDS):
      ${shards.map(s => `- ${s.name}: ${s.description} (Modality: ${s.modality}, Energy: ${s.energyLevel})`).join('\n')}
      
      Select the best 5 task types for today. 
      Balance them: 1 WATCH, 1 CHECK-IN, 1 PRACTICE, 1 REFLECTION, 1 COMMITMENT.
      
      Return a JSON array of shard names: ["name1", "name2", ...]
      IMPORTANT: Use the EXACT names from the list above.
    `;

    const selectedNamesRaw = await this.aiService.generateCustomJson<string[]>(selectionPrompt, []);
    this.logger.log(`AI selected ${selectedNamesRaw.length} shard names: ${selectedNamesRaw.join(', ')}`);

    // Case-insensitive matching and normalization
    const selectedNames = selectedNamesRaw.map(name => name.toLowerCase().trim());
    const selectedShards = shards.filter(s => {
        const shardName = s.name.toLowerCase().trim();
        return selectedNames.includes(shardName);
    });

    this.logger.log(`Matched ${selectedShards.length} shards after normalization`);

    if (selectedShards.length === 0 && shards.length > 0) {
        this.logger.warn('No shards matched AI selection. Falling back to default selection.');
        // Fallback: pick first 5 shards if AI fails to match
        selectedShards.push(...shards.slice(0, 5));
    }

    // 3. Generate content for ALL selected shards in ONE call (Efficiency)
    const contentPrompt = `
      Create specific content for these ${selectedShards.length} task shards for the goal: "${goal}".
      
      SHARDS TO HYDRATE:
      ${selectedShards.map(s => `- ${s.name}: ${s.description}`).join('\n')}
      
      Requirements for each:
      - Title: Punchy and action-oriented
      - Description: Clear instructions
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
      
      const task = this.taskRepository.create({
        dayPlanId: dayPlan.id,
        type: shard.name,
        title: content.title || shard.displayName,
        description: content.description || shard.description,
        duration: shard.typicalDurationMinutes || 10,
        order: i,
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
