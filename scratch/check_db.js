const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:postgres@localhost:54322/postgres"
});

async function check() {
  await client.connect();
  const tables = ['users', 'check_ins', 'reward_events', 'progress', 'programs', 'day_plans', 'tasks'];
  console.log('Checking tables...');
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT count(*) FROM "${table}"`);
      console.log(`${table}: EXISTS (count: ${res.rows[0].count})`);
    } catch (e) {
      console.log(`${table}: MISSING (${e.message})`);
    }
  }
  await client.end();
}

check();
