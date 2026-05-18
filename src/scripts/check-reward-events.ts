import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkRewardEvents() {
  const connectionString = process.env.DATABASE_URL || '';
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const res = await client.query(`
      SELECT table_schema, table_name, column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'reward_events'
      ORDER BY table_schema, column_name
    `);
    
    console.log('Columns:');
    console.log(JSON.stringify(res.rows, null, 2));

    // Also check constraints
    const constraints = await client.query(`
      SELECT 
        tc.table_schema, 
        tc.table_name, 
        kcu.column_name, 
        cc.check_clause
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        LEFT JOIN information_schema.check_constraints AS cc
          ON cc.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'reward_events'
    `);
    console.log('\nConstraints:');
    console.log(JSON.stringify(constraints.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkRewardEvents();
