const { Client } = require('pg');

async function checkStagingLogs() {
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

        // Fetch recent logs
        const res = await client.query(`
            SELECT id, type, model, status, error_message, created_at, SUBSTRING(prompt FROM 1 FOR 150) as prompt_summary
            FROM ai_generation_logs
            ORDER BY created_at DESC
            LIMIT 15;
        `);

        console.log('\n--- RECENT AI GENERATION LOGS ON STAGING ---');
        if (res.rows.length === 0) {
            console.log('No AI generation logs found.');
        } else {
            res.rows.forEach(log => {
                console.log(`[${log.created_at.toISOString()}] ID: ${log.id}`);
                console.log(`Type: ${log.type} | Model: ${log.model} | Status: ${log.status}`);
                console.log(`Prompt Start: "${log.prompt_summary}..."`);
                if (log.status === 'failure') {
                    console.log(`❌ Error: ${log.error_message}`);
                } else {
                    console.log(`✅ Success`);
                }
                console.log('--------------------------------------------------');
            });
        }
    } catch (err) {
        console.error('❌ Error checking staging logs:', err);
    } finally {
        await client.end();
    }
}

checkStagingLogs();
