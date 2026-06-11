import { Client } from 'pg';

async function manageUsers() {
  const client = new Client({
    connectionString: "postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20%24now.@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
  });
  await client.connect();
  const res = await client.query('SELECT id, email, name, is_admin FROM "users"');
  console.log("Current users:");
  console.log(res.rows);
  await client.end();
}
manageUsers().catch(console.error);
