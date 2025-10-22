-- Fix RLS policies to allow anonymous updates for applicants
-- This allows the API to update applicant profiles without authentication

-- Drop existing update policy
DROP POLICY IF EXISTS "Applicants can update own data" ON public.applicants;

-- Create new policy that allows anonymous updates
CREATE POLICY "Allow anonymous updates to applicants" 
ON public.applicants FOR UPDATE USING (true);

-- Also allow anonymous deletes if needed
CREATE POLICY "Allow anonymous deletes to applicants" 
ON public.applicants FOR DELETE USING (true);

-- Grant additional permissions
GRANT UPDATE, DELETE ON public.applicants TO anon;
GRANT UPDATE, DELETE ON public.applicants TO authenticated;

-- Add comment
COMMENT ON POLICY "Allow anonymous updates to applicants" ON public.applicants IS 'Allows anonymous users to update applicant records for API operations';
