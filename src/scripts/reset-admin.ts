
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

async function resetAdmin() {
  const connectionString = process.env.DATABASE_URL || '';
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : false,
  });

  const email = 'ichizanum@gmail.com';
  const newPassword = 'EaseAdmin2026!';

  try {
    await client.connect();
    console.log('Connected to database');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const res = await client.query(
      'UPDATE users SET password = $1, is_admin = true, is_verified = true WHERE email = $2 RETURNING id',
      [hashedPassword, email]
    );

    if (res.rows.length > 0) {
      console.log(`Successfully reset admin account: ${email}`);
      console.log(`Temporary password set to: ${newPassword}`);
    } else {
      console.log(`User ${email} not found. Creating a new admin account...`);
      await client.query(
        'INSERT INTO users (email, password, name, is_admin, is_verified) VALUES ($1, $2, $3, $4, $5)',
        [email, hashedPassword, 'Admin', true, true]
      );
      console.log(`Created new admin account: ${email}`);
      console.log(`Password: ${newPassword}`);
    }

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

resetAdmin();
