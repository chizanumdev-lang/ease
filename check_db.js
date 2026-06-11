const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfekilefdlkkfhoyjtfy:Ineed20%24now.@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT p.id, p.title, p.status, p.created_at, u.email 
    FROM programs p 
    JOIN users u ON p.user_id = u.id 
    WHERE u.email = 'ichizanum@gmail.com'
  `);
  console.log('Programs:', res.rows);
  await client.end();
}

run().catch(console.error);
