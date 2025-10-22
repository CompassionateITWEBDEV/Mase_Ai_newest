-- Create job_postings table for employers
-- Employers can create job posts, applicants can apply to them

CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES public.employers(id) ON DELETE CASCADE NOT NULL,
    
    -- Job Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    job_type TEXT NOT NULL, -- 'full-time', 'part-time', 'contract', 'per-diem'
    position_type TEXT, -- 'rn', 'lpn', 'cna', 'pt', 'ot', 'st', 'msw', 'aide'
    
    -- Requirements
    experience_required TEXT, -- 'entry', 'mid', 'senior'
    education_required TEXT,
    certifications_required TEXT[],
    skills_required TEXT[],
    
    -- Compensation
    salary_min NUMERIC(10, 2),
    salary_max NUMERIC(10, 2),
    salary_type TEXT, -- 'hourly', 'annual', 'per-visit'
    benefits TEXT[],
    
    -- Location
    location_type TEXT, -- 'on-site', 'remote', 'hybrid'
    city TEXT,
    state TEXT,
    zip_code TEXT,
    
    -- Status & Visibility
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'closed', 'filled'
    is_featured BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    
    -- Counts
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    
    -- Dates
    posted_date TIMESTAMP WITH TIME ZONE,
    closing_date TIMESTAMP WITH TIME ZONE,
    filled_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_postings_employer_id ON public.job_postings(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON public.job_postings(job_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_position_type ON public.job_postings(position_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_city ON public.job_postings(city);
CREATE INDEX IF NOT EXISTS idx_job_postings_state ON public.job_postings(state);
CREATE INDEX IF NOT EXISTS idx_job_postings_posted_date ON public.job_postings(posted_date DESC);

-- Update job_applications table to link to job_postings
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting_id ON public.job_applications(job_posting_id);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow all to select active job_postings" ON public.job_postings;
DROP POLICY IF EXISTS "Allow employer to manage own job_postings" ON public.job_postings;

-- Anyone can view active job postings
CREATE POLICY "Allow all to select active job_postings"
ON public.job_postings FOR SELECT
USING (status = 'active' OR true); -- Allow all for now (development)

-- Employers can manage their own postings
CREATE POLICY "Allow employer to manage own job_postings"
ON public.job_postings FOR ALL
USING (true) -- Allow all for now (development)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_job_posting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_job_posting_timestamp ON public.job_postings;
CREATE TRIGGER set_job_posting_timestamp
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION update_job_posting_timestamp();

-- Insert sample job postings for testing
INSERT INTO public.job_postings (
    employer_id,
    title,
    description,
    job_type,
    position_type,
    experience_required,
    salary_min,
    salary_max,
    salary_type,
    location_type,
    city,
    state,
    status,
    posted_date
) 
SELECT 
    id as employer_id,
    'Registered Nurse - Home Health' as title,
    'We are seeking a compassionate and skilled Registered Nurse to join our home health team. The ideal candidate will provide high-quality patient care in patients'' homes.' as description,
    'full-time' as job_type,
    'rn' as position_type,
    'mid' as experience_required,
    35.00 as salary_min,
    45.00 as salary_max,
    'hourly' as salary_type,
    'on-site' as location_type,
    city,
    state,
    'active' as status,
    NOW() as posted_date
FROM public.employers
LIMIT 1
ON CONFLICT DO NOTHING;

