-- Create interview reschedule requests table
CREATE TABLE IF NOT EXISTS interview_reschedule_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID REFERENCES interview_schedules(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
  original_date TIMESTAMP WITH TIME ZONE,
  new_date DATE NOT NULL,
  new_time TIME NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES employers(id),
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
  USING (employer_id::text = auth.uid()::text);

-- Create RLS policy for applicants to view their reschedule requests
CREATE POLICY "Applicants can view their reschedule requests" 
  ON interview_reschedule_requests FOR SELECT 
  USING (applicant_id::text = auth.uid()::text);

-- Create RLS policy for system to insert reschedule requests
CREATE POLICY "System can insert reschedule requests" 
  ON interview_reschedule_requests FOR INSERT 
  WITH CHECK (true);

-- Create RLS policy for employers to update reschedule requests
CREATE POLICY "Employers can update their reschedule requests" 
  ON interview_reschedule_requests FOR UPDATE 
  USING (employer_id::text = auth.uid()::text);

-- Add comment
COMMENT ON TABLE interview_reschedule_requests IS 'Stores interview reschedule requests from applicants';

