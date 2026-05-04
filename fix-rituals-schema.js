const { Client } = require('pg');
require('dotenv').config();

async function fixRitualsSchema() {
    const client = new Client({
        connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        ssl: false
    });

    try {
        await client.connect();
        console.log('Connected to database');

        console.log('Fixing ritual_tracks table...');
        await client.query(`
            -- First, drop the table and recreate it because it has significant changes and no data yet
            -- This is safer than multiple ALTER TABLEs if we want to ensure constraints like user_id references
            DROP TABLE IF EXISTS ritual_tracks CASCADE;
            
            CREATE TABLE ritual_tracks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                duration INTEGER,
                "ritualType" TEXT NOT NULL, -- Match TypeORM camelCase expectations
                date TEXT NOT NULL,
                metadata JSONB DEFAULT '{}',
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        console.log('Schema fix for rituals completed successfully!');
    } catch (err) {
        console.error('Error fixing schema:', err);
    } finally {
        await client.end();
    }
}

fixRitualsSchema();
