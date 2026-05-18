const { Client } = require('pg');

async function fixStagingRewardEventsSchema() {
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

        console.log('Dropping NOT NULL constraint from type column in reward_events...');
        await client.query(`
            ALTER TABLE reward_events 
            ALTER COLUMN type DROP NOT NULL;
        `);

        console.log('🎉 Staging database reward_events table schema successfully updated!');
    } catch (err) {
        console.error('❌ Error updating staging schema:', err);
    } finally {
        await client.end();
    }
}

fixStagingRewardEventsSchema();
