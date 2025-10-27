-- Check if is_accepted column exists and its values
-- Run this in Supabase SQL Editor

-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'job_applications' 
AND column_name = 'is_accepted';

-- Check current values
SELECT id, status, is_accepted, notes 
FROM job_applications 
LIMIT 10;

