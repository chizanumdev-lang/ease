const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
});
async function run() {
  try {
    await client.connect();
    const res = await client.query("SELECT id, status, title FROM programs WHERE user_id = '073da4c7-4820-4169-b19b-0416bc5ec658' ORDER BY created_at DESC LIMIT 5;");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
