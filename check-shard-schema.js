const { Client } = require('pg');

async function checkShardSchema() {
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

        const schemas = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'task_shards'
        `);
        console.log('Task shards schemas:', schemas.rows);

        const columns = await client.query(`
            SELECT table_schema, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'task_shards'
            ORDER BY table_schema, column_name
        `);
        console.log('Columns in task_shards:');
        columns.rows.forEach(c => {
            console.log(`[${c.table_schema}] ${c.column_name}: ${c.data_type}`);
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

checkShardSchema();
