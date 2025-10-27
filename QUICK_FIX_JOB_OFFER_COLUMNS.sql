-- Quick Fix: Add missing offer columns to job_applications table
-- Copy this and run in Supabase SQL Editor

-- Add offer columns if they don't exist
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS offer_salary TEXT,
ADD COLUMN IF NOT EXISTS offer_start_date DATE,
ADD COLUMN IF NOT EXISTS offer_expiry_date DATE,
ADD COLUMN IF NOT EXISTS offer_notes TEXT,
ADD COLUMN IF NOT EXISTS offer_benefits TEXT,
ADD COLUMN IF NOT EXISTS offer_work_schedule TEXT,
ADD COLUMN IF NOT EXISTS offer_sent_date TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN job_applications.offer_salary IS 'Salary offer string (e.g., $75,000 - $85,000 per year)';
COMMENT ON COLUMN job_applications.offer_start_date IS 'Proposed start date for the position';
COMMENT ON COLUMN job_applications.offer_expiry_date IS 'Expiry date for accepting the offer';
COMMENT ON COLUMN job_applications.offer_notes IS 'Additional notes about the job offer';
COMMENT ON COLUMN job_applications.offer_benefits IS 'Benefits and perks included in the offer';
COMMENT ON COLUMN job_applications.offer_work_schedule IS 'Work schedule details';
COMMENT ON COLUMN job_applications.offer_sent_date IS 'Date when the offer was sent';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'job_applications' 
AND column_name LIKE 'offer%'
ORDER BY column_name;

