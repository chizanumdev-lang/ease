const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    });

    try {
        await client.connect();
        console.log('Connected to local database.');
        
        const email = 'idemili730@gmail.com';
        const userRes = await client.query('SELECT * FROM users WHERE email ILIKE $1', [`%${email}%`]);
        console.log('User search result (Local):', userRes.rows);

        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            const programRes = await client.query('SELECT id, status, created_at FROM programs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
            console.log('Latest Program (Local):', programRes.rows[0]);

            if (programRes.rows[0]) {
                const tasksRes = await client.query(`
                    SELECT t.id, t.type, t.title, dp.day_number
                    FROM tasks t 
                    JOIN day_plans dp ON t.day_plan_id = dp.id 
                    WHERE dp.program_id = $1
                    ORDER BY dp.day_number, t.created_at
                `, [programRes.rows[0].id]);
                console.log(`Total Tasks (Local): ${tasksRes.rows.length}`);
                console.log('Tasks:', tasksRes.rows);
            }
        } else {
            const allUsers = await client.query('SELECT email FROM users');
            console.log('All Users (Local):', allUsers.rows);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}
run();
