
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

    const tables = ['users', 'check_ins'];
    
    for (const table of tables) {
      console.log(`\nChecking table: ${table}`);
      const res = await client.query(`
        SELECT table_schema, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
        ORDER BY table_schema, ordinal_position
      `);
      res.rows.forEach(row => {
        console.log(` [${row.table_schema}] ${row.column_name} (${row.data_type})`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
