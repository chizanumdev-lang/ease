const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_mDQnO8F3lsWB@ep-small-sound-aizyaehd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
    connectionString: connectionString,
});

async function testConnection() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Current time from DB:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err.stack);
    }
}

testConnection();
