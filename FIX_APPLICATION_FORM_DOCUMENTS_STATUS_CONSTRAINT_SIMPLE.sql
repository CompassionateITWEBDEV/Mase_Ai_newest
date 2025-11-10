-- Simple fix for application_form_documents status constraint
-- Run this script in Supabase SQL Editor

-- Step 1: Update any existing rows with invalid status to 'pending'
UPDATE public.application_form_documents 
SET status = 'pending' 
WHERE status IS NULL OR status NOT IN ('pending', 'verified', 'rejected');

-- Step 2: Drop the existing constraint
ALTER TABLE public.application_form_documents 
DROP CONSTRAINT IF EXISTS application_form_documents_status_check;

-- Step 3: Add the correct constraint
ALTER TABLE public.application_form_documents 
ADD CONSTRAINT application_form_documents_status_check 
CHECK (status IN ('pending', 'verified', 'rejected'));

-- Done! The constraint is now fixed.

