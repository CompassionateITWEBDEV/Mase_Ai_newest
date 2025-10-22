-- Fix Job Portal Tables
-- This fixes the triggers and ensures everything works

-- First, create the update_timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS set_timestamp_applicants ON public.applicants;
DROP TRIGGER IF EXISTS set_timestamp_employers ON public.employers;
DROP TRIGGER IF EXISTS set_timestamp_job_applications ON public.job_applications;

-- Recreate triggers
CREATE TRIGGER set_timestamp_applicants
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_employers
    BEFORE UPDATE ON public.employers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_job_applications
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Drop and recreate RLS policies to ensure they work correctly
DROP POLICY IF EXISTS "Applicants can view own data" ON public.applicants;
DROP POLICY IF EXISTS "Applicants can update own data" ON public.applicants;
DROP POLICY IF EXISTS "Anyone can insert applicants" ON public.applicants;

DROP POLICY IF EXISTS "Employers can view own data" ON public.employers;
DROP POLICY IF EXISTS "Employers can update own data" ON public.employers;
DROP POLICY IF EXISTS "Anyone can insert employers" ON public.employers;

DROP POLICY IF EXISTS "Applicants can view own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can view applications to their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can insert own applications" ON public.job_applications;

-- Recreate policies
CREATE POLICY "Applicants can view own data" ON public.applicants
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Applicants can update own data" ON public.applicants
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can insert applicants" ON public.applicants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Employers can view own data" ON public.employers
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Employers can update own data" ON public.employers
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can insert employers" ON public.employers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Applicants can view own applications" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.applicants
            WHERE applicants.id = job_applications.applicant_id
            AND applicants.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Employers can view applications to their jobs" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employers
            WHERE employers.id = job_applications.employer_id
            AND employers.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Applicants can insert own applications" ON public.job_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.applicants
            WHERE applicants.id = job_applications.applicant_id
            AND applicants.auth_user_id = auth.uid()
        )
    );

-- Ensure proper grants
GRANT SELECT, INSERT, UPDATE ON public.applicants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.job_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.applicants TO anon;
GRANT SELECT, INSERT, UPDATE ON public.employers TO anon;

