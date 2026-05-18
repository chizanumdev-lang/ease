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

    const userId = '2de80900-157d-4e8f-bf0e-6754165b9c1c';

    try {
        await client.connect();
        console.log('✅ Connected to staging database');

        // Find active programs
        const programsRes = await client.query('SELECT id, title FROM programs WHERE user_id = $1', [userId]);
        console.log(`Found ${programsRes.rows.length} programs for user:`, programsRes.rows);

        for (const prog of programsRes.rows) {
            console.log(`🧹 Deleting program ${prog.id} and its associated day plans and tasks...`);
            
            // Delete tasks associated with day plans of this program
            await client.query(`
                DELETE FROM tasks 
                WHERE day_plan_id IN (
                    SELECT id FROM day_plans WHERE program_id = $1
                )
            `, [prog.id]);

            // Delete day plans
            await client.query('DELETE FROM day_plans WHERE program_id = $1', [prog.id]);

            // Delete program
            await client.query('DELETE FROM programs WHERE id = $1', [prog.id]);
            
            console.log(`✅ Successfully deleted program ${prog.id}`);
        }

        // Delete any orphan goals for clean restart
        await client.query('DELETE FROM goals WHERE user_id = $1', [userId]);
        console.log('🧹 Cleared all goals for a completely fresh wizard start.');

    } catch (err) {
        console.error('❌ Cleanup failed:', err);
    } finally {
        await client.end();
    }
}

run();
