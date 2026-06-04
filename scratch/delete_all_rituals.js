const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20%24now.@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  const res = await client.query("DELETE FROM ritual_tracks WHERE program_id = 'b580500b-6a6c-4ceb-9efa-8954afb30051'");
  console.log("Deleted rituals:", res.rowCount);
  await client.end();
}
run().catch(console.error);
