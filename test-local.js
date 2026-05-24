const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' });
client.connect().then(async () => {
    try {
        const programId = '91d43e93-1271-4d35-ad4b-fb95b3db0bf6';
        const res = await client.query("SELECT id, status FROM day_plans WHERE program_id = $1 AND day_number = 3", [programId]);
        console.log('Day 3 Plan:', res.rows[0]);
    } catch(e) { console.error(e); }
    client.end();
});
