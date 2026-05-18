const { Client } = require('pg');

async function checkErrorLogs() {
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

        const res = await client.query(`
            SELECT id, message, stack, path, method, created_at
            FROM error_logs
            ORDER BY created_at DESC
            LIMIT 10;
        `);

        console.log('\n--- RECENT ERROR LOGS ON STAGING ---');
        if (res.rows.length === 0) {
            console.log('No error logs found in database.');
        } else {
            res.rows.forEach(log => {
                console.log(`[${log.created_at}] Path: ${log.method} ${log.path}`);
                console.log(`Message: ${log.message}`);
                console.log(`Stack: ${log.stack ? log.stack.substring(0, 300) + '...' : 'None'}`);
                console.log('--------------------------------------------------');
            });
        }
    } catch (err) {
        console.error('❌ Error checking error logs:', err);
    } finally {
        await client.end();
    }
}

checkErrorLogs();
