const { Client } = require('pg');

async function migrate(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to DB');

  try {
    console.log('1. Dropping reward_events table...');
    await client.query('DROP TABLE IF EXISTS reward_events;');

    console.log('2. Removing streak, level, xp from users...');
    await client.query('ALTER TABLE users DROP COLUMN IF EXISTS streak;');
    await client.query('ALTER TABLE users DROP COLUMN IF EXISTS level;');
    await client.query('ALTER TABLE users DROP COLUMN IF EXISTS xp;');

    console.log('3. Adding mastery_score, competence_level to programs...');
    await client.query('ALTER TABLE programs ADD COLUMN IF NOT EXISTS mastery_score float DEFAULT 0;');
    await client.query('ALTER TABLE programs ADD COLUMN IF NOT EXISTS competence_level varchar DEFAULT \'Novice\';');

    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

async function run() {
  require('dotenv').config({ path: '.env' });
  const localDb = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'; // Default local docker db used
  console.log('--- Migrating LOCAL ---');
  await migrate(localDb);

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')) {
    console.log('--- Migrating STAGING ---');
    await migrate(process.env.DATABASE_URL);
  } else {
    console.log('No staging DATABASE_URL found in .env, skipping staging migration');
  }
}

run();
