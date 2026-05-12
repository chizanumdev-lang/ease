const { Client } = require('pg');

async function listShards() {
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

        const res = await client.query('SELECT id, name, display_name, modality FROM task_shards');
        console.log('Available Shards:');
        res.rows.forEach(r => {
            console.log(`- ${r.name} (${r.display_name}) [${r.modality}]`);
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

listShards();
