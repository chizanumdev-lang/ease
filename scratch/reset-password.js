const bcrypt = require('bcrypt');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_mDQnO8F3lsWB@ep-small-sound-aizyaehd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function reset() {
  try {
    const hash = await bcrypt.hash('password', 10);
    await client.connect();
    const sql = 'UPDATE users SET password = $1 WHERE email = $2';
    const res = await client.query(sql, [hash, 'admin@ease.app']);
    console.log('Update successful:', res.rowCount, 'row(s) affected');
  } catch (err) {
    console.error('Error during reset:', err);
  } finally {
    await client.end();
  }
}

reset();
