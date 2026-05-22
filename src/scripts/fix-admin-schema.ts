import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixSchema() {
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

    // 1. Fix ai_generation_logs
    console.log('Fixing ai_generation_logs...');
    await client.query('DROP TABLE IF EXISTS ai_generation_logs CASCADE');
    await client.query(`
      CREATE TABLE ai_generation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        model TEXT NOT NULL,
        prompt TEXT,
        response TEXT,
        status TEXT NOT NULL,
        error_message TEXT,
        latency INTEGER,
        token_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 2. Fix api_cost_logs
    console.log('Fixing api_cost_logs...');
    await client.query('DROP TABLE IF EXISTS api_cost_logs CASCADE');
    await client.query(`
      CREATE TABLE api_cost_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service TEXT NOT NULL,
        cost DECIMAL(10, 4) NOT NULL,
        currency TEXT DEFAULT 'USD',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 3. Fix program_ratings
    console.log('Fixing program_ratings...');
    // Check if column feedback exists before renaming
    const colRes = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'program_ratings' AND column_name = 'feedback'",
    );
    if (colRes.rows.length > 0) {
      await client.query(
        'ALTER TABLE program_ratings RENAME COLUMN feedback TO comment',
      );
    }

    // 4. Create task_templates
    console.log('Creating task_templates...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        default_duration INTEGER DEFAULT 15,
        default_xp INTEGER DEFAULT 10,
        prompt_instructions TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 5. Fix videos
    console.log('Fixing videos...');
    await client.query('DROP TABLE IF EXISTS videos CASCADE');
    await client.query(`
      CREATE TABLE videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT NOT NULL,
        thumbnail_url TEXT,
        approved BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('Schema fix completed successfully');
    await client.end();
  } catch (err) {
    console.error('Error fixing schema:', err);
    process.exit(1);
  }
}

fixSchema();
