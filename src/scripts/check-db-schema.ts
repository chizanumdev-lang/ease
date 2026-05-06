
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkSchema() {
  const connectionString = process.env.DATABASE_URL || '';
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const tables = [
      'users', 'check_ins', 'reward_events', 'progress', 'programs', 'day_plans', 'tasks',
      'error_logs', 'ai_generation_logs', 'api_cost_logs', 'program_ratings', 'referrals'
    ];
    
    for (const table of tables) {
      console.log(`\nChecking table: ${table}`);
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
      if (res.rows.length === 0) {
        console.log(`Table ${table} does NOT exist!`);
      } else {
        res.rows.forEach(row => {
          console.log(` - ${row.column_name} (${row.data_type})`);
        });
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
