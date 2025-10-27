-- Fix RLS policies for interview_reschedule_requests table
-- This allows service role to bypass RLS and allows proper inserts

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can access all reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Users can view their own reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Users can insert their own reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Users can update their own reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Employers can view their reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Applicants can view their reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Applicants can insert reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Employers can update their reschedule requests" ON interview_reschedule_requests;

-- Create policy that allows service role to do everything
CREATE POLICY "Service role bypass RLS" 
  ON interview_reschedule_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create policy for users to view their own reschedule requests
CREATE POLICY "Users can view their own reschedule requests" 
  ON interview_reschedule_requests FOR SELECT 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text OR
    applicant_id::text = auth.uid()::text
  );

-- Create policy for applicants to insert their own reschedule requests
CREATE POLICY "Applicants can insert reschedule requests" 
  ON interview_reschedule_requests FOR INSERT 
  WITH CHECK (
    auth.role() = 'service_role' OR
    applicant_id::text = auth.uid()::text
  );

-- Create policy for employers to update reschedule requests
CREATE POLICY "Employers can update reschedule requests" 
  ON interview_reschedule_requests FOR UPDATE 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text
  );

