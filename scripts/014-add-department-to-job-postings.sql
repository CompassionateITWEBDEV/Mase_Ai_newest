-- Add department field to job_postings table
-- This allows employers to specify which department the job is for

-- Add department column
ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.job_postings.department IS 'Department or unit where the position is located (e.g., ICU, Emergency, Pediatrics, Home Health)';

-- Update existing records to have a default department
UPDATE public.job_postings 
SET department = 'General' 
WHERE department IS NULL;

-- Add index for department filtering
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON public.job_postings(department);

-- Sample departments for reference (matching job portal UI):
-- Primary Departments:
--   - Intensive Care
--   - Rehabilitation
--   - General Care
--   - Long-term Care
--   - Primary Care
--
-- Additional Departments:
--   - Emergency
--   - Pediatrics
--   - Surgical
--   - Oncology
--   - Cardiology
--   - Orthopedics
--   - Mental Health
--   - Home Health
--   - Hospice

