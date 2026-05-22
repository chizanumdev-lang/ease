const { Client } = require('pg');

async function testHydration() {
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
        
        // 1. Get latest program
        const programRes = await client.query(
            'SELECT id, title, duration FROM programs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', 
            [userId]
        );
        const program = programRes.rows[0];
        if (!program) {
            console.log('❌ No program found');
            return;
        }
        console.log(`Program: ${program.title} (${program.id}), duration: ${program.duration}`);

        // 2. Get day plans
        const daysRes = await client.query(
            'SELECT id, day_number, status FROM day_plans WHERE program_id = $1 ORDER BY day_number ASC',
            [program.id]
        );
        console.log('Day Plans status:');
        daysRes.rows.forEach(d => console.log(`  Day ${d.day_number}: ${d.status} (${d.id})`));

        // 3. Find consistency task for Day 1
        const day1 = daysRes.rows.find(d => d.day_number === 1);
        if (!day1) {
            console.log('❌ Day 1 not found');
            return;
        }

        const tasksRes = await client.query(
            'SELECT id, type, title, completed FROM tasks WHERE day_plan_id = $1',
            [day1.id]
        );
        console.log('Day 1 Tasks:');
        tasksRes.rows.forEach(t => console.log(`  [${t.completed ? 'X' : ' '}] ${t.title} (${t.type}) - ID: ${t.id}`));

        const consistencyTask = tasksRes.rows.find(t => t.type === 'consistency');
        if (!consistencyTask) {
            console.log('❌ Consistency task not found on Day 1!');
            return;
        }

        console.log(`\nFound Day 1 consistency task: "${consistencyTask.title}" (${consistencyTask.id})`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

testHydration();
