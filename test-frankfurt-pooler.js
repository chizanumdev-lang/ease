const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const host = 'aws-0-eu-central-1.pooler.supabase.com';
  const port = 6543; // Transaction mode
  const client = new Client({
    host: host,
    port: port,
    user: 'postgres.dxbyuphndbrbhrwnybso',
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log(`Attempting Transaction mode connection to ${host}:${port}...`);
    await client.connect();
    console.log('✅ Successfully connected via Frankfurt Pooler!');
    const res = await client.query('SELECT NOW()');
    console.log('Time from DB:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('❌ Frankfurt Pooler connection failed:', err.message);
    if (err.code) console.error('Error code:', err.code);
    console.error('Full error details:', err);
  }
}

testConnection();
