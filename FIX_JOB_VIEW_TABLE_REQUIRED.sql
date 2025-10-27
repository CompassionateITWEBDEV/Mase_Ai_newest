-- ========================================
-- FIX: Job Views Table Setup
-- ========================================
-- Run this in your Supabase SQL Editor if you're getting insert errors
-- ========================================

-- Step 1: Create the job_views table
CREATE TABLE IF NOT EXISTS public.job_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES public.employers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_views_job_posting_id ON public.job_views(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_views_applicant_id ON public.job_views(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_views_employer_id ON public.job_views(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_views_staff_id ON public.job_views(staff_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON public.job_views(viewed_at);

-- Step 3: Add unique constraint to prevent duplicate views from same user
-- This ensures one view per user per job
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_views_unique_applicant 
ON public.job_views(job_posting_id, applicant_id) 
WHERE applicant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_views_unique_employer 
ON public.job_views(job_posting_id, employer_id) 
WHERE employer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_views_unique_staff 
ON public.job_views(job_posting_id, staff_id) 
WHERE staff_id IS NOT NULL;

-- Step 4: Enable RLS
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to view their own job views" ON public.job_views;
DROP POLICY IF EXISTS "Allow users to insert their own job views" ON public.job_views;
DROP POLICY IF EXISTS "Allow anonymous job view inserts" ON public.job_views;
DROP POLICY IF EXISTS "Allow public read access to job views" ON public.job_views;
DROP POLICY IF EXISTS "Allow authenticated users to view job views" ON public.job_views;

-- Step 6: Create RLS policies - ALLOW ANONYMOUS INSERTS
-- This is critical for the API to work without authentication
CREATE POLICY "Allow anonymous job view inserts" ON public.job_views
    FOR INSERT WITH CHECK (true);

-- Allow anyone to read job views (for statistics)
CREATE POLICY "Allow public read access to job views" ON public.job_views
    FOR SELECT USING (true);

-- Step 7: Grant necessary permissions
GRANT SELECT, INSERT ON public.job_views TO anon;
GRANT SELECT, INSERT ON public.job_views TO authenticated;

-- Step 8: Verify the table was created
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE tablename = 'job_views';

-- Step 9: Check RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'job_views';

-- Step 10: Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'job_views';

-- ========================================
-- If you still have issues, test with:
-- ========================================
-- INSERT INTO public.job_views (job_posting_id, applicant_id, viewed_at)
-- VALUES (
--     (SELECT id FROM job_postings LIMIT 1),
--     (SELECT id FROM applicants LIMIT 1),
--     NOW()
-- );

-- If this works, the table is set up correctly!

