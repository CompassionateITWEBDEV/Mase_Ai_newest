-- Fix admin/users permissions and RLS policies
-- Ensure proper access for staff management

-- First, ensure the staff table exists with correct structure
-- (Run 010-create-staff-table-if-missing.sql first if table doesn't exist)

-- Drop ALL existing policies on staff table to start fresh
DROP POLICY IF EXISTS "Allow staff inserts" ON public.staff;
DROP POLICY IF EXISTS "Allow staff select for login" ON public.staff;
DROP POLICY IF EXISTS "Allow staff updates" ON public.staff;
DROP POLICY IF EXISTS "Allow staff deletes" ON public.staff;
DROP POLICY IF EXISTS "Anyone can insert staff" ON public.staff;
DROP POLICY IF EXISTS "Anyone can select staff" ON public.staff;
DROP POLICY IF EXISTS "Anyone can update staff" ON public.staff;

-- Disable RLS temporarily to test
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;

-- OR keep RLS enabled but with permissive policies
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create VERY permissive policies for development
-- (Tighten these for production!)

-- Allow anyone to SELECT (for listing and login)
CREATE POLICY "Allow all to select staff"
ON public.staff
FOR SELECT
USING (true);

-- Allow anyone to INSERT (for creating staff)
CREATE POLICY "Allow all to insert staff"
ON public.staff
FOR INSERT
WITH CHECK (true);

-- Allow anyone to UPDATE (for updating staff)
CREATE POLICY "Allow all to update staff"
ON public.staff
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anyone to DELETE (for deleting staff)
CREATE POLICY "Allow all to delete staff"
ON public.staff
FOR DELETE
USING (true);

-- Grant ALL permissions to both anon and authenticated roles
GRANT ALL ON public.staff TO anon;
GRANT ALL ON public.staff TO authenticated;

-- Also grant usage on sequences if any
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'staff';

-- Verify the grants
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'staff';

