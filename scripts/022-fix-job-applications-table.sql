-- Fix job_applications table to work with job_postings
-- This ensures job applications can be properly linked to job postings

-- Add job_posting_id column if it doesn't exist
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE;

-- Add index for job_posting_id
CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting_id ON public.job_applications(job_posting_id);

-- Make job_title and job_type nullable since they can be derived from job_posting
ALTER TABLE public.job_applications 
ALTER COLUMN job_title DROP NOT NULL;

ALTER TABLE public.job_applications 
ALTER COLUMN job_type DROP NOT NULL;

-- Add RLS policies for job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous access to job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow applicants to view own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow applicants to insert own applications" ON public.job_applications;

-- Create new policies that work with anonymous access
CREATE POLICY "Allow anonymous access to job_applications" ON public.job_applications
    FOR ALL USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;

-- Add comment
COMMENT ON COLUMN public.job_applications.job_posting_id IS 'Reference to the job posting being applied for';

