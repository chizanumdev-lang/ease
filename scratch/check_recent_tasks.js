const { Client } = require('pg');

async function run() {
    const client = new Client({
        host: 'aws-0-eu-west-1.pooler.supabase.com', port: 5432, user: 'postgres.zfekilefdlkkfhoyjtfy', password: 'Ineed20$now.', database: 'postgres', ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const userRes = await client.query("SELECT id FROM users WHERE email = 'ichizanum@gmail.com'");
        if (userRes.rows.length === 0) {
            console.log('User not found.');
            return;
        }
        const userId = userRes.rows[0].id;
        const progRes = await client.query("SELECT id FROM programs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
        if (progRes.rows.length === 0) {
            console.log('No programs found.');
            return;
        }
        const programId = progRes.rows[0].id;
        const tasksRes = await client.query(`
            SELECT t.id, t.type, t.title, t.metadata, dp.day_number 
            FROM tasks t 
            JOIN day_plans dp ON t.day_plan_id = dp.id 
            WHERE dp.program_id = $1 
            ORDER BY dp.day_number, t.created_at
        `, [programId]);

        console.log(`Found ${tasksRes.rows.length} tasks for program ${programId}:`);
        for (const task of tasksRes.rows) {
            console.log('\n----------------------------------------');
            console.log(`DAY ${task.day_number} | TYPE: ${task.type} | TITLE: ${task.title}`);
            console.log('METADATA:', JSON.stringify(task.metadata, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
