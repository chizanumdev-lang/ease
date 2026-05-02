const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  // Trying the project-ref based pooler hostname
  const host = 'dxbyuphndbrbhrwnybso.pooler.supabase.com';
  const client = new Client({
    host: host,
    port: 6543,
    user: 'postgres.dxbyuphndbrbhrwnybso',
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log(`Attempting pooler connection to ${host}:6543...`);
    await client.connect();
    console.log('✅ Successfully connected via Pooler!');
    const res = await client.query('SELECT NOW()');
    console.log('Time from DB:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('❌ Pooler connection failed:', err.message);
    if (err.code) console.error('Error code:', err.code);
    console.error('Full error details:', err);
  }
}

testConnection();
