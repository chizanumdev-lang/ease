const { Client } = require('pg');
require('dotenv').config();

async function fixSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1') || process.env.DATABASE_URL.includes('54322') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database. Applying schema fixes...');

    // 1. Fix Users Table (Add streak, level, xp)
    console.log('Updating users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
    `);

    // 2. Fix Check-ins Table (Add date)
    console.log('Updating check_ins table...');
    await client.query(`
      ALTER TABLE check_ins 
      ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
    `);
    // Backfill existing check-ins with their created_at date
    await client.query(`
      UPDATE check_ins SET date = created_at::date WHERE date IS NULL;
    `);

    // 3. Fix Reward Events Table
    console.log('Updating reward_events table...');
    await client.query(`
      ALTER TABLE reward_events 
      ADD COLUMN IF NOT EXISTS event_type TEXT,
      ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    const typeColCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='reward_events' AND column_name='type';
    `);
    if (typeColCheck.rows.length > 0) {
      await client.query(`
        ALTER TABLE reward_events ALTER COLUMN type DROP NOT NULL;
      `);

      // Migrate old data if any (from type/amount to event_type/points)
      await client.query(`
        UPDATE reward_events 
        SET event_type = type, points = amount 
        WHERE event_type IS NULL AND type IS NOT NULL;
      `);
    }

    console.log('Schema fixes applied successfully!');
    await client.end();
  } catch (err) {
    console.error('Error applying schema fixes:', err.message);
    process.exit(1);
  }
}

fixSchema();
