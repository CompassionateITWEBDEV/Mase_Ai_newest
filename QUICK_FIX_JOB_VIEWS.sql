-- ========================================
-- QUICK FIX: Job Views Policies
-- ========================================
-- Fixes "policy already exists" error
-- ========================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow users to view their own job views" ON public.job_views;
DROP POLICY IF EXISTS "Allow users to insert their own job views" ON public.job_views;
DROP POLICY IF EXISTS "Allow anonymous job view inserts" ON public.job_views;
DROP POLICY IF EXISTS "Allow public read access to job views" ON public.job_views;
DROP POLICY IF EXISTS "Allow authenticated users to view job views" ON public.job_views;

-- Recreate the essential policies
CREATE POLICY "Allow anonymous job view inserts" ON public.job_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to job views" ON public.job_views
    FOR SELECT USING (true);

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'job_views'
ORDER BY policyname;
