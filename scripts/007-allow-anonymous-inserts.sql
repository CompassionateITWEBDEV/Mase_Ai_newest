-- Allow anonymous inserts (bypass authentication)
-- This allows users to register without Supabase Auth

-- Drop existing insert policies
DROP POLICY IF EXISTS "Anyone can insert applicants" ON public.applicants;
DROP POLICY IF EXISTS "Anyone can insert employers" ON public.employers;
DROP POLICY IF EXISTS "Allow anonymous select on applicants" ON public.applicants;
DROP POLICY IF EXISTS "Allow anonymous select on employers" ON public.employers;

-- Create policies that allow ALL inserts
CREATE POLICY "Allow all inserts to applicants" 
ON public.applicants FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all inserts to employers" 
ON public.employers FOR INSERT WITH CHECK (true);

-- Allow SELECT for checking if email exists
CREATE POLICY "Allow anonymous select on applicants" 
ON public.applicants FOR SELECT USING (true);

CREATE POLICY "Allow anonymous select on employers" 
ON public.employers FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.applicants TO anon;
GRANT SELECT, INSERT ON public.employers TO anon;
GRANT SELECT, INSERT, UPDATE ON public.applicants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employers TO authenticated;
