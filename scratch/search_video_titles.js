const { Client } = require('pg');

async function run() {
    const client = new Client({
        host: 'aws-0-eu-west-1.pooler.supabase.com', port: 5432, user: 'postgres.zfekilefdlkkfhoyjtfy', password: 'Ineed20$now.', database: 'postgres', ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT title, type, count(*) FROM tasks WHERE title ILIKE '%video%' GROUP BY title, type");
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
