
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function auditUsers() {
  const connectionString = process.env.DATABASE_URL || '';
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Check columns
    const colRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    const columns = colRes.rows.map(r => r.column_name);
    console.log('Columns in users table:', columns);

    const missingColumns: string[] = [];
    if (!columns.includes('streak')) missingColumns.push('streak INTEGER DEFAULT 0');
    if (!columns.includes('level')) missingColumns.push('level INTEGER DEFAULT 1');
    if (!columns.includes('xp')) missingColumns.push('xp INTEGER DEFAULT 0');
    if (!columns.includes('is_admin')) missingColumns.push('is_admin BOOLEAN DEFAULT false');
    if (!columns.includes('is_verified')) missingColumns.push('is_verified BOOLEAN DEFAULT false');

    if (missingColumns.length > 0) {
      console.log('Adding missing columns:', missingColumns);
      for (const col of missingColumns) {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col}`);
      }
    }

    // 2. Check for the user
    const email = 'ichizanum@gmail.com';
    const userRes = await client.query('SELECT id, email, is_admin FROM users WHERE email = $1', [email]);
    
    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      console.log(`Found user: ${user.email} (isAdmin: ${user.is_admin})`);
      
      if (!user.is_admin) {
        console.log(`Making ${email} an admin...`);
        await client.query('UPDATE users SET is_admin = true, is_verified = true WHERE email = $1', [email]);
        console.log('Update successful');
      }
    } else {
      console.log(`User ${email} not found. You might need to signup first.`);
    }

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

auditUsers();
