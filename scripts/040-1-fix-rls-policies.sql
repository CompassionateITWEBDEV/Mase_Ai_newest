-- Fix RLS policies to allow service_role
-- Run this if you already created the table

-- Drop existing policies
DROP POLICY IF EXISTS "Employers can view their reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Applicants can view their reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Applicants can insert reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "System can insert reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Employers can update their reschedule requests" ON interview_reschedule_requests;

-- Recreate with service_role support
CREATE POLICY "Employers can view their reschedule requests" 
  ON interview_reschedule_requests FOR SELECT 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text OR 
    employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Applicants can view their reschedule requests" 
  ON interview_reschedule_requests FOR SELECT 
  USING (
    auth.role() = 'service_role' OR
    applicant_id::text = auth.uid()::text OR 
    applicant_id IN (SELECT id FROM applicants WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Applicants can insert reschedule requests" 
  ON interview_reschedule_requests FOR INSERT 
  WITH CHECK (
    auth.role() = 'service_role' OR
    applicant_id::text = auth.uid()::text OR 
    applicant_id IN (SELECT id FROM applicants WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Employers can update their reschedule requests" 
  ON interview_reschedule_requests FOR UPDATE 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text OR 
    employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid())
  );

