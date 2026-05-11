const { Client } = require('pg');

async function fixTasksSchema() {
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

        console.log('Adding metadata column to tasks table...');
        await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`);
        
        console.log('Adding metadata column to programs table...');
        await client.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`);

        console.log('🚀 Schema fix completed successfully!');
    } catch (err) {
        console.error('❌ Error fixing schema:', err);
    } finally {
        await client.end();
    }
}

fixTasksSchema();
