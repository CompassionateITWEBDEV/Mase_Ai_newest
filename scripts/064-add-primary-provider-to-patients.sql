-- Add primary_provider_id column to patients table
-- This separates:
-- - primary_provider_id: Doctor (MD) who oversees care and receives appointments
-- - assigned_staff_id: Nurse/Staff (RN, PT, etc.) who does home visits

-- Add primary_provider_id column
ALTER TABLE IF EXISTS public.patients
ADD COLUMN IF NOT EXISTS primary_provider_id UUID REFERENCES public.staff(id);

-- Add comment for documentation
COMMENT ON COLUMN public.patients.primary_provider_id IS 'Primary care provider (typically a doctor/MD) who oversees patient care and receives appointments';
COMMENT ON COLUMN public.patients.assigned_staff_id IS 'Assigned staff member (nurse, therapist, etc.) who performs home visits and implements care plan';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_primary_provider ON public.patients(primary_provider_id);

-- If there are existing patients with assigned_staff_id who are doctors (MD), 
-- we can optionally migrate them to primary_provider_id
-- This is optional and can be done manually based on your data

