import { Client } from 'pg';

async function deleteUsers() {
  const client = new Client({
    connectionString: "postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20%24now.@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
  });
  await client.connect();
  const res = await client.query(`DELETE FROM "users" WHERE email != 'ichizanum@gmail.com'`);
  console.log(`Deleted ${res.rowCount} users`);
  await client.end();
}
deleteUsers().catch(console.error);
