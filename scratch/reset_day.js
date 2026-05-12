const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
});
async function run() {
  try {
    await client.connect();
    const programId = 'da640d2b-6550-46c6-90cb-44683372412f';
    
    // 1. Get Day 1 ID
    const res = await client.query("SELECT id FROM day_plans WHERE program_id = $1 AND day_number = 1;", [programId]);
    if (res.rows.length === 0) {
      console.log("Day 1 not found");
      return;
    }
    const dayId = res.rows[0].id;
    console.log(`Found Day 1 ID: ${dayId}`);

    // 2. Clear old tasks (if any failed/partial ones exist)
    await client.query("DELETE FROM tasks WHERE day_plan_id = $1;", [dayId]);
    console.log("Cleared old tasks");

    // 3. Mark day as 'pending' so it can be re-hydrated if needed, 
    // but actually I will trigger the service call in the next step.
    await client.query("UPDATE day_plans SET status = 'pending' WHERE id = $1;", [dayId]);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
