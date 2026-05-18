const { Client } = require('pg');

async function syncStagingSchema() {
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
        console.log('✅ Connected to staging database');

        console.log('Adding category column to task_shards...');
        await client.query(`
            ALTER TABLE task_shards 
            ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'journal';
        `);

        console.log('Adding intensity column to task_shards...');
        await client.query(`
            ALTER TABLE task_shards 
            ADD COLUMN IF NOT EXISTS intensity INTEGER DEFAULT 5;
        `);

        console.log('Adding updated_at column to task_shards...');
        await client.query(`
            ALTER TABLE task_shards 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        `);

        console.log('🎉 Staging database task_shards table schema successfully synchronized!');
    } catch (err) {
        console.error('❌ Error synchronizing staging schema:', err);
    } finally {
        await client.end();
    }
}

syncStagingSchema();
