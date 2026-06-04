const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20%24now.@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  const res = await client.query("SELECT id, title, url FROM ritual_tracks");
  console.log("Rituals in DB:", res.rows);
  await client.end();
}
run().catch(console.error);
