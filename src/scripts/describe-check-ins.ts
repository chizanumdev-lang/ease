
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function describeCheckIns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'check_ins'");
  console.log('Columns in check_ins:');
  console.table(res.rows);
  await client.end();
}
describeCheckIns();
