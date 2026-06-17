-- Startup Schema Fixes
-- Moved from StartupService runDynamicSchemaFixes

DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='reward_events' AND column_name='type'
    ) THEN 
        ALTER TABLE reward_events ALTER COLUMN type DROP NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ritual_tracks' AND column_name='program_id'
    ) THEN 
        ALTER TABLE ritual_tracks ADD COLUMN program_id uuid;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ritual_tracks' AND column_name='date'
    ) THEN 
        ALTER TABLE ritual_tracks DROP COLUMN date;
    END IF;
END $$;
