const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20%24now.@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  const res = await client.query("DELETE FROM ritual_tracks WHERE url = '' OR url IS NULL RETURNING id");
  console.log("Deleted stuck rituals:", res.rows);
  await client.end();
}
run().catch(console.error);
