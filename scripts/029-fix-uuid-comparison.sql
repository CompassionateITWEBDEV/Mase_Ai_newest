-- Fix UUID comparison issues in RLS policies
-- This script addresses the "operator does not exist: uuid = text" error

-- First, let's check what the actual data types are
-- and fix the RLS policies accordingly

-- Drop existing policies that might have type issues
DROP POLICY IF EXISTS "Employers can update their job applications" ON job_applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON job_applications;

-- Create policies with proper type casting
-- Option 1: Cast employer_id to text
CREATE POLICY "Employers can update their job applications" 
ON job_applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM job_postings jp 
    WHERE jp.id = job_applications.job_posting_id 
    AND jp.employer_id::text = auth.uid()::text
  )
);

CREATE POLICY "Employers can view applications for their jobs" 
ON job_applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM job_postings jp 
    WHERE jp.id = job_applications.job_posting_id 
    AND jp.employer_id::text = auth.uid()::text
  )
);

-- Alternative approach if the above doesn't work:
-- Cast auth.uid() to UUID instead
-- CREATE POLICY "Employers can update their job applications" 
-- ON job_applications FOR UPDATE 
-- USING (
--   EXISTS (
--     SELECT 1 FROM job_postings jp 
--     WHERE jp.id = job_applications.job_posting_id 
--     AND jp.employer_id = auth.uid()::uuid
--   )
-- );

-- CREATE POLICY "Employers can view applications for their jobs" 
-- ON job_applications FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM job_postings jp 
--     WHERE jp.id = job_applications.job_posting_id 
--     AND jp.employer_id = auth.uid()::uuid
--   )
-- );
