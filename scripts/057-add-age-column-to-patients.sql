-- Add age column to patients table if it doesn't exist
-- This fixes the "Could not find the 'age' column" error

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.patients.age IS 'Patient age in years';

