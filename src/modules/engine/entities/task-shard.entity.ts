import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('task_shards')
export class TaskShard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // kebab-case identifier (e.g. 'watch-tutorial')

  @Column({ name: 'display_name' })
  displayName: string;

  @Column()
  modality: string; // e.g. 'reading', 'physical', 'reflective'

  @Column('text')
  description: string;

  @Column({ name: 'typical_duration_minutes', default: 5 })
  typicalDurationMinutes: number;

  @Column({ name: 'energy_level', default: 'medium' })
  energyLevel: string; // 'low', 'medium', 'high'

  @Column({ name: 'difficulty_base', default: 3 })
  difficultyBase: number; // 1-10

  @Column({ default: 'journal' })
  category: string; // 'video', 'audio', 'quiz', 'journal', 'consistency'

  @Column({ type: 'int', default: 5 })
  intensity: number; // 1-10 based on complexity and energy

  @Column({ name: 'xp_reward', default: 20 })
  xpReward: number;

  @Column('jsonb', { name: 'skill_targets', default: [] })
  skillTargets: string[]; // ['focus', 'vocabulary', 'stamina' ]

  @Column('jsonb', { name: 'ai_prompt_template', default: {} })
  aiPromptTemplate: Record<string, any>; // Specific instructions for LLM when generating content for this shard

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @Column({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
