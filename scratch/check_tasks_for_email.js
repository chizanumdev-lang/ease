const { Client } = require('pg');

async function checkTasksForEmail() {
    const client = new Client({
        host: 'aws-0-eu-west-1.pooler.supabase.com',
        port: 5432,
        user: 'postgres.zfekilefdlkkfhoyjtfy',
        password: 'Ineed20$now.',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    const email = 'idemili730@gmail.com';

    try {
        await client.connect();
        
        // Find user by email (checking auth.users or profiles table - usually it's in auth.users but let's check profile first if it exists or use the profiles table if ease uses it)
        // Actually, let's look for the user in the 'profiles' or 'users' table if it exists.
        // If it's Supabase, auth.users is in a different schema.
        
        const userRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            console.log(`User with email ${email} not found in auth.users table.`);
            // Let's try to list some users to see what's in there
            const someUsers = await client.query('SELECT id, email FROM auth.users LIMIT 5');
            console.log('Some users in auth.users:', someUsers.rows);
            return;
        }

        const userId = userRes.rows[0].id;
        console.log(`Found User ID: ${userId} for email: ${email}`);
        
        const programRes = await client.query('SELECT id, status, created_at FROM programs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
        
        if (programRes.rows.length === 0) {
            console.log('No programs found for this user.');
            return;
        }

        const program = programRes.rows[0];
        console.log('Latest Program:', program);

        const tasksRes = await client.query(`
            SELECT t.id, t.type, t.title, t.day_plan_id, dp.day_number, t.metadata
            FROM tasks t 
            JOIN day_plans dp ON t.day_plan_id = dp.id 
            WHERE dp.program_id = $1
            ORDER BY dp.day_number, t.created_at
        `, [program.id]);

        console.log(`Total Tasks for Program: ${tasksRes.rows.length}`);
        
        const videoTasks = tasksRes.rows.filter(t => t.type === 'video' || t.title.toLowerCase().includes('video'));
        console.log('Video Tasks:', JSON.stringify(videoTasks, null, 2));

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

checkTasksForEmail();
