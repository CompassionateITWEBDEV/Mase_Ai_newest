-- Allow staff insertions from admin
-- This allows admin to add staff members

-- Drop existing staff insert policies if any
DROP POLICY IF EXISTS "Allow staff inserts" ON public.staff;
DROP POLICY IF EXISTS "Allow anonymous select on staff" ON public.staff;

-- Create policy to allow staff inserts
CREATE POLICY "Allow staff inserts" 
ON public.staff FOR INSERT WITH CHECK (true);

-- Allow SELECT for login checks
CREATE POLICY "Allow staff select for login" 
ON public.staff FOR SELECT USING (true);

-- Allow UPDATE for last_login timestamp
CREATE POLICY "Allow staff updates" 
ON public.staff FOR UPDATE USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.staff TO anon;
GRANT SELECT, INSERT, UPDATE ON public.staff TO authenticated;

