-- Add requirements and benefits text fields to job_postings table
-- Note: benefits column already exists as TEXT[] array, so we convert it to TEXT

-- Enable pg_trgm extension for text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing benefits array column and recreate as TEXT
ALTER TABLE public.job_postings DROP COLUMN IF EXISTS benefits CASCADE;

-- Add requirements column (plain text for free-form requirements)
ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Add benefits column (plain text for free-form benefits)
ALTER TABLE public.job_postings 
ADD COLUMN IF NOT EXISTS benefits TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.job_postings.requirements IS 'Job requirements as free-form text (e.g., RN License, BLS Certification, 2+ years ICU experience)';
COMMENT ON COLUMN public.job_postings.benefits IS 'Benefits offered as free-form text (e.g., Health Insurance, 401k Match, Paid Time Off)';

-- Add simple indexes (skip trigram for now - can add later if needed)
CREATE INDEX IF NOT EXISTS idx_job_postings_requirements ON public.job_postings(requirements);
CREATE INDEX IF NOT EXISTS idx_job_postings_benefits ON public.job_postings(benefits);

-- Update existing records to have default values
UPDATE public.job_postings 
SET requirements = 'No specific requirements listed' 
WHERE requirements IS NULL OR requirements = '';

UPDATE public.job_postings 
SET benefits = 'Competitive benefits package' 
WHERE benefits IS NULL OR benefits = '';

