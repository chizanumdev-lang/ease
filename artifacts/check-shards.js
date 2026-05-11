
const { Client } = require('pg');
require('dotenv').config();

const connectionString = 'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20$now.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

async function checkShards() {
    const client = new Client({ connectionString });
    await client.connect();
    
    const shardRes = await client.query('SELECT count(*) FROM task_shards');
    console.log('Total shards in DB:', shardRes.rows[0].count);
    
    if (shardRes.rows[0].count > 0) {
        const sampleShards = await client.query('SELECT name, modality, energy_level FROM task_shards LIMIT 5');
        console.log('Sample Shards:', sampleShards.rows);
    }
    
    await client.end();
}

checkShards().catch(console.error);
