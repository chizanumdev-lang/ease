const { Client } = require('pg');

async function checkAudioTask() {
    const client = new Client({
        host: 'aws-0-eu-west-1.pooler.supabase.com',
        port: 5432,
        user: 'postgres.zfekilefdlkkfhoyjtfy',
        password: 'Ineed20$now.',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT * FROM tasks WHERE id = 'e37331d9-0587-4683-beb6-1822d1fffeaa'");
        console.log('Audio Task Details:', JSON.stringify(res.rows[0], null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkAudioTask();
