const { Client } = require('pg');

async function testTaskShardQuery() {
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

        console.log('Testing SELECT * FROM task_shards...');
        const res1 = await client.query('SELECT * FROM task_shards LIMIT 1');
        console.log('Result 1 columns:', Object.keys(res1.rows[0] || {}));

        console.log('Testing SELECT "createdAt" FROM task_shards...');
        try {
            await client.query('SELECT "createdAt" FROM task_shards LIMIT 1');
            console.log('✅ Success with "createdAt"');
        } catch (e) {
            console.log('❌ Failed with "createdAt":', e.message);
        }

        console.log('Testing SELECT "created_at" FROM task_shards...');
        try {
            await client.query('SELECT "created_at" FROM task_shards LIMIT 1');
            console.log('✅ Success with "created_at"');
        } catch (e) {
            console.log('❌ Failed with "created_at":', e.message);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

testTaskShardQuery();
