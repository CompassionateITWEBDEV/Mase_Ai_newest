-- Add is_accepted column to track if application is accepted
-- Run this in Supabase SQL Editor

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE;

-- Update existing applications where notes contains "Application accepted"
UPDATE job_applications 
SET is_accepted = TRUE 
WHERE notes LIKE '%Application accepted%';

-- Add comment
COMMENT ON COLUMN job_applications.is_accepted IS 'Indicates if the application has been accepted for interview scheduling';

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'job_applications' 
AND column_name = 'is_accepted';

