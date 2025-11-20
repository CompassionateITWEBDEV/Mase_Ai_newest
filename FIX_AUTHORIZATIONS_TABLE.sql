-- ================================================================
-- FIX AUTHORIZATIONS TABLE - Remove last_updated column
-- Run this in your Supabase SQL Editor if you already created the table
-- ================================================================

BEGIN;

-- If the table exists with the old schema, drop the last_updated column
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'authorizations' 
        AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE public.authorizations DROP COLUMN last_updated;
        RAISE NOTICE 'Dropped last_updated column from authorizations table';
    END IF;
END $$;

-- Verify the fix
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'authorizations'
ORDER BY ordinal_position;

COMMIT;

-- ================================================================
-- DONE!
-- ================================================================
-- The last_updated column has been removed.
-- The table now only uses created_at and updated_at (proper timestamps).
-- ================================================================




