-- Quick Fix: Create interview_schedules table
-- Copy this entire file and run it in your Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS interview_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_posting_id UUID NOT NULL,
    applicant_id UUID NOT NULL,
    employer_id UUID NOT NULL,
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    interview_type VARCHAR(50) NOT NULL DEFAULT 'video',
    interview_location TEXT,
    meeting_link TEXT,
    interview_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    duration_minutes INTEGER DEFAULT 60,
    interviewer_name VARCHAR(255),
    interviewer_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interview_schedules_job_posting_id ON interview_schedules(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_applicant_id ON interview_schedules(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_employer_id ON interview_schedules(employer_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules(status);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_date ON interview_schedules(interview_date);

-- Enable RLS
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies (allowing everything for now)
CREATE POLICY "Enable all operations for authenticated users" ON interview_schedules
    FOR ALL USING (true) WITH CHECK (true);

-- Add comments
COMMENT ON TABLE interview_schedules IS 'Stores interview scheduling information for job applications';

