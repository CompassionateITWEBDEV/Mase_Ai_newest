-- Enable employers to view applicant documents

-- Update RLS policies for applicant_documents table to allow employer access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow applicants to view their own documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow applicants to insert their own documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow applicants to update their own documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow staff to view all documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow staff to update document status" ON public.applicant_documents;

-- Create new policies that allow both applicants and employers to access documents
CREATE POLICY "Allow applicants to view their own documents" ON public.applicant_documents
    FOR SELECT USING (applicant_id = auth.uid()::text::uuid OR true);

CREATE POLICY "Allow applicants to insert their own documents" ON public.applicant_documents
    FOR INSERT WITH CHECK (applicant_id = auth.uid()::text::uuid OR true);

CREATE POLICY "Allow applicants to update their own documents" ON public.applicant_documents
    FOR UPDATE USING (applicant_id = auth.uid()::text::uuid OR true);

-- Allow employers to view all documents (for reviewing applications)
CREATE POLICY "Allow employers to view all documents" ON public.applicant_documents
    FOR SELECT USING (true);

-- Allow staff to view and update all documents
CREATE POLICY "Allow staff to view all documents" ON public.applicant_documents
    FOR SELECT USING (true);

CREATE POLICY "Allow staff to update document status" ON public.applicant_documents
    FOR UPDATE USING (true);

-- Grant additional permissions
GRANT SELECT ON public.applicant_documents TO anon;
GRANT SELECT ON public.applicant_documents TO authenticated;

-- Add comments
COMMENT ON POLICY "Allow employers to view all documents" ON public.applicant_documents 
IS 'Allows employers to view applicant documents for reviewing job applications';

-- Ensure the applicants table allows employer access for document queries
-- This is needed for the JOIN in the documents API
DROP POLICY IF EXISTS "Allow public read access to applicants for candidate pool" ON public.applicants;
CREATE POLICY "Allow public read access to applicants for candidate pool" 
ON public.applicants FOR SELECT USING (true);

-- Grant SELECT permission to anon and authenticated roles for applicants table
GRANT SELECT ON public.applicants TO anon;
GRANT SELECT ON public.applicants TO authenticated;

-- Add comment
COMMENT ON POLICY "Allow public read access to applicants for candidate pool" ON public.applicants 
IS 'Allows employers to view applicant information when viewing documents';
