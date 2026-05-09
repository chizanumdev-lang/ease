-- Auto-generated task shard seed data
-- Run: psql $DATABASE_URL < research/output/seed-task-shards.sql

CREATE TABLE IF NOT EXISTS task_shards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  modality VARCHAR(50) NOT NULL,
  description TEXT,
  typical_duration_minutes INT DEFAULT 5,
  energy_level VARCHAR(20) DEFAULT 'medium',
  ai_generated BOOLEAN DEFAULT true,
  difficulty_base INT DEFAULT 3,
  xp_reward INT DEFAULT 20,
  skill_targets JSONB DEFAULT '[]',
  ai_prompt_template JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO task_shards (name, display_name, modality, description, typical_duration_minutes, energy_level, ai_generated, xp_reward) VALUES


SELECT COUNT(*) AS seeded_shards FROM task_shards;
