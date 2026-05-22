import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function listTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
  );
  console.log(res.rows.map((r) => r.table_name));
  await client.end();
}
listTables();
