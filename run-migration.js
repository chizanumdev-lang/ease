const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    // Using the literal IPv6 address resolved earlier
    const ipv6 = '2a05:d014:1c06:5f4d:4f58:29e2:2b79:67ec';
    
    console.log(`Connecting to Supabase via IPv6 literal: [${ipv6}]`);

    const client = new Client({
        host: ipv6,
        port: 5432,
        user: 'postgres',
        password: '4MrC1zEZZs2Yokbg',
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to Supabase via IPv6!');

        const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260428000000_initial_schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Applying migration...');
        await client.query(sql);
        console.log('Migration applied successfully!');

        await client.end();

    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runMigration();
