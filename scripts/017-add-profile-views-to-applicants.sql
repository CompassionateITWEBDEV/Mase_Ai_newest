-- Add profile_views column to applicants table
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Add index for profile_views
CREATE INDEX IF NOT EXISTS idx_applicants_profile_views ON public.applicants(profile_views);

-- Add comment
COMMENT ON COLUMN public.applicants.profile_views IS 'Number of times the applicant profile has been viewed by employers';

-- Update existing applicants with random view counts for demo purposes
UPDATE public.applicants 
SET profile_views = FLOOR(RANDOM() * 50) + 1 
WHERE profile_views = 0;
