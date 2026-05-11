
const { Client } = require('pg');
require('dotenv').config();

const connectionString = 'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20$now.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

async function testOrchestration() {
    const client = new Client({ connectionString });
    await client.connect();
    
    const dayPlanId = '9b67f1b7-98b7-4c07-ba71-6e01a88448d5'; // Day 1 of the user's program
    const goal = 'Master productivity ';
    
    console.log('Fetching shards...');
    const shardRes = await client.query('SELECT * FROM task_shards');
    const shards = shardRes.rows;
    console.log(`Found ${shards.length} shards.`);
    
    // Simulate AI selection (what we expect Groq to return)
    const selectedNames = ['watch-tutorial', 'spaced-recall-quiz', 'daily-journal', 'listen-to-podcast', 'read-article'];
    
    console.log('Filtering shards...');
    const selectedShards = shards.filter(s => selectedNames.includes(s.name));
    console.log(`Matched ${selectedShards.length} shards.`);
    
    if (selectedShards.length > 0) {
        console.log('Simulating task saving...');
        for (let i = 0; i < selectedShards.length; i++) {
            const shard = selectedShards[i];
            const title = `Test: ${shard.name}`;
            const description = `This is a test task for ${shard.name}`;
            
            // Note: In real code this uses TypeORM. Here we use SQL.
            const insertQuery = `
                INSERT INTO tasks (
                    id, day_plan_id, type, title, description, duration, "order", metadata, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now(), now()
                )
            `;
            
            await client.query(insertQuery, [
                dayPlanId,
                shard.name,
                title,
                description,
                10,
                i,
                JSON.stringify({ shardId: shard.id, modality: shard.modality, energy: shard.energy_level })
            ]);
            console.log(`Inserted task: ${title}`);
        }
    }
    
    await client.end();
}

testOrchestration().catch(console.error);
