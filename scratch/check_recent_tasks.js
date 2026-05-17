const { Client } = require('pg');

async function run() {
    const client = new Client({
        host: 'aws-0-eu-west-1.pooler.supabase.com', port: 5432, user: 'postgres.zfekilefdlkkfhoyjtfy', password: 'Ineed20$now.', database: 'postgres', ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT * FROM tasks WHERE created_at > NOW() - INTERVAL '24 hours'");
        console.log(`Found ${res.rows.length} tasks in last 24 hours.`);
        if (res.rows.length > 0) {
            console.log('Sample tasks:', res.rows.slice(0, 5));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
