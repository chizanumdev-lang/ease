const { Client } = require('pg');

async function checkRitualsOnly() {
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
        
        console.log('--- LATEST RITUAL TRACKS ---');
        const rituals = await client.query('SELECT id, user_id, ritual_type, date, title, url, duration, metadata FROM ritual_tracks ORDER BY created_at DESC LIMIT 5');
        for (const row of rituals.rows) {
            console.log(`ID: ${row.id}`);
            console.log(`Type: ${row.ritual_type}`);
            console.log(`Date: ${row.date}`);
            console.log(`Title: ${row.title}`);
            console.log(`URL: ${row.url}`);
            console.log(`Duration: ${row.duration}`);
            console.log(`Metadata Status: ${row.metadata?.status}`);
            console.log(`Metadata Source: ${row.metadata?.source}`);
            console.log('---');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

checkRitualsOnly();
