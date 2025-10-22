-- Add interview and offer fields to job_applications table
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS interview_time TIME,
ADD COLUMN IF NOT EXISTS interview_location TEXT,
ADD COLUMN IF NOT EXISTS interview_notes TEXT,
ADD COLUMN IF NOT EXISTS interviewer TEXT,
ADD COLUMN IF NOT EXISTS offer_salary TEXT,
ADD COLUMN IF NOT EXISTS offer_start_date DATE,
ADD COLUMN IF NOT EXISTS offer_expiry_date DATE,
ADD COLUMN IF NOT EXISTS offer_notes TEXT,
ADD COLUMN IF NOT EXISTS offer_benefits TEXT,
ADD COLUMN IF NOT EXISTS offer_work_schedule TEXT,
ADD COLUMN IF NOT EXISTS offer_sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS offer_response_date TIMESTAMP WITH TIME ZONE;

-- Update existing applications to have proper status values
UPDATE job_applications 
SET status = 'pending' 
WHERE status IS NULL OR status = '';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_interview_date 
ON job_applications(interview_date);

CREATE INDEX IF NOT EXISTS idx_job_applications_offer_sent_date 
ON job_applications(offer_sent_date);

CREATE INDEX IF NOT EXISTS idx_job_applications_status 
ON job_applications(status);

-- Update RLS policies to allow employers to update interview and offer fields
DROP POLICY IF EXISTS "Employers can update their job applications" ON job_applications;

CREATE POLICY "Employers can update their job applications" 
ON job_applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM job_postings jp 
    WHERE jp.id = job_applications.job_posting_id 
    AND jp.employer_id::text = auth.uid()::text
  )
);

-- Allow employers to view applications for their jobs
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON job_applications;

CREATE POLICY "Employers can view applications for their jobs" 
ON job_applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM job_postings jp 
    WHERE jp.id = job_applications.job_posting_id 
    AND jp.employer_id::text = auth.uid()::text
  )
);
