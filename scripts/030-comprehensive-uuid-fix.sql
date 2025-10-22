-- Comprehensive fix for UUID comparison issues
-- This script addresses all potential "operator does not exist: uuid = text" errors

-- First, let's check the current table structure and fix any issues
-- Add the interview and offer fields if they don't exist
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

-- Drop all existing policies that might have type issues
DROP POLICY IF EXISTS "Employers can update their job applications" ON job_applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON job_applications;
DROP POLICY IF EXISTS "Allow employers to view applications for their jobs" ON job_applications;
DROP POLICY IF EXISTS "Allow employers to update their job applications" ON job_applications;

-- Create new policies with proper type handling
-- We'll try both approaches to ensure compatibility

-- Approach 1: Cast employer_id to text
CREATE POLICY "Employers can view applications for their jobs" 
ON job_applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM job_postings jp 
    WHERE jp.id = job_applications.job_posting_id 
    AND jp.employer_id::text = auth.uid()::text
  )
);

CREATE POLICY "Employers can update their job applications" 
ON job_applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM job_postings jp 
    WHERE jp.id = job_applications.job_posting_id 
    AND jp.employer_id::text = auth.uid()::text
  )
);

-- If the above doesn't work, try this alternative approach:
-- Uncomment the following lines and comment out the above if needed

-- DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON job_applications;
-- DROP POLICY IF EXISTS "Employers can update their job applications" ON job_applications;

-- CREATE POLICY "Employers can view applications for their jobs" 
-- ON job_applications FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM job_postings jp 
--     WHERE jp.id = job_applications.job_posting_id 
--     AND jp.employer_id = auth.uid()::uuid
--   )
-- );

-- CREATE POLICY "Employers can update their job applications" 
-- ON job_applications FOR UPDATE 
-- USING (
--   EXISTS (
--     SELECT 1 FROM job_postings jp 
--     WHERE jp.id = job_applications.job_posting_id 
--     AND jp.employer_id = auth.uid()::uuid
--   )
-- );

-- Also ensure applicants can view their own applications
DROP POLICY IF EXISTS "Applicants can view their own applications" ON job_applications;
CREATE POLICY "Applicants can view their own applications" 
ON job_applications FOR SELECT 
USING (applicant_id::text = auth.uid()::text);

-- Allow applicants to create applications
DROP POLICY IF EXISTS "Applicants can create applications" ON job_applications;
CREATE POLICY "Applicants can create applications" 
ON job_applications FOR INSERT 
WITH CHECK (applicant_id::text = auth.uid()::text);

-- Allow applicants to update their own applications (for status changes)
DROP POLICY IF EXISTS "Applicants can update their own applications" ON job_applications;
CREATE POLICY "Applicants can update their own applications" 
ON job_applications FOR UPDATE 
USING (applicant_id::text = auth.uid()::text)
WITH CHECK (applicant_id::text = auth.uid()::text);
