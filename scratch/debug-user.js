
const { Client } = require('pg');
require('dotenv').config(); // Use .env

async function debugUser() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false // Try without SSL first or use proper config if needed
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Get latest user
        const userRes = await client.query('SELECT id, email, xp, level, streak FROM users ORDER BY created_at DESC LIMIT 1');
        const user = userRes.rows[0];
        
        if (!user) {
            console.log('No user found');
            return;
        }

        console.log('User State:', user);

        // Get latest reward events
        const rewardsRes = await client.query('SELECT * FROM reward_events WHERE "userId" = $1 ORDER BY created_at DESC LIMIT 5', [user.id]);
        console.log('Latest Rewards:', rewardsRes.rows);

        // Get latest tasks
        const tasksRes = await client.query(`
            SELECT t.id, t.type, t.completed, t."xpReward", d."dayNumber"
            FROM tasks t
            JOIN day_plans d ON t."dayPlanId" = d.id
            JOIN programs p ON d."programId" = p.id
            WHERE p."userId" = $1
            ORDER BY t.updated_at DESC
            LIMIT 5
        `, [user.id]);
        console.log('Latest Tasks:', tasksRes.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

debugUser();
