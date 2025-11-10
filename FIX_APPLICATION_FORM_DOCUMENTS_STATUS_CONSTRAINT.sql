-- Fix application_form_documents status constraint
-- The constraint should only allow: 'pending', 'verified', 'rejected'
-- This script will drop the old constraint and create the correct one

-- Step 1: Update any existing rows with invalid status to 'pending'
-- This must be done BEFORE dropping the constraint to avoid errors
UPDATE public.application_form_documents 
SET status = 'pending' 
WHERE status IS NULL OR status NOT IN ('pending', 'verified', 'rejected');

-- Step 2: Drop the existing constraint (must be done outside DO block for ALTER TABLE)
-- Drop constraint with standard name
ALTER TABLE public.application_form_documents 
DROP CONSTRAINT IF EXISTS application_form_documents_status_check;

-- Try alternative constraint names that might exist
ALTER TABLE public.application_form_documents 
DROP CONSTRAINT IF EXISTS application_form_documents_status_chk;

-- Step 3: Drop any other check constraints on status column that might exist
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find and drop any check constraints on the status column
    FOR constraint_record IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'application_form_documents'
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%status%'
    LOOP
        EXECUTE 'ALTER TABLE public.application_form_documents DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraints: %', SQLERRM;
END $$;

-- Step 4: Add the correct constraint
-- Note: This will fail if constraint already exists, but that's okay - it means it's already correct
-- If you get an error that constraint already exists, check if it allows the correct values
ALTER TABLE public.application_form_documents 
ADD CONSTRAINT application_form_documents_status_check 
CHECK (status IN ('pending', 'verified', 'rejected'));

-- Alternative: Direct ALTER TABLE if DO block doesn't work
-- Uncomment the lines below if the DO block approach fails:
-- ALTER TABLE public.application_form_documents 
-- DROP CONSTRAINT IF EXISTS application_form_documents_status_check;
-- 
-- ALTER TABLE public.application_form_documents 
-- ADD CONSTRAINT application_form_documents_status_check 
-- CHECK (status IN ('pending', 'verified', 'rejected'));

-- Step 5: Verify the constraint
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'application_form_documents'
AND tc.constraint_name LIKE '%status%';

