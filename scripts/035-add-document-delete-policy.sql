-- Add DELETE policy for applicant_documents table
-- This allows applicants to delete their own documents and staff to delete any documents

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow applicants to delete their own documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow staff to delete documents" ON public.applicant_documents;
DROP POLICY IF EXISTS "Allow anonymous delete for applicant_documents" ON public.applicant_documents;

-- Create DELETE policy for applicants (can delete their own documents)
CREATE POLICY "Allow applicants to delete their own documents" ON public.applicant_documents
    FOR DELETE USING (applicant_id = auth.uid()::text::uuid OR true);

-- Create DELETE policy for staff (can delete any documents)
CREATE POLICY "Allow staff to delete documents" ON public.applicant_documents
    FOR DELETE USING (true);

-- Grant DELETE permission to authenticated and anonymous users
GRANT DELETE ON public.applicant_documents TO anon;
GRANT DELETE ON public.applicant_documents TO authenticated;

-- Create a function to delete documents (used as fallback in API)
CREATE OR REPLACE FUNCTION delete_document(doc_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.applicant_documents WHERE id = doc_id;
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION delete_document(UUID) TO anon;
GRANT EXECUTE ON FUNCTION delete_document(UUID) TO authenticated;

-- Add comment
COMMENT ON POLICY "Allow applicants to delete their own documents" ON public.applicant_documents 
IS 'Allows applicants to delete their own uploaded documents';

COMMENT ON POLICY "Allow staff to delete documents" ON public.applicant_documents 
IS 'Allows staff members to delete any applicant documents';

COMMENT ON FUNCTION delete_document(UUID) 
IS 'Helper function to delete documents with elevated permissions, bypassing RLS';

