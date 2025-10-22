-- Create job_views table to track individual job views
CREATE TABLE IF NOT EXISTS public.job_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES public.employers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_views_job_posting_id ON public.job_views(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_views_applicant_id ON public.job_views(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_views_employer_id ON public.job_views(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_views_staff_id ON public.job_views(staff_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON public.job_views(viewed_at);

-- Add unique constraint to prevent duplicate views from same user
-- This ensures one view per user per job
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_views_unique_applicant 
ON public.job_views(job_posting_id, applicant_id) 
WHERE applicant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_views_unique_employer 
ON public.job_views(job_posting_id, employer_id) 
WHERE employer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_views_unique_staff 
ON public.job_views(job_posting_id, staff_id) 
WHERE staff_id IS NOT NULL;

-- Add comments
COMMENT ON TABLE public.job_views IS 'Tracks individual job views by users (one per user per job)';
COMMENT ON COLUMN public.job_views.job_posting_id IS 'ID of the job posting that was viewed';
COMMENT ON COLUMN public.job_views.applicant_id IS 'ID of the applicant who viewed the job (if applicable)';
COMMENT ON COLUMN public.job_views.employer_id IS 'ID of the employer who viewed the job (if applicable)';
COMMENT ON COLUMN public.job_views.staff_id IS 'ID of the staff member who viewed the job (if applicable)';
COMMENT ON COLUMN public.job_views.viewed_at IS 'Timestamp when the job was viewed';
COMMENT ON COLUMN public.job_views.ip_address IS 'IP address of the viewer';
COMMENT ON COLUMN public.job_views.user_agent IS 'User agent string of the viewer';

-- Enable RLS
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow users to view their own job views" ON public.job_views;
CREATE POLICY "Allow users to view their own job views" ON public.job_views
    FOR SELECT USING (
        (applicant_id IS NOT NULL AND applicant_id = auth.uid()::text::uuid) OR
        (employer_id IS NOT NULL AND employer_id = auth.uid()::text::uuid) OR
        (staff_id IS NOT NULL AND staff_id = auth.uid()::text::uuid)
    );

DROP POLICY IF EXISTS "Allow users to insert their own job views" ON public.job_views;
CREATE POLICY "Allow users to insert their own job views" ON public.job_views
    FOR INSERT WITH CHECK (
        (applicant_id IS NOT NULL AND applicant_id = auth.uid()::text::uuid) OR
        (employer_id IS NOT NULL AND employer_id = auth.uid()::text::uuid) OR
        (staff_id IS NOT NULL AND staff_id = auth.uid()::text::uuid)
    );

-- Allow anonymous users to insert job views (for API operations)
DROP POLICY IF EXISTS "Allow anonymous job view inserts" ON public.job_views;
CREATE POLICY "Allow anonymous job view inserts" ON public.job_views
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.job_views TO anon;
GRANT SELECT, INSERT ON public.job_views TO authenticated;
