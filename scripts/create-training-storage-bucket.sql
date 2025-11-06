-- =====================================================
-- CREATE STORAGE BUCKET FOR TRAINING FILES
-- =====================================================
-- This bucket stores videos and large files for training modules
-- Run this in Supabase SQL Editor

-- Create the training-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-files',
  'training-files',
  true,
  524288000,
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create the training-modules bucket (alternative)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-modules',
  'training-modules',
  true,
  524288000,
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for public read access
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-files');

DROP POLICY IF EXISTS "Public Access Modules" ON storage.objects;
CREATE POLICY "Public Access Modules"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-modules');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'training-files' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated users can upload modules" ON storage.objects;
CREATE POLICY "Authenticated users can upload modules"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'training-modules' AND
  auth.role() = 'authenticated'
);

-- Verify bucket was created
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('training-files', 'training-modules');
