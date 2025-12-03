-- =====================================================
-- FIX STAFF DOCUMENTS TABLE
-- Run this in Supabase SQL Editor if you get foreign key errors
-- =====================================================

-- Step 1: Drop the problematic foreign key constraint
ALTER TABLE staff_documents DROP CONSTRAINT IF EXISTS staff_documents_staff_id_fkey;

-- Step 2: If that doesn't work, drop and recreate the table
-- Uncomment the lines below if Step 1 doesn't fix the issue:

/*
DROP TABLE IF EXISTS staff_documents CASCADE;

CREATE TABLE staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID,  -- No foreign key constraint
  staff_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date DATE,
  verified_by VARCHAR(255),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  category VARCHAR(50) DEFAULT 'general',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_documents_staff_id ON staff_documents(staff_id);
CREATE INDEX idx_staff_documents_status ON staff_documents(status);

-- RLS
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON staff_documents FOR ALL USING (true) WITH CHECK (true);
*/

-- =====================================================
-- CREATE STORAGE BUCKET
-- Go to Supabase Dashboard > Storage > New Bucket
-- Name: staff-documents
-- Public: OFF (private)
-- =====================================================


