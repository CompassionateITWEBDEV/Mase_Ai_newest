-- =====================================================
-- CREATE STORAGE BUCKET FOR STAFF DOCUMENTS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-documents',
  'staff-documents',
  false,  -- Private bucket
  10485760,  -- 10MB max file size
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the bucket
-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'staff-documents');

-- Allow authenticated users to read
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'staff-documents');

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'staff-documents');

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'staff-documents');

-- Allow service role full access (for API)
DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;
CREATE POLICY "Allow service role full access" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'staff-documents')
  WITH CHECK (bucket_id = 'staff-documents');

-- Allow anon users to read (for public URLs if needed)
DROP POLICY IF EXISTS "Allow anon reads" ON storage.objects;
CREATE POLICY "Allow anon reads" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'staff-documents');

-- Allow anon users to upload (for unauthenticated API calls)
DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
CREATE POLICY "Allow anon uploads" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'staff-documents');

-- =====================================================
-- DONE! Storage bucket created with proper policies
-- =====================================================


