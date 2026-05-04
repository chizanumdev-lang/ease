const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    host: 'db.dxbyuphndbrbhrwnybso.supabase.co',
    port: 5432,
    user: 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting direct connection to db.dxbyuphndbrbhrwnybso.supabase.co:5432...');
    await client.connect();
    console.log('✅ Successfully connected directly!');
    const res = await client.query('SELECT NOW()');
    console.log('Time from DB:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('❌ Direct connection failed:', err.message);
    if (err.code) console.error('Error code:', err.code);
  }
}

testConnection();
