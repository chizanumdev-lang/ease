const { Client } = require('pg');

async function run() {
    const client = new Client({
        host: 'aws-0-eu-west-1.pooler.supabase.com', port: 5432, user: 'postgres.zfekilefdlkkfhoyjtfy', password: 'Ineed20$now.', database: 'postgres', ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query('SELECT name, category, modality, display_name FROM task_shards');
        console.log('Task Shards:', res.rows.slice(0, 15));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
