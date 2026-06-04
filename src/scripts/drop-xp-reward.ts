import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function dropXpReward() {
  const connectionString = process.env.DATABASE_URL || '';
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') || connectionString.includes('pooler')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if the column exists first
    const check = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'xp_reward';
    `);

    if (check.rows.length === 0) {
      console.log('✅ xp_reward column does not exist on tasks table — nothing to do.');
      return;
    }

    await client.query(`ALTER TABLE tasks DROP COLUMN IF EXISTS xp_reward;`);
    console.log('✅ Dropped xp_reward column from tasks table.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

dropXpReward();
