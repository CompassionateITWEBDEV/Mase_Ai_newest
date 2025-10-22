-- Create job_views table to track which users have viewed which jobs
-- This ensures 1 count per user per job

CREATE TABLE IF NOT EXISTS public.job_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES public.employers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_views_job_posting_id ON public.job_views(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_views_applicant_id ON public.job_views(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_views_employer_id ON public.job_views(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_views_staff_id ON public.job_views(staff_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON public.job_views(viewed_at);

-- Create unique constraint to ensure 1 view per user per job
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
COMMENT ON TABLE public.job_views IS 'Tracks job views to ensure 1 count per user per job';
COMMENT ON COLUMN public.job_views.job_posting_id IS 'The job that was viewed';
COMMENT ON COLUMN public.job_views.applicant_id IS 'Applicant who viewed the job (if applicable)';
COMMENT ON COLUMN public.job_views.employer_id IS 'Employer who viewed the job (if applicable)';
COMMENT ON COLUMN public.job_views.staff_id IS 'Staff member who viewed the job (if applicable)';
COMMENT ON COLUMN public.job_views.viewed_at IS 'When the job was viewed';
COMMENT ON COLUMN public.job_views.ip_address IS 'IP address of the viewer';
COMMENT ON COLUMN public.job_views.user_agent IS 'Browser/device information';

-- Enable RLS
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow anonymous users to view job views" ON public.job_views
    FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own job views" ON public.job_views
    FOR INSERT WITH CHECK (
        (applicant_id IS NOT NULL AND applicant_id = current_setting('request.jwt.claims', true)::json->>'sub'::text) OR
        (employer_id IS NOT NULL AND employer_id = current_setting('request.jwt.claims', true)::json->>'sub'::text) OR
        (staff_id IS NOT NULL AND staff_id = current_setting('request.jwt.claims', true)::json->>'sub'::text) OR
        true -- Allow anonymous inserts for now
    );

-- Grant permissions
GRANT SELECT, INSERT ON public.job_views TO anon;
GRANT SELECT, INSERT ON public.job_views TO authenticated;

-- Add trigger to update job_postings view count
CREATE OR REPLACE FUNCTION update_job_view_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the view count in job_postings table
    UPDATE public.job_postings 
    SET views_count = (
        SELECT COUNT(DISTINCT COALESCE(applicant_id, employer_id, staff_id)) 
        FROM public.job_views 
        WHERE job_posting_id = NEW.job_posting_id
    )
    WHERE id = NEW.job_posting_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_job_view_count ON public.job_views;
CREATE TRIGGER trigger_update_job_view_count
    AFTER INSERT ON public.job_views
    FOR EACH ROW
    EXECUTE FUNCTION update_job_view_count();

-- Insert some sample data for testing
INSERT INTO public.job_views (job_posting_id, applicant_id, viewed_at) 
SELECT 
    jp.id,
    a.id,
    NOW() - (random() * interval '30 days')
FROM public.job_postings jp
CROSS JOIN public.applicants a
WHERE random() < 0.3  -- 30% chance of view
LIMIT 50;

-- Update view counts for existing jobs
UPDATE public.job_postings 
SET views_count = (
    SELECT COUNT(DISTINCT COALESCE(applicant_id, employer_id, staff_id)) 
    FROM public.job_views 
    WHERE job_posting_id = job_postings.id
);
