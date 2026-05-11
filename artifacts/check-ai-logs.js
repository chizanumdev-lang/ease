
const { Client } = require('pg');
require('dotenv').config();

const connectionString = 'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20$now.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

async function checkAiLogs() {
    const client = new Client({ connectionString });
    await client.connect();
    
    console.log('Checking recent AI logs...');
    const logRes = await client.query('SELECT * FROM ai_generation_logs ORDER BY created_at DESC LIMIT 5');
    
    if (logRes.rows.length === 0) {
        console.log('No AI logs found.');
    } else {
        logRes.rows.forEach(log => {
            console.log(`- [${log.status}] Model: ${log.model} Type: ${log.type}`);
            if (log.status === 'failure') {
                console.log(`  Error: ${log.error_message}`);
            }
            // console.log(`  Prompt Snippet: ${log.prompt?.substring(0, 100)}...`);
        });
    }
    
    await client.end();
}

checkAiLogs().catch(console.error);
