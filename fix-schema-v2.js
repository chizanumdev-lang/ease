const { Client } = require('pg');
require('dotenv').config();

async function fixSchema() {
    // Connection string to local Supabase Postgres
    const client = new Client({
        connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        ssl: false
    });

    try {
        await client.connect();
        console.log('Connected to database');

        console.log('Fixing ai_generation_logs table...');
        await client.query(`
            ALTER TABLE ai_generation_logs ADD COLUMN IF NOT EXISTS type TEXT;
            ALTER TABLE ai_generation_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success';
            ALTER TABLE ai_generation_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
        `);
        
        // Handle renames safely
        await client.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_generation_logs' AND column_name='latency_ms') THEN
                    ALTER TABLE ai_generation_logs RENAME COLUMN latency_ms TO latency;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_generation_logs' AND column_name='tokens_used') THEN
                    ALTER TABLE ai_generation_logs RENAME COLUMN tokens_used TO token_count;
                END IF;
            END $$;
        `);

        console.log('Fixing progress table...');
        await client.query(`
            ALTER TABLE progress ADD COLUMN IF NOT EXISTS checkin_date DATE;
            ALTER TABLE progress ADD COLUMN IF NOT EXISTS mood TEXT;
            ALTER TABLE progress ADD COLUMN IF NOT EXISTS notes TEXT;
            ALTER TABLE progress ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}';
        `);

        console.log('Schema fix completed successfully!');
    } catch (err) {
        console.error('Error fixing schema:', err);
    } finally {
        await client.end();
    }
}

fixSchema();
