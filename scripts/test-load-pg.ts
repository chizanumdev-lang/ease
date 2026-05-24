import { Client } from 'pg';

const DATABASE_URL =
  'postgresql://neondb_owner:npg_mDQnO8F3lsWB@ep-small-sound-aizyaehd-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    console.log('Creating Indexes manually...');
    await client.query(
      'CREATE INDEX IF NOT EXISTS "IDX_day_plans_program_id" ON day_plans (program_id)',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS "IDX_tasks_day_plan_id" ON tasks (day_plan_id)',
    );
    console.log('Indexes created/verified.');

    const userEmail = 'test11@gmail.com';

    const start = Date.now();
    const userRes = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [userEmail],
    );
    if (userRes.rows.length === 0) {
      console.log('User not found');
      return;
    }
    const userId = userRes.rows[0].id;
    console.log(`User found: ${userId} (${Date.now() - start}ms)`);

    const progStart = Date.now();
    // Quote "userId" because TypeORM uses camelCase column names often if not specified or mixed
    // But Entity defaults: @Column({ name: 'user_id' }) in Program entity.
    // So column is likely user_id.
    const progRes = await client.query(
      'SELECT id FROM programs WHERE user_id = $1',
      [userId],
    );

    if (progRes.rows.length === 0) {
      console.log('Program not found');
      return;
    }
    const programId = progRes.rows[0].id;
    console.log(`Program found: ${programId} (${Date.now() - progStart}ms)`);

    const planStart = Date.now();
    // DayPlan entity has @Column({ name: 'program_id' })
    const planRes = await client.query(
      `
            SELECT id, day_number, theme
            FROM day_plans
            WHERE program_id = $1 AND day_number = 1
        `,
      [programId],
    );

    if (planRes.rows.length === 0) {
      console.log('No plan for day 1');
    } else {
      const planId = planRes.rows[0].id;
      // Task entity has @JoinColumn({ name: 'day_plan_id' }) so column is day_plan_id
      const tasksRes = await client.query(
        'SELECT id, title FROM tasks WHERE day_plan_id = $1',
        [planId],
      );
      console.log(
        `Plan day 1 loaded. Tasks: ${tasksRes.rows.length} (${Date.now() - planStart}ms)`,
      );
    }

    console.log('\nChecking Indexes...');
    const indexRes = await client.query(`
            SELECT tablename, indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename IN ('tasks', 'day_plans')
            ORDER BY tablename, indexname;
        `);
    indexRes.rows.forEach((row) => {
      console.log(`${row.tablename}: ${row.indexname} -> ${row.indexdef}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
