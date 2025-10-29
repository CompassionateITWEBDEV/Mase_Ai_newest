-- Fix RLS policies for application_forms table
-- This script ensures that applicants can insert their own application forms
-- and employers can view application forms for their job postings

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own application forms" ON application_forms;
DROP POLICY IF EXISTS "Employers can view application forms for their job postings" ON application_forms;
DROP POLICY IF EXISTS "Users can view their own application forms" ON application_forms;

-- Create policy for applicants to insert their own application forms
CREATE POLICY "Users can insert their own application forms" ON application_forms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN applicants a ON ja.applicant_id = a.id
      WHERE ja.id = application_forms.job_application_id
      AND a.email = auth.jwt() ->> 'email'
    )
  );

-- Create policy for employers to view application forms for their job postings
CREATE POLICY "Employers can view application forms for their job postings" ON application_forms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      JOIN employers e ON jp.employer_id = e.id
      WHERE ja.id = application_forms.job_application_id
      AND e.email = auth.jwt() ->> 'email'
    )
  );

-- Create policy for applicants to view their own application forms
CREATE POLICY "Users can view their own application forms" ON application_forms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_applications ja
      JOIN applicants a ON ja.applicant_id = a.id
      WHERE ja.id = application_forms.job_application_id
      AND a.email = auth.jwt() ->> 'email'
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT ON application_forms TO authenticated;
GRANT USAGE ON SEQUENCE application_forms_id_seq TO authenticated;

