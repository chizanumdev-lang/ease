const { Client } = require('pg');

async function findAnomaly() {
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
        
        console.log('Searching for users with multiple video tasks in a single day...');
        
        const res = await client.query(`
            SELECT u.email, dp.day_number, count(t.id) as video_count, array_agg(t.title) as titles
            FROM tasks t
            JOIN day_plans dp ON t.day_plan_id = dp.id
            JOIN programs p ON dp.program_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE t.type = 'video'
            GROUP BY u.email, dp.day_number
            HAVING count(t.id) > 1
            ORDER BY video_count DESC
        `);

        console.log('Found anomalies:', JSON.stringify(res.rows, null, 2));

        // Also check if the user exists but with a slightly different email or in another table
        const allUsers = await client.query('SELECT id, email FROM users');
        console.log('All Users:', allUsers.rows);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

findAnomaly();
