
const { Client } = require('pg');
require('dotenv').config();

const connectionString = 'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20$now.@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

async function checkStatus() {
    const client = new Client({ connectionString });
    await client.connect();
    
    const userId = '2de80900-157d-4e8f-bf0e-6754165b9c1c';
    
    console.log('Checking user existence:', userId);
    const userRes = await client.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    
    if (userRes.rows.length === 0) {
        console.log('User not found.');
        await client.end();
        return;
    }
    
    console.log('User found:', userRes.rows[0]);
    
    const programRes = await client.query('SELECT * FROM programs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
    
    if (programRes.rows.length === 0) {
        console.log('No programs found.');
        await client.end();
        return;
    }
    
    const program = programRes.rows[0];
    console.log('Latest Program:', {
        id: program.id,
        status: program.status,
        goal: program.goal_description,
        created_at: program.created_at
    });
    
    const dayPlanRes = await client.query('SELECT * FROM day_plans WHERE program_id = $1 ORDER BY day_number ASC', [program.id]);
    const dayPlans = dayPlanRes.rows;
    
    console.log('Day Plans:', dayPlans.map(dp => ({
        day: dp.day_number,
        status: dp.status
    })));
    
    if (dayPlans.length > 0) {
        const taskRes = await client.query('SELECT * FROM tasks WHERE day_plan_id = $1 ORDER BY "order" ASC', [dayPlans[0].id]);
        const tasks = taskRes.rows;
        
        console.log('Tasks for Day 1:', tasks.length);
        tasks.forEach(t => console.log(`- [${t.type}] ${t.title} (ID: ${t.id})`));
    }
    
    await client.end();
}

checkStatus().catch(console.error);
