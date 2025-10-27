-- FINAL FIX: Add is_accepted column and update existing data
-- Run this in Supabase SQL Editor

-- Step 1: Add the column
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE;

-- Step 2: Update existing applications that have been accepted
-- If notes contains "Application accepted" OR if status is beyond pending
UPDATE job_applications 
SET is_accepted = TRUE 
WHERE notes LIKE '%Application accepted%'
   OR status IN ('interview_scheduled', 'offer_received', 'offer_accepted', 'offer_declined', 'accepted', 'hired');

-- Step 3: Verify the data
SELECT 
  id,
  status,
  is_accepted,
  notes
FROM job_applications 
ORDER BY applied_date DESC
LIMIT 20;

