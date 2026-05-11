const { Client } = require('pg');
require('dotenv').config();

async function fixTasksSchema() {
    // Connection string to Postgres
    const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
    
    const client = new Client({
        connectionString,
        ssl: connectionString.includes('supabase') || connectionString.includes('vercel') ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('Connected to database');

        console.log('Adding metadata column to tasks table...');
        await client.query(`
            ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
        `);
        
        console.log('Adding metadata column to programs table (if missing)...');
        await client.query(`
            ALTER TABLE programs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
        `);

        console.log('Schema fix completed successfully!');
    } catch (err) {
        console.error('Error fixing schema:', err);
    } finally {
        await client.end();
    }
}

fixTasksSchema();
