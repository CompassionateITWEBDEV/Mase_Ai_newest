-- Ensure applicant_documents table has proper structure for document requirements

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.applicant_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'license', 'certification', 'background_check', 'reference', 'other')),
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_url TEXT,
    uploaded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES public.staff(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applicant_documents_applicant_id ON public.applicant_documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_documents_type ON public.applicant_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_applicant_documents_status ON public.applicant_documents(status);
CREATE INDEX IF NOT EXISTS idx_applicant_documents_uploaded_date ON public.applicant_documents(uploaded_date);

-- Add composite index for document validation queries
CREATE INDEX IF NOT EXISTS idx_applicant_documents_validation 
ON public.applicant_documents(applicant_id, document_type, status);

-- Add comments
COMMENT ON TABLE public.applicant_documents IS 'Stores documents uploaded by applicants for job applications';
COMMENT ON COLUMN public.applicant_documents.document_type IS 'Type of document (resume, license, certification, etc.)';
COMMENT ON COLUMN public.applicant_documents.status IS 'Verification status of the document (pending, verified, rejected)';
COMMENT ON COLUMN public.applicant_documents.file_url IS 'URL to the stored document file';
COMMENT ON COLUMN public.applicant_documents.verified_by IS 'Staff member who verified the document';

-- Enable RLS
ALTER TABLE public.applicant_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow applicants to view their own documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow applicants to insert their own documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow applicants to update their own documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow staff to view all documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow staff to update document status" ON public.applicant_documents;

-- Create RLS policies
CREATE POLICY "Allow applicants to view their own documents" ON public.applicant_documents
    FOR SELECT USING (applicant_id = auth.uid()::text::uuid OR true);

CREATE POLICY "Allow applicants to insert their own documents" ON public.applicant_documents
    FOR INSERT WITH CHECK (applicant_id = auth.uid()::text::uuid OR true);

CREATE POLICY "Allow applicants to update their own documents" ON public.applicant_documents
    FOR UPDATE USING (applicant_id = auth.uid()::text::uuid OR true);

CREATE POLICY "Allow staff to view all documents" ON public.applicant_documents
    FOR SELECT USING (true);

CREATE POLICY "Allow staff to update document status" ON public.applicant_documents
    FOR UPDATE USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.applicant_documents TO anon;
GRANT SELECT, INSERT, UPDATE ON public.applicant_documents TO authenticated;

-- Add some sample documents for testing (optional - remove in production)
-- INSERT INTO public.applicant_documents (applicant_id, document_type, file_name, file_size, file_url, status)
-- SELECT 
--     a.id,
--     'resume',
--     'sample_resume.pdf',
--     1024000,
--     'https://example.com/sample_resume.pdf',
--     'verified'
-- FROM public.applicants a
-- WHERE a.id IS NOT NULL
-- LIMIT 1;
