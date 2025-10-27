-- Add password_hash columns to applicants and employers tables for fallback authentication
-- This is needed when Supabase email signups are disabled

-- Add password_hash column to applicants table
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add password_hash column to employers table  
ALTER TABLE public.employers 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add password_hash column to staff table
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.applicants.password_hash IS 'Stored password hash for fallback authentication when Supabase Auth is disabled';
COMMENT ON COLUMN public.employers.password_hash IS 'Stored password hash for fallback authentication when Supabase Auth is disabled';
COMMENT ON COLUMN public.staff.password_hash IS 'Stored password hash for fallback authentication when Supabase Auth is disabled';

-- Note: In production, these passwords should be properly hashed using bcrypt or similar
-- For development purposes, we're storing plain text passwords
-- TODO: Implement proper password hashing in the registration API


