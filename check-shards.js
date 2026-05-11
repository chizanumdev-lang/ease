const { Client } = require('pg');

async function checkShards() {
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

        const shards = await client.query('SELECT count(*) FROM task_shards');
        console.log('Task Shards Count:', shards.rows[0].count);

        const tasks = await client.query('SELECT count(*) FROM tasks');
        console.log('Total Tasks Count:', tasks.rows[0].count);

        if (shards.rows[0].count === '0') {
            console.log('⚠️  NO SHARDS FOUND! This is why tasks are not being generated.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

checkShards();
