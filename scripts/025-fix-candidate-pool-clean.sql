-- Prepare applicants table for candidate pool (real data only)

-- First, ensure the required columns exist
ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.applicants
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Update existing records to be active (only real applicants)
UPDATE public.applicants 
SET is_active = true 
WHERE is_active IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applicants_is_active ON public.applicants(is_active);

CREATE INDEX IF NOT EXISTS idx_applicants_profile_views ON public.applicants(profile_views);

-- Ensure RLS is enabled
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be restrictive
DROP POLICY IF EXISTS "Allow anonymous access to applicants" ON public.applicants;

DROP POLICY IF EXISTS "Allow public read access to applicants" ON public.applicants;

DROP POLICY IF EXISTS "Allow public read access to applicants for candidate pool" ON public.applicants;

-- Create policy that allows reading applicant data for candidate pool
CREATE POLICY "Allow public read access to applicants for candidate pool"
ON public.applicants FOR SELECT USING (is_active = true);

-- Grant SELECT permission to anon and authenticated roles
GRANT SELECT ON public.applicants TO anon;

GRANT SELECT ON public.applicants TO authenticated;

-- Add comments
COMMENT ON COLUMN public.applicants.is_active IS 'Whether the applicant profile is active and visible in candidate pool';

COMMENT ON COLUMN public.applicants.profile_views IS 'Number of times this applicant profile has been viewed';

COMMENT ON TABLE public.applicants IS 'Healthcare professionals looking for employment opportunities';

