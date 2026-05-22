const { Client } = require('pg');

async function debugRaw() {
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
        const taskId = '6755c40c-e405-4538-a3ec-c4567109757e';
        const dayPlanId = 'cf6ef087-bf09-4ea7-bf35-905257252e9e';

        const taskRes = await client.query('SELECT id, title, day_plan_id FROM tasks WHERE id = $1', [taskId]);
        console.log('Task in DB:', taskRes.rows);

        const dpRes = await client.query('SELECT id, day_number, status FROM day_plans WHERE id = $1', [dayPlanId]);
        console.log('DayPlan in DB:', dpRes.rows);

        const dpAllRes = await client.query('SELECT id, day_number FROM day_plans LIMIT 5');
        console.log('Sample DayPlans:', dpAllRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

debugRaw();
