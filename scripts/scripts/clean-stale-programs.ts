import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function cleanStalePrograms() {
  const connectionString = process.env.DATABASE_URL || '';
  const client = new Client({
    connectionString,
    ssl:
      connectionString.includes('supabase') ||
      connectionString.includes('pooler')
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.log('Connected to staging database\n');

    // Show current state before cleanup
    const before = await client.query(`
      SELECT status, COUNT(*) as count
      FROM programs
      GROUP BY status
      ORDER BY count DESC;
    `);
    console.log('Programs before cleanup:');
    console.table(before.rows);

    // Delete all programs except the most recent 'ready' one per user
    // Step 1: Delete stale 'generating' or 'pending' programs older than 30 mins
    const staleDeleted = await client.query(`
      DELETE FROM programs
      WHERE status IN ('generating', 'pending')
        AND created_at < NOW() - INTERVAL '30 minutes'
      RETURNING id, user_id, status, created_at;
    `);
    console.log(
      `\n✅ Deleted ${staleDeleted.rowCount} stale generating/pending programs`,
    );
    if (staleDeleted.rows.length > 0) {
      console.table(staleDeleted.rows);
    }

    // Step 2: For each user, keep only their most recent 'ready' program and delete the rest
    const duplicateReady = await client.query(`
      DELETE FROM programs
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
          FROM programs
          WHERE status = 'ready'
        ) ranked
        WHERE rn > 1
      )
      RETURNING id, user_id, status, created_at;
    `);
    console.log(
      `\n✅ Deleted ${duplicateReady.rowCount} duplicate ready programs (kept most recent per user)`,
    );
    if (duplicateReady.rows.length > 0) {
      console.table(duplicateReady.rows);
    }

    // Show state after cleanup
    const after = await client.query(`
      SELECT status, COUNT(*) as count
      FROM programs
      GROUP BY status
      ORDER BY count DESC;
    `);
    console.log('\nPrograms after cleanup:');
    console.table(after.rows);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanStalePrograms();
