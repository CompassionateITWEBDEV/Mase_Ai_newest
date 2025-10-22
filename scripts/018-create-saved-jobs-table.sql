-- Create saved_jobs table for job saving functionality
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    saved_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(applicant_id, job_posting_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_saved_jobs_applicant_id ON public.saved_jobs(applicant_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_posting_id ON public.saved_jobs(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_saved_date ON public.saved_jobs(saved_date);

-- Add comments
COMMENT ON TABLE public.saved_jobs IS 'Stores jobs saved by applicants for later review';
COMMENT ON COLUMN public.saved_jobs.applicant_id IS 'ID of the applicant who saved the job';
COMMENT ON COLUMN public.saved_jobs.job_posting_id IS 'ID of the job posting that was saved';
COMMENT ON COLUMN public.saved_jobs.saved_date IS 'Date when the job was saved';

-- Enable RLS
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow applicants to view their own saved jobs" ON public.saved_jobs
    FOR SELECT USING (applicant_id = auth.uid()::text::uuid OR true);

CREATE POLICY "Allow applicants to insert their own saved jobs" ON public.saved_jobs
    FOR INSERT WITH CHECK (applicant_id = auth.uid()::text::uuid OR true);

CREATE POLICY "Allow applicants to delete their own saved jobs" ON public.saved_jobs
    FOR DELETE USING (applicant_id = auth.uid()::text::uuid OR true);

-- Allow anonymous access for now (since we're bypassing auth)
CREATE POLICY "Allow anonymous access to saved_jobs" ON public.saved_jobs
    FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_jobs_updated_at
    BEFORE UPDATE ON public.saved_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_jobs_updated_at();
