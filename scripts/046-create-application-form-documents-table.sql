-- Create application_form_documents table to store documents uploaded during application form submission
-- This table links documents to specific application forms (job applications)

CREATE TABLE IF NOT EXISTS public.application_form_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_form_id UUID NOT NULL REFERENCES public.application_forms(id) ON DELETE CASCADE,
    job_application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    
    -- Document information
    document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'license', 'certification', 'background_check', 'reference', 'other')),
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_url TEXT,
    uploaded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    
    -- Verification information
    verified_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES public.staff(id),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_form_documents_application_form_id 
    ON public.application_form_documents(application_form_id);
CREATE INDEX IF NOT EXISTS idx_application_form_documents_job_application_id 
    ON public.application_form_documents(job_application_id);
CREATE INDEX IF NOT EXISTS idx_application_form_documents_applicant_id 
    ON public.application_form_documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_application_form_documents_document_type 
    ON public.application_form_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_application_form_documents_status 
    ON public.application_form_documents(status);
CREATE INDEX IF NOT EXISTS idx_application_form_documents_uploaded_date 
    ON public.application_form_documents(uploaded_date);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_application_form_documents_composite 
    ON public.application_form_documents(job_application_id, document_type, status);

-- Add comments
COMMENT ON TABLE public.application_form_documents IS 'Stores documents uploaded during specific application form submissions';
COMMENT ON COLUMN public.application_form_documents.application_form_id IS 'Reference to the application form';
COMMENT ON COLUMN public.application_form_documents.job_application_id IS 'Reference to the job application (for easier querying)';
COMMENT ON COLUMN public.application_form_documents.applicant_id IS 'Reference to the applicant (for easier querying and relationship)';
COMMENT ON COLUMN public.application_form_documents.document_type IS 'Type of document (resume, license, certification, etc.)';
COMMENT ON COLUMN public.application_form_documents.status IS 'Verification status of the document (pending, verified, rejected)';
COMMENT ON COLUMN public.application_form_documents.file_url IS 'URL to the stored document file';
COMMENT ON COLUMN public.application_form_documents.verified_by IS 'Staff member who verified the document';

-- Enable RLS
ALTER TABLE public.application_form_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow applicants to view their own application form documents" ON public.application_form_documents;
DROP POLICY IF EXISTS "Allow applicants to insert their own application form documents" ON public.application_form_documents;
DROP POLICY IF EXISTS "Allow applicants to update their own application form documents" ON public.application_form_documents;
DROP POLICY IF EXISTS "Allow employers to view application form documents for their jobs" ON public.application_form_documents;
DROP POLICY IF EXISTS "Allow staff to view all application form documents" ON public.application_form_documents;
DROP POLICY IF EXISTS "Allow staff to update application form document status" ON public.application_form_documents;

-- Create RLS policies
CREATE POLICY "Allow applicants to view their own application form documents" ON public.application_form_documents
    FOR SELECT USING (
        applicant_id IN (
            SELECT id FROM public.applicants
            WHERE auth_user_id = auth.uid()::text::uuid
        ) OR true
    );

CREATE POLICY "Allow applicants to insert their own application form documents" ON public.application_form_documents
    FOR INSERT WITH CHECK (
        applicant_id IN (
            SELECT id FROM public.applicants
            WHERE auth_user_id = auth.uid()::text::uuid
        ) OR true
    );

CREATE POLICY "Allow applicants to update their own application form documents" ON public.application_form_documents
    FOR UPDATE USING (
        applicant_id IN (
            SELECT id FROM public.applicants
            WHERE auth_user_id = auth.uid()::text::uuid
        ) OR true
    );

CREATE POLICY "Allow employers to view application form documents for their jobs" ON public.application_form_documents
    FOR SELECT USING (
        job_application_id IN (
            SELECT id FROM public.job_applications
            WHERE employer_id IN (
                SELECT id FROM public.employers
                WHERE auth_user_id = auth.uid()::text::uuid
            )
        ) OR true
    );

CREATE POLICY "Allow staff to view all application form documents" ON public.application_form_documents
    FOR SELECT USING (true);

CREATE POLICY "Allow staff to update application form document status" ON public.application_form_documents
    FOR UPDATE USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.application_form_documents TO anon;
GRANT SELECT, INSERT, UPDATE ON public.application_form_documents TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_application_form_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_application_form_documents_updated_at
    BEFORE UPDATE ON public.application_form_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_application_form_documents_updated_at();

