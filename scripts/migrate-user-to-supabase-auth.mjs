#!/usr/bin/env node
/**
 * Migrate existing public.users row to Supabase Auth.
 *
 * Strategy:
 *   1. Create the user in Supabase auth.users (inviteUserByEmail or createUser).
 *   2. Update public.users.id to the new auth.users UUID.
 *   3. All foreign keys (goals, programs, etc.) cascade automatically since ON DELETE CASCADE.
 *
 * Run: node scripts/migrate-user-to-supabase-auth.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zfekilefdlkkfhoyjtfy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.DATABASE_URL;

if (!SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY env var is required. Export it first:');
    console.error('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const EXISTING_USER = {
    id: '2de80900-157d-4e8f-bf0e-6754165b9c1c',
    email: 'ichizanum@gmail.com',
    name: 'Chizanum',
};

async function migrate() {
    console.log(`\n🔍 Migrating user: ${EXISTING_USER.email}`);

    // Step 1: Check if this user already exists in auth.users
    const { data: existingAuthUser } = await supabase.auth.admin.getUserById(EXISTING_USER.id);
    if (existingAuthUser?.user) {
        console.log(`✅ User already exists in auth.users with id: ${existingAuthUser.user.id}`);
        console.log('   No migration needed.');
        return;
    }

    // Step 2: Create user in Supabase Auth with a temporary password
    // The user should reset their password via the "Forgot Password" flow.
    const tempPassword = crypto.randomUUID(); // Random temp password
    console.log(`\n📝 Creating Supabase Auth user for ${EXISTING_USER.email}...`);

    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: EXISTING_USER.email,
        password: tempPassword,
        user_metadata: { name: EXISTING_USER.name },
        email_confirm: true, // Admin-created users are confirmed immediately
    });

    if (createError) {
        console.error('❌ Failed to create auth user:', createError.message);
        process.exit(1);
    }

    const newAuthId = authData.user.id;
    console.log(`✅ Auth user created with new id: ${newAuthId}`);

    // Step 3: Update public.users.id to the new Supabase Auth UUID
    // This requires a raw SQL update since TypeORM won't let you update a PK easily.
    // We use the Supabase RPC or service role REST to run SQL.
    console.log(`\n🔄 Updating public.users.id from ${EXISTING_USER.id} → ${newAuthId}...`);

    const { error: updateError } = await supabase.rpc('migrate_user_id', {
        old_id: EXISTING_USER.id,
        new_id: newAuthId,
    });

    if (updateError) {
        // The RPC might not exist yet — fall back to the raw SQL approach via db query
        console.log('⚠️  RPC not available, attempting direct update...');
        console.log('\n📋 Run this SQL manually in the Supabase dashboard SQL editor:');
        console.log(`
-- IMPORTANT: Run these statements in order in the Supabase SQL editor
BEGIN;

-- Temporarily disable FK constraints
SET session_replication_role = replica;

-- Update all foreign keys referencing the old user id
UPDATE goals SET user_id = '${newAuthId}' WHERE user_id = '${EXISTING_USER.id}';
UPDATE programs SET user_id = '${newAuthId}' WHERE user_id = '${EXISTING_USER.id}';
UPDATE quiz_attempts SET user_id = '${newAuthId}' WHERE user_id = '${EXISTING_USER.id}';
UPDATE progress SET user_id = '${newAuthId}' WHERE user_id = '${EXISTING_USER.id}';
UPDATE check_ins SET user_id = '${newAuthId}' WHERE user_id = '${EXISTING_USER.id}';
UPDATE reward_events SET user_id = '${newAuthId}' WHERE user_id = '${EXISTING_USER.id}';
UPDATE error_logs SET user_id = '${newAuthId}' WHERE user_id = '${EXISTING_USER.id}';
UPDATE ai_generation_logs SET user_id = '${newAuthId}' WHERE user_id = '${EXISTING_USER.id}';
UPDATE program_ratings SET user_id = '${newAuthId}' WHERE user_id = '${EXISTING_USER.id}';
UPDATE referrals SET referrer_id = '${newAuthId}' WHERE referrer_id = '${EXISTING_USER.id}';

-- Update the main users row
UPDATE users SET id = '${newAuthId}' WHERE id = '${EXISTING_USER.id}';

-- Re-enable FK constraints
SET session_replication_role = DEFAULT;

COMMIT;
`);
        console.log(`\n⚠️  After running the SQL, the user's new ID is: ${newAuthId}`);
        console.log(`\n📧 The user will need to use "Forgot Password" to set a new password.`);
        console.log(`   Send them a password reset email using:`);
        console.log(`   Supabase Dashboard → Authentication → Users → ${EXISTING_USER.email} → Send recovery email`);
        return;
    }

    console.log(`✅ public.users.id updated successfully!`);
    console.log(`\n🎉 Migration complete!`);
    console.log(`   Old ID: ${EXISTING_USER.id}`);
    console.log(`   New ID: ${newAuthId}`);
    console.log(`\n📧 User needs to set a new password via:`);
    console.log(`   Supabase Dashboard → Authentication → Users → ${EXISTING_USER.email} → Send recovery email`);
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
