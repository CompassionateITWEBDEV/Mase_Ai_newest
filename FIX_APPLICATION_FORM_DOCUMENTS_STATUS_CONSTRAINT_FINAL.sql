-- Fix application_form_documents status constraint
-- This script will check the current constraint and fix it if needed

-- Step 1: Update any existing rows with invalid status to 'pending'
UPDATE public.application_form_documents 
SET status = 'pending' 
WHERE status IS NULL OR status NOT IN ('pending', 'verified', 'rejected');

-- Step 2: Drop the existing constraint (this will work even if it doesn't exist)
ALTER TABLE public.application_form_documents 
DROP CONSTRAINT IF EXISTS application_form_documents_status_check;

-- Step 3: Recreate the constraint with the correct values
ALTER TABLE public.application_form_documents 
ADD CONSTRAINT application_form_documents_status_check 
CHECK (status IN ('pending', 'verified', 'rejected'));

-- Success! The constraint is now fixed and allows: 'pending', 'verified', 'rejected'

