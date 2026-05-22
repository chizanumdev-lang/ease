import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkTasks() {
  const connectionString = process.env.DATABASE_URL || '';
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    await client.connect();
    const res = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'videos' AND table_schema = 'public'",
    );
    console.log(
      'Columns in videos:',
      res.rows.map((r) => r.column_name),
    );
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkTasks();
