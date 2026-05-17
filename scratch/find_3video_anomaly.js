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
        
        console.log('Searching for any day plan with 3 or more video tasks...');
        
        const res = await client.query(`
            SELECT dp.id as day_plan_id, dp.program_id, dp.day_number, count(t.id) as video_count, array_agg(t.title) as titles
            FROM tasks t
            JOIN day_plans dp ON t.day_plan_id = dp.id
            WHERE t.type = 'video'
            GROUP BY dp.id, dp.program_id, dp.day_number
            HAVING count(t.id) >= 3
            ORDER BY video_count DESC
        `);

        console.log('Found day plans with 3+ video tasks:', JSON.stringify(res.rows, null, 2));

        if (res.rows.length > 0) {
            const firstAnomaly = res.rows[0];
            console.log(`Checking details for DayPlan ${firstAnomaly.day_plan_id}...`);
            const allTasks = await client.query('SELECT type, title, metadata FROM tasks WHERE day_plan_id = $1', [firstAnomaly.day_plan_id]);
            console.log('All tasks for this day:', JSON.stringify(allTasks.rows, null, 2));
            
            // Find user email for this program
            const userRes = await client.query(`
                SELECT u.email 
                FROM users u 
                JOIN programs p ON p.user_id = u.id 
                WHERE p.id = $1
            `, [firstAnomaly.program_id]);
            console.log('User email for this anomaly:', userRes.rows[0]?.email);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

findAnomaly();
