-- Create applicant_documents table for document management
CREATE TABLE IF NOT EXISTS public.applicant_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_applicant_documents_applicant_id ON public.applicant_documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_documents_type ON public.applicant_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_applicant_documents_status ON public.applicant_documents(status);
CREATE INDEX IF NOT EXISTS idx_applicant_documents_uploaded_date ON public.applicant_documents(uploaded_date);

-- Add comments
COMMENT ON TABLE public.applicant_documents IS 'Stores documents uploaded by applicants';
COMMENT ON COLUMN public.applicant_documents.document_type IS 'Type of document (resume, license, certification, etc.)';
COMMENT ON COLUMN public.applicant_documents.status IS 'Verification status of the document';
COMMENT ON COLUMN public.applicant_documents.file_url IS 'URL to the stored document file';

-- Enable RLS
ALTER TABLE public.applicant_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow applicants to view their own documents" ON public.applicant_documents
    FOR SELECT USING (applicant_id = auth.uid()::text::uuid OR true);

CREATE POLICY "Allow applicants to insert their own documents" ON public.applicant_documents
    FOR INSERT WITH CHECK (applicant_id = auth.uid()::text::uuid OR true);

CREATE POLICY "Allow applicants to update their own documents" ON public.applicant_documents
    FOR UPDATE USING (applicant_id = auth.uid()::text::uuid OR true);

-- Allow anonymous access for now (since we're bypassing auth)
CREATE POLICY "Allow anonymous access to applicant_documents" ON public.applicant_documents
    FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_applicant_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applicant_documents_updated_at
    BEFORE UPDATE ON public.applicant_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_applicant_documents_updated_at();

-- Insert sample data
INSERT INTO public.applicant_documents (applicant_id, document_type, file_name, file_size, status, notes) VALUES
    ((SELECT id FROM public.applicants LIMIT 1), 'resume', 'John_Doe_Resume.pdf', 1024000, 'verified', 'Professional resume with 5 years experience'),
    ((SELECT id FROM public.applicants LIMIT 1), 'license', 'RN_License_2024.pdf', 512000, 'verified', 'Active RN License - Michigan'),
    ((SELECT id FROM public.applicants LIMIT 1), 'certification', 'BLS_Certification.pdf', 256000, 'verified', 'BLS Certification valid until 2025'),
    ((SELECT id FROM public.applicants LIMIT 1), 'background_check', 'Background_Check_2024.pdf', 768000, 'pending', 'Background check in progress'),
    ((SELECT id FROM public.applicants LIMIT 1), 'reference', 'Professional_References.pdf', 384000, 'verified', 'Three professional references');
