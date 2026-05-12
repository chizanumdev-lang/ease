const { Client } = require('pg');

async function searchTypos() {
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
        console.log('✅ Connected to database');

        const res = await client.query("SELECT id, name, display_name FROM task_shards WHERE name ILIKE '%tutoril%' OR display_name ILIKE '%tutoril%'");
        console.log('Typo matches:', res.rows);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

searchTypos();
