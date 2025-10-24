-- Manual SQL to add password_hash columns
-- Run this directly in your Supabase SQL Editor

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

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('applicants', 'employers', 'staff') 
AND column_name = 'password_hash';
