
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function listTables() {
  const connectionString = process.env.DATABASE_URL || '';
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables in public schema:", res.rows.map(r => r.table_name));
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

listTables();
