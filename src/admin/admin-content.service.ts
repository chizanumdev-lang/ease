import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Program } from '../programs/entities/program.entity';
import { AiGenerationLog } from './entities/ai-generation-log.entity';
import { ApiCostLog } from './entities/api-cost-log.entity';
import { ErrorLog } from './entities/error-log.entity';
import { ProgramRating } from './entities/program-rating.entity';
import { Referral } from './entities/referral.entity';
import { DayPlan } from '../programs/entities/day-plan.entity';
import { TaskTemplate } from '../tasks/entities/task-template.entity';
import { BackgroundService } from '../modules/worker/background.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';


@Injectable()
export class AdminContentService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
    @InjectRepository(AiGenerationLog)
    private aiLogRepository: Repository<AiGenerationLog>,
    @InjectRepository(ApiCostLog)
    private costLogRepository: Repository<ApiCostLog>,
    @InjectRepository(ErrorLog)
    private errorLogRepository: Repository<ErrorLog>,
    @InjectRepository(ProgramRating)
    private ratingRepository: Repository<ProgramRating>,
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(DayPlan)
    private dayPlanRepository: Repository<DayPlan>,
    @InjectRepository(TaskTemplate)
    private taskTemplateRepository: Repository<TaskTemplate>,
    private backgroundService: BackgroundService,
    @InjectQueue('background-jobs') private queue: Queue,
  ) {}

  async getTaskTemplates() {
    const templates = await this.taskTemplateRepository.find({
      order: { createdAt: 'DESC' },
    });

    // Seed some initial templates if none exist
    if (templates.length === 0) {
      const initialTemplates = [
        // --- MEDIA & CORE ---
        {
          title: 'Audio Ritual (Binaural)',
          description: 'Immersive 3D audio experience for state-shifting',
          type: 'audio',
          defaultDuration: 12,
          promptInstructions:
            'Primary tool for meditation, focus, or sleep preparation. AI should select this when the goal requires a specific mental state shift.',
        },
        {
          title: 'Video Masterclass',
          description: 'Visual lesson or instructional content',
          type: 'video',
          defaultDuration: 20,
          promptInstructions:
            'Use for skill acquisition or demonstration. Select this when the user needs to see a technique in action.',
        },
        {
          title: 'Knowledge Quiz',
          description: 'Interactive assessment of learned material',
          type: 'quiz',
          defaultDuration: 5,
          promptInstructions:
            'Reinforcement. Place immediately following a Video Masterclass to verify comprehension.',
        },

        // --- PRODUCTIVITY ---
        {
          title: 'Pomodoro Sprint',
          description: '25 min intense work, 5 min rest',
          type: 'focus',
          defaultDuration: 30,
          promptInstructions:
            'Select for high cognitive load tasks where focus is flagging or the user feels overwhelmed.',
        },
        {
          title: 'Eisenhower Matrix',
          description: 'Categorize tasks by urgency and importance',
          type: 'focus',
          defaultDuration: 15,
          promptInstructions:
            'Strategic task. Use when the user expresses decision paralysis or has too many competing priorities.',
        },
        {
          title: 'Deep Strategy Session',
          description: 'Long-term roadmap and vision planning',
          type: 'focus',
          defaultDuration: 45,
          promptInstructions:
            'Leadership/Career shard. Use for high-level planning and big-picture thinking.',
        },
        {
          title: 'Inbox Zero Protocol',
          description: 'Systematic clearance of all pending communications',
          type: 'focus',
          defaultDuration: 20,
          promptInstructions:
            'Administrative shard. Use to reduce digital clutter and communication overhead.',
        },

        // --- MENTAL ---
        {
          title: 'Box Breathing',
          description: '4-4-4-4 rhythmic breathing for nervous system reset',
          type: 'mental',
          defaultDuration: 5,
          promptInstructions:
            'Biological reset. Use for stress management or during high-pressure situations.',
        },
        {
          title: 'Stoic Perspective Audit',
          description:
            'Reframe current challenges through the lens of Stoicism',
          type: 'mental',
          defaultDuration: 10,
          promptInstructions:
            'Philosophical shard. Use when the user is facing external obstacles or emotional turbulence.',
        },
        {
          title: 'Visualization Rehearsal',
          description: 'Mentally walkthrough successful goal achievement',
          type: 'mental',
          defaultDuration: 10,
          promptInstructions:
            'Performance shard. Use before major events like public speaking, competitions, or high-stakes meetings.',
        },
        {
          title: 'Evening Decompression',
          description: 'Review the day and release cognitive loops',
          type: 'mental',
          defaultDuration: 10,
          promptInstructions:
            'Closure shard. Use in the final block of the day to prepare the brain for sleep.',
        },

        // --- PHYSICAL ---
        {
          title: 'Circadian Reset (Sun)',
          description: '10 mins of natural sunlight exposure',
          type: 'exercise',
          defaultDuration: 10,
          promptInstructions:
            'Biological shard. Primary placement in the first hour of waking to set circadian rhythms.',
        },
        {
          title: 'Posture Realignment',
          description:
            'Specific stretches to counter desk-based sedentary stress',
          type: 'exercise',
          defaultDuration: 5,
          promptInstructions:
            'Health shard. Mandatory for users with desk-based jobs or long study blocks.',
        },
        {
          title: 'Cold Exposure Reset',
          description: 'Cold shower or plunge for metabolic and dopamine boost',
          type: 'exercise',
          defaultDuration: 5,
          promptInstructions:
            'Resilience shard. High-impact movement for morning energy or mood regulation.',
        },
        {
          title: 'Metabolic Hydration',
          description: 'Intentional intake of 500ml water with electrolytes',
          type: 'exercise',
          defaultDuration: 2,
          promptInstructions:
            'Maintenance shard. Select periodically for general health and energy consistency.',
        },

        // --- SKILLS ---
        {
          title: 'Spaced Repetition Review',
          description: 'Active recall and flashcard review session',
          type: 'focus',
          defaultDuration: 15,
          promptInstructions:
            'Educational shard. Use for long-term memorization and knowledge retention.',
        },
        {
          title: 'Rapid Prototyping Block',
          description: 'Build a low-fidelity version of an idea',
          type: 'focus',
          defaultDuration: 30,
          promptInstructions:
            'Creative shard. Use for innovation, entrepreneurship, or artistic goals.',
        },
        {
          title: 'Language Immersion',
          description: 'Active target language practice or listening',
          type: 'focus',
          defaultDuration: 20,
          promptInstructions:
            'Linguistic shard. Select for travel or cognitive development goals.',
        },

        // --- SOCIAL ---
        {
          title: 'Networking Reachout',
          description: 'Send a high-value note to a professional peer',
          type: 'focus',
          defaultDuration: 10,
          promptInstructions:
            'Community shard. Use for career growth and professional relationship building.',
        },
        {
          title: 'Active Listening Session',
          description: 'Intentional deep conversation with zero distraction',
          type: 'mental',
          defaultDuration: 20,
          promptInstructions:
            'Relational shard. Use for improving social bonds or leadership skills.',
        },
        {
          title: 'Gratitude Transmission',
          description: 'Express thanks to someone in your network',
          type: 'mental',
          defaultDuration: 5,
          promptInstructions:
            'Social bond shard. Enhances both user mood and network health.',
        },

        // --- LIFE ---
        {
          title: 'Digital Detox Window',
          description: 'Zero screen usage for a defined period',
          type: 'mental',
          defaultDuration: 30,
          promptInstructions:
            'Cognitive recovery. Use to reduce screen fatigue or before sleep.',
        },
        {
          title: 'Environment Optimization',
          description: 'Declutter and organize a specific area of your space',
          type: 'exercise',
          defaultDuration: 15,
          promptInstructions:
            'Life shard. Use to reduce environmental stress and increase focus.',
        },
        {
          title: 'Budget & Finance Audit',
          description: 'Review expenditures and financial trajectory',
          type: 'focus',
          defaultDuration: 15,
          promptInstructions:
            'Discipline shard. Use for long-term security and financial health goals.',
        },
        {
          title: 'Sleep Sanctuary Prep',
          description: 'Optimize environment for maximum recovery',
          type: 'mental',
          defaultDuration: 5,
          promptInstructions:
            'Maintenance shard. Crucial for recovery, energy, and mental performance.',
        },
      ];

      const created = this.taskTemplateRepository.create(initialTemplates);
      await this.taskTemplateRepository.save(created);
      return this.taskTemplateRepository.find({ order: { createdAt: 'DESC' } });
    }

    return templates;
  }

  async createTaskTemplate(data: any) {
    const template = this.taskTemplateRepository.create(data);
    return this.taskTemplateRepository.save(template);
  }

  async deleteTaskTemplate(id: string) {
    return this.taskTemplateRepository.delete(id);
  }

}
