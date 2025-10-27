-- Create interview reschedule requests table
CREATE TABLE IF NOT EXISTS interview_reschedule_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID,
  application_id UUID,
  applicant_id UUID,
  employer_id UUID,
  original_date TIMESTAMP WITH TIME ZONE,
  new_date DATE NOT NULL,
  new_time TIME NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_interview_id ON interview_reschedule_requests(interview_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_employer_id ON interview_reschedule_requests(employer_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_applicant_id ON interview_reschedule_requests(applicant_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON interview_reschedule_requests(status);

-- Enable RLS
ALTER TABLE interview_reschedule_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for employers to view their reschedule requests
CREATE POLICY "Employers can view their reschedule requests" 
  ON interview_reschedule_requests FOR SELECT 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text OR 
    employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid())
  );

-- Create RLS policy for applicants to view their reschedule requests
CREATE POLICY "Applicants can view their reschedule requests" 
  ON interview_reschedule_requests FOR SELECT 
  USING (
    auth.role() = 'service_role' OR
    applicant_id::text = auth.uid()::text OR 
    applicant_id IN (SELECT id FROM applicants WHERE auth_user_id = auth.uid())
  );

-- Create RLS policy for applicants to insert reschedule requests
CREATE POLICY "Applicants can insert reschedule requests" 
  ON interview_reschedule_requests FOR INSERT 
  WITH CHECK (
    auth.role() = 'service_role' OR
    applicant_id::text = auth.uid()::text OR 
    applicant_id IN (SELECT id FROM applicants WHERE auth_user_id = auth.uid())
  );

-- Create RLS policy for employers to update reschedule requests
CREATE POLICY "Employers can update their reschedule requests" 
  ON interview_reschedule_requests FOR UPDATE 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text OR 
    employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid())
  );

-- Add comment
COMMENT ON TABLE interview_reschedule_requests IS 'Stores interview reschedule requests from applicants';

