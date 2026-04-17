import { DataSource } from 'typeorm';

async function bootstrap() {
    const dataSource = new DataSource({
        type: 'postgres',
        url: 'postgresql://neondb_owner:npg_mDQnO8F3lsWB@ep-small-sound-aizyaehd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
        ssl: {
            rejectUnauthorized: false,
        },
    });

    try {
        await dataSource.initialize();
        console.log('--- Connected to DB ---');

        // 1. Get all active programs
        const programs = await dataSource.query(`SELECT id, user_id, duration, created_at FROM programs`);
        
        for (const program of programs) {
            console.log(`Processing program ${program.id} for user ${program.user_id}`);

            // 2. Calculate day number
            const startDate = new Date(program.created_at);
            startDate.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const dayNumber = Math.min(Math.max(diffDays + 1, 1), program.duration);

            const dayPlans = await dataSource.query(`SELECT id FROM day_plans WHERE program_id = $1 AND day_number = $2`, [program.id, dayNumber]);
            if (dayPlans.length === 0) continue;
            const dayPlanId = dayPlans[0].id;

            // 3. Calculate streak
            const progress = await dataSource.query(`SELECT checkin_date FROM progress WHERE user_id = $1 ORDER BY checkin_date DESC LIMIT 30`, [program.user_id]);
            let streak = 0;
            if (progress.length > 0) {
                const latest = new Date(progress[0].checkin_date);
                latest.setHours(0,0,0,0);
                if (Math.floor((today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)) <= 1) {
                    streak = 1;
                    for (let i = 1; i < progress.length; i++) {
                        const curr = new Date(progress[i].checkin_date);
                        const prev = new Date(progress[i-1].checkin_date);
                        curr.setHours(0,0,0,0); prev.setHours(0,0,0,0);
                        if (Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)) === 1) streak++;
                        else break;
                    }
                }
            }

            // 4. Update tasks
            // Journal
            await dataSource.query(`UPDATE tasks SET "order" = 3 WHERE day_plan_id = $1 AND (type = 'journal' OR title ILIKE '%journal%')`, [dayPlanId]);
            // Reflection
            await dataSource.query(`UPDATE tasks SET "order" = 4 WHERE day_plan_id = $1 AND (type = 'reflection' OR title ILIKE '%reflection%')`, [dayPlanId]);
            // Consistency
            const commitmentMsg = `i will complete my routine tommorrow. this will be day ${streak + 1} of my streak.`;
            await dataSource.query(`UPDATE tasks SET "order" = 5, description = $1 WHERE day_plan_id = $2 AND (type = 'consistency' OR title ILIKE '%commitment%' OR title ILIKE '%consistency%')`, [commitmentMsg, dayPlanId]);
            
            console.log(`  Updated Day ${dayNumber} tasks for program ${program.id}`);
        }

        console.log('--- Done ---');
    } catch (error) {
        console.error('Error during update:', error);
    } finally {
        await dataSource.destroy();
    }
}

bootstrap();
