-- Add interview and offer fields to job_applications table
-- This migration adds fields to store interview scheduling and job offer details

-- Add interview-related fields
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS interview_time TIME,
ADD COLUMN IF NOT EXISTS interview_location TEXT,
ADD COLUMN IF NOT EXISTS interviewer TEXT,
ADD COLUMN IF NOT EXISTS interview_notes TEXT;

-- Add offer-related fields
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS offer_deadline DATE,
ADD COLUMN IF NOT EXISTS offer_details TEXT,
ADD COLUMN IF NOT EXISTS offer_salary_min DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS offer_salary_max DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS offer_salary_type VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN job_applications.interview_date IS 'Date when the interview is scheduled';
COMMENT ON COLUMN job_applications.interview_time IS 'Time when the interview is scheduled';
COMMENT ON COLUMN job_applications.interview_location IS 'Location of the interview (office, video call link, etc.)';
COMMENT ON COLUMN job_applications.interviewer IS 'Name of the person conducting the interview';
COMMENT ON COLUMN job_applications.interview_notes IS 'Additional notes or instructions for the interview';
COMMENT ON COLUMN job_applications.offer_deadline IS 'Deadline for responding to the job offer';
COMMENT ON COLUMN job_applications.offer_details IS 'Detailed description of the job offer';
COMMENT ON COLUMN job_applications.offer_salary_min IS 'Minimum salary offered';
COMMENT ON COLUMN job_applications.offer_salary_max IS 'Maximum salary offered';
COMMENT ON COLUMN job_applications.offer_salary_type IS 'Type of salary (hourly, annual, etc.)';

-- Update the updated_at timestamp
UPDATE job_applications SET updated_at = NOW() WHERE updated_at IS NOT NULL;
