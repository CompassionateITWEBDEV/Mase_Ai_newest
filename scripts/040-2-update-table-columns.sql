-- Update existing columns in interview_reschedule_requests table
-- Run this if the table already exists with old column names

-- Add new columns if they don't exist
ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS proposed_date DATE,
ADD COLUMN IF NOT EXISTS proposed_time TIME,
ADD COLUMN IF NOT EXISTS original_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_by UUID;

-- Drop old columns if they exist (after ensuring new columns are populated)
-- Only run these if you don't have data yet, otherwise migrate data first
-- ALTER TABLE interview_reschedule_requests DROP COLUMN IF EXISTS current_date;
-- ALTER TABLE interview_reschedule_requests DROP COLUMN IF EXISTS new_date;
-- ALTER TABLE interview_reschedule_requests DROP COLUMN IF EXISTS new_time;
-- ALTER TABLE interview_reschedule_requests DROP COLUMN IF EXISTS reviewed_at;
-- ALTER TABLE interview_reschedule_requests DROP COLUMN IF EXISTS reviewed_by;

-- Make proposed_date and proposed_time NOT NULL after ensuring columns exist
DO $$ 
BEGIN
    -- Only alter if column exists and is nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'interview_reschedule_requests' 
               AND column_name = 'proposed_date' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE interview_reschedule_requests ALTER COLUMN proposed_date SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'interview_reschedule_requests' 
               AND column_name = 'proposed_time' 
               AND is_nullable = 'YES') THEN
        ALTER TABLE interview_reschedule_requests ALTER COLUMN proposed_time SET NOT NULL;
    END IF;
END $$;

