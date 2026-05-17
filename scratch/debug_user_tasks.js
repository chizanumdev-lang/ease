const { Client } = require('pg');

async function run() {
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
        
        // 1. Find user by email
        const email = 'idemili730@gmail.com';
        const userRes = await client.query('SELECT * FROM users WHERE email ILIKE $1', [`%${email}%`]);
        console.log('User search result:', userRes.rows);

        if (userRes.rows.length === 0) {
            // Check all users just in case
            const allUsers = await client.query('SELECT id, email FROM users');
            console.log('All users in DB:', allUsers.rows);
            
            // Maybe it's ichizanum@gmail.com?
            const targetEmail = 'ichizanum@gmail.com';
            const targetUser = allUsers.rows.find(u => u.email === targetEmail);
            if (targetUser) {
                console.log(`Checking tasks for ${targetEmail}...`);
                await checkTasksForUser(client, targetUser.id);
            }
        } else {
            await checkTasksForUser(client, userRes.rows[0].id);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

async function checkTasksForUser(client, userId) {
    const programRes = await client.query('SELECT id, status, created_at FROM programs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
    if (programRes.rows.length === 0) {
        console.log('No programs found for user.');
        return;
    }

    const program = programRes.rows[0];
    console.log('Latest Program:', program);

    const tasksRes = await client.query(`
        SELECT t.id, t.type, t.title, dp.day_number, t.metadata
        FROM tasks t 
        JOIN day_plans dp ON t.day_plan_id = dp.id 
        WHERE dp.program_id = $1
        ORDER BY dp.day_number, t.created_at
    `, [program.id]);

    console.log(`Total Tasks: ${tasksRes.rows.length}`);
    const day1Tasks = tasksRes.rows.filter(t => t.day_number === 1);
    console.log('Day 1 Tasks:', day1Tasks.map(t => ({ type: t.type, title: t.title })));
    
    const videoTasks = day1Tasks.filter(t => t.type === 'video');
    if (videoTasks.length >= 3) {
        console.log('!!! FOUND IT: User has 3 or more video tasks on Day 1 !!!');
        console.log('Video Task Details:', JSON.stringify(videoTasks, null, 2));
    }
}

run();
