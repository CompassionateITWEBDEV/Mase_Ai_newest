-- Simple fix: Just run the policies part
-- Copy and paste ONE block at a time

-- Block 1: Drop policies
DROP POLICY IF EXISTS "Allow anonymous job view inserts" ON public.job_views;
DROP POLICY IF EXISTS "Allow public read access to job views" ON public.job_views;

-- Block 2: Create INSERT policy
CREATE POLICY "Allow anonymous job view inserts" ON public.job_views
FOR INSERT WITH CHECK (true);

-- Block 3: Create SELECT policy  
CREATE POLICY "Allow public read access to job views" ON public.job_views
FOR SELECT USING (true);

