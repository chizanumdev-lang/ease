const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
});
async function run() {
  try {
    await client.connect();
    const programId = 'da640d2b-6550-46c6-90cb-44683372412f';
    const res = await client.query("UPDATE programs SET status = 'ready' WHERE id = $1;", [programId]);
    console.log(`Updated program ${programId}, affected rows: ${res.rowCount}`);
    
    const res2 = await client.query("UPDATE day_plans SET status = 'ready' WHERE program_id = $1 AND day_number = 1;", [programId]);
    console.log(`Updated Day 1 for program ${programId}, affected rows: ${res2.rowCount}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
