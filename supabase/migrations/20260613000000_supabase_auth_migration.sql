-- ============================================================
-- Supabase Auth Migration
-- Transitions public.users from custom auth to Supabase Auth.
-- The `id` column now references auth.users.id (set by Supabase).
-- ============================================================

-- Step 1: Drop auth-owned columns that Supabase Auth now manages
ALTER TABLE public.users
    DROP COLUMN IF EXISTS password,
    DROP COLUMN IF EXISTS refresh_token,
    DROP COLUMN IF EXISTS is_verified,
    DROP COLUMN IF EXISTS verification_code,
    DROP COLUMN IF EXISTS verification_expires;

-- Step 2: Make name nullable (populated via trigger metadata or update later)
ALTER TABLE public.users
    ALTER COLUMN name DROP NOT NULL;

-- Step 3: Create a function that auto-inserts into public.users
-- when a new user is created in auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, settings, is_admin, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        '{}',
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            name = COALESCE(EXCLUDED.name, public.users.name),
            updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Step 4: Drop existing trigger if any, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
