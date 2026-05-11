const { Client } = require('pg');

async function checkUserTasks() {
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
        const userId = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
        
        const program = await client.query('SELECT id, status, created_at FROM programs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
        console.log('Latest Program:', program.rows[0]);

        if (program.rows[0]) {
            const programId = program.rows[0].id;
            const days = await client.query('SELECT id, day_number, status FROM day_plans WHERE program_id = $1 ORDER BY day_number ASC', [programId]);
            console.log('Day Plans:', days.rows.slice(0, 5));

            const tasks = await client.query(`
                SELECT t.id, t.type, t.title, t.day_plan_id 
                FROM tasks t 
                JOIN day_plans dp ON t.day_plan_id = dp.id 
                WHERE dp.program_id = $1
            `, [programId]);
            console.log('Tasks for Program:', tasks.rows.length);
            console.log('Task Details:', tasks.rows);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

checkUserTasks();
