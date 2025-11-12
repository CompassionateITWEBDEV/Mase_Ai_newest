-- Add password authentication fields to patients table
-- This enables patient portal login functionality

-- Add password_hash column if it doesn't exist
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add last_login column if it doesn't exist
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Add email column if it doesn't exist (for patient portal communication)
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.patients.password_hash IS 'Hashed password for patient portal authentication';
COMMENT ON COLUMN public.patients.last_login IS 'Timestamp of last successful login to patient portal';
COMMENT ON COLUMN public.patients.email IS 'Patient email address for portal communication';

