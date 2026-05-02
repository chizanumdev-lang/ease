
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function test() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Testing connection to:', connectionString?.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('Successfully connected!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

test();
