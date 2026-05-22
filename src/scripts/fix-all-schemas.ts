import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixAllSchemas() {
  const connectionString = process.env.DATABASE_URL || '';
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Fix check_ins table
    console.log('Checking check_ins table...');
    const checkInCols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'check_ins'",
    );
    const checkInColNames = checkInCols.rows.map((r) => r.column_name);

    if (!checkInColNames.includes('date')) {
      console.log('Adding date column to check_ins...');
      await client.query(
        'ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE',
      );
    }

    // --- TABLE: check_ins ---
    console.log('Checking check_ins...');
    await client.query(
      `ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS date DATE;`,
    );
    await client.query(
      `ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS user_id UUID;`,
    );
    await client.query(
      `ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: ritual_tracks ---
    console.log('Checking ritual_tracks...');
    // TypeORM defaults to ritualType -> "ritualType" (quoted) or ritual_type depending on strategy
    // In these entities, ritualType is @Column(), so it usually maps to ritual_type or quoted "ritualType"
    await client.query(
      `ALTER TABLE ritual_tracks ADD COLUMN IF NOT EXISTS "ritualType" TEXT;`,
    );
    await client.query(
      `ALTER TABLE ritual_tracks ADD COLUMN IF NOT EXISTS ritual_type TEXT;`,
    );
    await client.query(
      `ALTER TABLE ritual_tracks ADD COLUMN IF NOT EXISTS date TEXT;`,
    );
    await client.query(
      `ALTER TABLE ritual_tracks ADD COLUMN IF NOT EXISTS user_id UUID;`,
    );
    await client.query(
      `ALTER TABLE ritual_tracks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE ritual_tracks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: goals ---
    console.log('Checking goals...');
    await client.query(
      `ALTER TABLE goals ADD COLUMN IF NOT EXISTS category TEXT;`,
    );
    await client.query(
      `ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date DATE;`,
    );
    await client.query(
      `ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID;`,
    );
    await client.query(
      `ALTER TABLE goals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: quiz_attempts ---
    console.log('Checking quiz_attempts...');
    await client.query(
      `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;`,
    );
    await client.query(
      `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT false;`,
    );
    await client.query(
      `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS user_id UUID;`,
    );
    await client.query(
      `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS quiz_id UUID;`,
    );
    await client.query(
      `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: tasks ---
    console.log('Checking tasks...');
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS xp_reward INT DEFAULT 10;`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS video_url TEXT;`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS quiz_id UUID;`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS watched_seconds INT DEFAULT 0;`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_duration INT DEFAULT 0;`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS day_plan_id UUID;`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: day_plans ---
    console.log('Checking day_plans...');
    await client.query(
      `ALTER TABLE day_plans ADD COLUMN IF NOT EXISTS program_id UUID;`,
    );
    await client.query(
      `ALTER TABLE day_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE day_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: programs ---
    console.log('Checking programs...');
    await client.query(
      `ALTER TABLE programs ADD COLUMN IF NOT EXISTS goal_id UUID;`,
    );
    await client.query(
      `ALTER TABLE programs ADD COLUMN IF NOT EXISTS user_id UUID;`,
    );
    await client.query(
      `ALTER TABLE programs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: reward_events ---
    console.log('Checking reward_events...');
    await client.query(
      `ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS event_type TEXT;`,
    );
    await client.query(
      `ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;`,
    );
    await client.query(
      `ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS description TEXT;`,
    );
    await client.query(
      `ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`,
    );
    await client.query(
      `ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS user_id UUID;`,
    );
    await client.query(
      `ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE reward_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    const typeColCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='reward_events' AND column_name='type';
    `);
    if (typeColCheck.rows.length > 0) {
      await client.query(
        `ALTER TABLE reward_events ALTER COLUMN type DROP NOT NULL;`,
      );
    }

    // --- TABLE: adaptation_logs ---
    console.log('Checking adaptation_logs...');
    await client.query(
      `ALTER TABLE adaptation_logs ADD COLUMN IF NOT EXISTS program_id UUID;`,
    );
    await client.query(
      `ALTER TABLE adaptation_logs ADD COLUMN IF NOT EXISTS rule_triggered TEXT;`,
    );
    await client.query(
      `ALTER TABLE adaptation_logs ADD COLUMN IF NOT EXISTS action_taken TEXT;`,
    );
    await client.query(
      `ALTER TABLE adaptation_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: progress ---
    console.log('Checking progress...');
    await client.query(
      `ALTER TABLE progress ADD COLUMN IF NOT EXISTS checkin_date DATE DEFAULT CURRENT_DATE;`,
    );
    await client.query(
      `ALTER TABLE progress ADD COLUMN IF NOT EXISTS mood TEXT;`,
    );
    await client.query(
      `ALTER TABLE progress ADD COLUMN IF NOT EXISTS notes TEXT;`,
    );
    await client.query(
      `ALTER TABLE progress ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}';`,
    );
    await client.query(
      `ALTER TABLE progress ADD COLUMN IF NOT EXISTS user_id UUID;`,
    );
    await client.query(
      `ALTER TABLE progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: users ---
    console.log('Checking users...');
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token VARCHAR;`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR;`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0;`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: audio_tracks ---
    console.log('Checking audio_tracks...');
    await client.query(
      `ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS day_plan_id UUID;`,
    );
    await client.query(
      `ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();`,
    );
    await client.query(
      `ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();`,
    );

    // --- TABLE: task_shards ---
    console.log('Checking task_shards...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_shards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        modality TEXT,
        description TEXT,
        typical_duration_minutes INT DEFAULT 5,
        energy_level TEXT DEFAULT 'medium',
        difficulty_base INT DEFAULT 3,
        xp_reward INT DEFAULT 20,
        skill_targets JSONB DEFAULT '[]',
        ai_prompt_template JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);

    // 4. Ensure admin exists and is verified
    console.log('Ensuring admin status for ichizanum@gmail.com...');
    await client.query(
      "UPDATE users SET is_admin = true, is_verified = true WHERE email = 'ichizanum@gmail.com'",
    );

    console.log('All schema fixes completed successfully');
  } catch (err) {
    console.error('Error fixing schemas:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixAllSchemas();
