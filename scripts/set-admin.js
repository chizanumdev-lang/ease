const { Client } = require('pg');
require('dotenv').config();

async function setAdmin(email) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(
            "UPDATE users SET \"isAdmin\" = true WHERE email = $1 RETURNING id, name, email, \"isAdmin\"",
            [email]
        );
        if (res.rowCount > 0) {
            console.log('User updated successfully:', res.rows[0]);
        } else {
            console.log('User not found with email:', email);
        }
    } catch (err) {
        console.error('Error updating user:', err);
    } finally {
        await client.end();
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Please provide an email: node scripts/set-admin.js user@example.com');
} else {
    setAdmin(email);
}
