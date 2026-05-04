const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const host = process.env.DATABASE_HOST;
  const port = parseInt(process.env.DATABASE_PORT || '6543');
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;

  const client = new Client({
    host: host,
    port: port,
    user: user,
    password: password,
    database: database,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log(`Attempting connection to ${host}:${port} as ${user}...`);
    await client.connect();
    console.log('✅ Successfully connected to the new Supabase Pooler!');
    const res = await client.query('SELECT NOW(), current_database(), current_user');
    console.log('DB Info:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    if (err.code) console.error('Error code:', err.code);
    console.error('Full error details:', err);
  }
}

testConnection();
