-- Add saved_count column to job_postings table
ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS saved_count INTEGER DEFAULT 0;

-- Add index for saved_count
CREATE INDEX IF NOT EXISTS idx_job_postings_saved_count ON public.job_postings(saved_count);

-- Add comment
COMMENT ON COLUMN public.job_postings.saved_count IS 'Number of times this job has been saved by applicants';

