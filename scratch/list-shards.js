const { Client } = require('pg');

async function listShards() {
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

        const shardsRes = await client.query(`
            SELECT id, name, category, modality, display_name
            FROM task_shards
            ORDER BY category ASC, name ASC;
        `);

        console.log('\n--- ALL SHARDS IN DATABASE ---');
        shardsRes.rows.forEach((s, i) => {
            console.log(`${i+1}. ID: ${s.id} | Name: "${s.name}" | Category: ${s.category} | Modality: ${s.modality} | DisplayName: "${s.display_name}"`);
        });
    } catch (err) {
        console.error('❌ Error listing shards:', err);
    } finally {
        await client.end();
    }
}

listShards();
