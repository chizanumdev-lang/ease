const { Client } = require('pg');

async function checkAllShards() {
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

        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name LIKE '%shard%'
        `);
        console.log('Tables matching "shard":', tables.rows.map(r => r.table_name));

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

checkAllShards();
