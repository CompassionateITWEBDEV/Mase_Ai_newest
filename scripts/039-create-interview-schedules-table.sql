-- Create interview_schedules table
CREATE TABLE IF NOT EXISTS interview_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    interview_type VARCHAR(50) NOT NULL DEFAULT 'video', -- video, phone, in-person
    interview_location TEXT, -- For in-person interviews
    meeting_link TEXT, -- For video interviews
    interview_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
    duration_minutes INTEGER DEFAULT 60,
    interviewer_name VARCHAR(255),
    interviewer_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_schedules_job_posting_id ON interview_schedules(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_applicant_id ON interview_schedules(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_employer_id ON interview_schedules(employer_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules(status);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_date ON interview_schedules(interview_date);

-- Enable RLS
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Employers can view their own interview schedules
CREATE POLICY "Employers can view their interview schedules" ON interview_schedules
    FOR SELECT USING (employer_id = auth.uid()::text OR 
                     employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid()));

-- Employers can create interview schedules for their job postings
CREATE POLICY "Employers can create interview schedules" ON interview_schedules
    FOR INSERT WITH CHECK (employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid()));

-- Employers can update their interview schedules
CREATE POLICY "Employers can update their interview schedules" ON interview_schedules
    FOR UPDATE USING (employer_id IN (SELECT id FROM employers WHERE auth_user_id = auth.uid()));

-- Applicants can view their own interview schedules
CREATE POLICY "Applicants can view their interview schedules" ON interview_schedules
    FOR SELECT USING (applicant_id IN (SELECT id FROM applicants WHERE auth_user_id = auth.uid()));

-- Staff can view all interview schedules
CREATE POLICY "Staff can view all interview schedules" ON interview_schedules
    FOR SELECT USING (auth.role() = 'service_role' OR 
                     created_by IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));

-- Staff can create interview schedules
CREATE POLICY "Staff can create interview schedules" ON interview_schedules
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR 
                          created_by IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));

-- Staff can update interview schedules
CREATE POLICY "Staff can update interview schedules" ON interview_schedules
    FOR UPDATE USING (auth.role() = 'service_role' OR 
                     created_by IN (SELECT id FROM staff WHERE auth_user_id = auth.uid()));

-- Add comments
COMMENT ON TABLE interview_schedules IS 'Stores interview scheduling information for job applications';
COMMENT ON COLUMN interview_schedules.interview_type IS 'Type of interview: video, phone, or in-person';
COMMENT ON COLUMN interview_schedules.status IS 'Current status: scheduled, completed, cancelled, rescheduled';
COMMENT ON COLUMN interview_schedules.duration_minutes IS 'Interview duration in minutes, default 60';
COMMENT ON COLUMN interview_schedules.interviewer_name IS 'Name of the person conducting the interview';
COMMENT ON COLUMN interview_schedules.interviewer_email IS 'Email of the interviewer for communication';






