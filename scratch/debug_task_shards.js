const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    });

    try {
        await client.connect();
        const dayPlanId = '0a9efb46-4912-4a09-bf42-2400bad44dfd'; // Wait, I need the day plan id.
        // Actually I'll just get all tasks for the latest program.
        const programId = 'ad658db0-7468-41f5-9127-8d8e51d1dc0f';
        
        const tasksRes = await client.query(`
            SELECT t.id, t.type, t.title, t.metadata, s.name as shard_name, s.modality
            FROM tasks t 
            LEFT JOIN task_shards s ON (t.metadata->>'shardId')::uuid = s.id
            JOIN day_plans dp ON t.day_plan_id = dp.id 
            WHERE dp.program_id = $1
            ORDER BY t.created_at
        `, [programId]);

        console.log('Tasks with Shard Info:', JSON.stringify(tasksRes.rows, null, 2));

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}
run();
