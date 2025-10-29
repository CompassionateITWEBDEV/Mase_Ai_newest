-- Fix RLS policies for application_forms table to allow inserts
-- This allows the API to insert application forms without requiring authentication

-- Drop existing insert policies
DROP POLICY IF EXISTS "Allow applicants to insert own application forms" ON public.application_forms;
DROP POLICY IF EXISTS "Users can insert their own application forms" ON public.application_forms;

-- Create a more permissive insert policy that allows inserts for any job_application_id
-- This is safe because the job_application record must already exist
CREATE POLICY "Allow inserts for application forms" ON public.application_forms
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.job_applications 
            WHERE id = application_forms.job_application_id
        )
    );

-- Ensure anon and authenticated roles have insert permissions
GRANT INSERT ON public.application_forms TO anon;
GRANT INSERT ON public.application_forms TO authenticated;

COMMENT ON POLICY "Allow inserts for application forms" ON public.application_forms IS 'Allows insertion of application forms for any existing job application';


