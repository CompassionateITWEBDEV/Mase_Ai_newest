-- =====================================================
-- REFERRAL DOCUMENTS TABLE
-- Stores metadata for uploaded documents
-- =====================================================

-- Create referral_documents table
CREATE TABLE IF NOT EXISTS referral_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('medical', 'insurance', 'consent', 'other')),
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path in Supabase
  file_size INTEGER NOT NULL, -- Size in bytes
  mime_type TEXT NOT NULL,
  uploaded_by UUID, -- Reference to facility_users or users
  uploaded_by_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_referral_documents_referral_id ON referral_documents(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_documents_uploaded_at ON referral_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_documents_type ON referral_documents(document_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE referral_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role has full access to referral_documents"
  ON referral_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can view documents
CREATE POLICY "Authenticated users can view referral_documents"
  ON referral_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert documents
CREATE POLICY "Authenticated users can insert referral_documents"
  ON referral_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE referral_documents IS 'Stores metadata for documents uploaded with referrals';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ referral_documents table created successfully!';
  RAISE NOTICE '📄 Table supports: medical, insurance, consent, and other document types';
  RAISE NOTICE '🔒 RLS policies enabled for security';
END $$;

