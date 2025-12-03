-- =====================================================
-- STAFF DOCUMENTS TABLE - FIX VERSION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing table if it has wrong foreign key
DROP TABLE IF EXISTS staff_documents CASCADE;

-- Create staff_documents table WITHOUT strict foreign key
-- (staff_id is just a UUID, not enforced to exist in staff table)
CREATE TABLE staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID,  -- No foreign key constraint - allows flexibility
  staff_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected, expired
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date DATE,
  verified_by VARCHAR(255),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  category VARCHAR(50) DEFAULT 'general', -- credentials, certifications, health, compliance, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_staff_documents_staff_id ON staff_documents(staff_id);
CREATE INDEX idx_staff_documents_status ON staff_documents(status);
CREATE INDEX idx_staff_documents_category ON staff_documents(category);
CREATE INDEX idx_staff_documents_expiry ON staff_documents(expiry_date);
CREATE INDEX idx_staff_documents_staff_name ON staff_documents(staff_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_staff_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger
DROP TRIGGER IF EXISTS trigger_staff_documents_updated_at ON staff_documents;
CREATE TRIGGER trigger_staff_documents_updated_at
  BEFORE UPDATE ON staff_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_documents_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now)
DROP POLICY IF EXISTS "Allow all access to staff_documents" ON staff_documents;
CREATE POLICY "Allow all access to staff_documents" ON staff_documents
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON staff_documents TO authenticated;
GRANT ALL ON staff_documents TO anon;
GRANT ALL ON staff_documents TO service_role;

-- =====================================================
-- DONE! Run this SQL in Supabase SQL Editor
-- Then refresh the Documents page
-- =====================================================
