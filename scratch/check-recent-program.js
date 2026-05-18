const { Client } = require('pg');

async function checkRecentProgram() {
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
        console.log('✅ Connected to staging database');

        // 1. Fetch latest programs
        const progRes = await client.query(`
            SELECT id, title, status, created_at
            FROM programs
            ORDER BY created_at DESC
            LIMIT 3;
        `);

        console.log('\n--- LATEST PROGRAMS ON STAGING ---');
        progRes.rows.forEach(p => {
            console.log(`Program ID: ${p.id} | Title: "${p.title}" | Status: ${p.status} | Created: ${p.created_at}`);
        });

        if (progRes.rows.length > 0) {
            const latestProgId = progRes.rows[0].id;
            
            // 2. Fetch day plans for the latest program
            const dayRes = await client.query(`
                SELECT id, day_number, theme, status, created_at
                FROM day_plans
                WHERE program_id = $1
                ORDER BY day_number ASC;
            `, [latestProgId]);

            console.log(`\n--- DAY PLANS FOR LATEST PROGRAM (${latestProgId}) ---`);
            dayRes.rows.forEach(d => {
                console.log(`Day ${d.day_number} Plan ID: ${d.id} | Theme: "${d.theme}" | Status: ${d.status}`);
            });

            // 3. Fetch tasks for Day 1
            if (dayRes.rows.length > 0) {
                const day1Id = dayRes.rows[0].id;
                const taskRes = await client.query(`
                    SELECT id, title, type, xp_reward, completed, created_at, metadata
                    FROM tasks
                    WHERE day_plan_id = $1
                    ORDER BY "order" ASC;
                `, [day1Id]);

                console.log(`\n--- TASKS FOR DAY 1 PLAN (${day1Id}) ---`);
                if (taskRes.rows.length === 0) {
                    console.log('No tasks found for Day 1.');
                } else {
                    taskRes.rows.forEach(t => {
                        console.log(`Task ID: ${t.id} | Title: "${t.title}" | Type: ${t.type} | Metadata Status: ${t.metadata?.status}`);
                    });
                }
            }
        }
    } catch (err) {
        console.error('❌ Error checking recent program:', err);
    } finally {
        await client.end();
    }
}

checkRecentProgram();
