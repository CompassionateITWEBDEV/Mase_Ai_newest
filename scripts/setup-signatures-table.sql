-- =====================================================
-- SIGNATURE REQUESTS TABLE SETUP
-- =====================================================
-- Run this in your Supabase SQL Editor to create the
-- signature_requests table for digital signatures
-- =====================================================

-- Create signature_requests table
CREATE TABLE IF NOT EXISTS signature_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    document_name TEXT NOT NULL,
    order_id TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'completed', 'cancelled', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by TEXT,
    template_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create signature_recipients table
CREATE TABLE IF NOT EXISTS signature_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'signed', 'declined')),
    signed_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    order_index INTEGER DEFAULT 0,
    signature_data TEXT, -- Base64 encoded signature image
    signer_name TEXT, -- Name entered when signing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns if table already exists (for existing installations)
ALTER TABLE signature_recipients ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE signature_recipients ADD COLUMN IF NOT EXISTS signer_name TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signature_requests_status ON signature_requests(status);
CREATE INDEX IF NOT EXISTS idx_signature_requests_order_id ON signature_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_created_at ON signature_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signature_recipients_request_id ON signature_recipients(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_recipients_email ON signature_recipients(email);

-- Enable Row Level Security
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_recipients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Enable read access for all users" ON signature_requests;
DROP POLICY IF EXISTS "Enable insert for all users" ON signature_requests;
DROP POLICY IF EXISTS "Enable update for all users" ON signature_requests;
DROP POLICY IF EXISTS "Enable delete for all users" ON signature_requests;
DROP POLICY IF EXISTS "Enable read access for all users" ON signature_recipients;
DROP POLICY IF EXISTS "Enable insert for all users" ON signature_recipients;
DROP POLICY IF EXISTS "Enable update for all users" ON signature_recipients;
DROP POLICY IF EXISTS "Enable delete for all users" ON signature_recipients;

-- Create policies for signature_requests
CREATE POLICY "Enable read access for all users" ON signature_requests
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON signature_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON signature_requests
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON signature_requests
    FOR DELETE USING (true);

-- Create policies for signature_recipients
CREATE POLICY "Enable read access for all users" ON signature_recipients
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON signature_recipients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON signature_recipients
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON signature_recipients
    FOR DELETE USING (true);

-- Insert sample data for testing
INSERT INTO signature_requests (request_id, document_name, order_id, status, created_at, sent_at, expires_at)
VALUES 
    ('SIG-SAMPLE-001', 'Employment Agreement - Sarah Johnson', NULL, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days'),
    ('SIG-SAMPLE-002', 'Confidentiality Agreement - Michael Chen', NULL, 'sent', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days'),
    ('SIG-SAMPLE-003', 'HIPAA Agreement - Emily Davis', NULL, 'sent', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', NOW() + INTERVAL '30 days')
ON CONFLICT (request_id) DO NOTHING;

-- Get the IDs of the sample requests and insert recipients
DO $$
DECLARE
    req1_id UUID;
    req2_id UUID;
    req3_id UUID;
BEGIN
    SELECT id INTO req1_id FROM signature_requests WHERE request_id = 'SIG-SAMPLE-001';
    SELECT id INTO req2_id FROM signature_requests WHERE request_id = 'SIG-SAMPLE-002';
    SELECT id INTO req3_id FROM signature_requests WHERE request_id = 'SIG-SAMPLE-003';
    
    -- Recipients for request 1 (completed)
    IF req1_id IS NOT NULL THEN
        INSERT INTO signature_recipients (signature_request_id, name, email, role, status, signed_at, order_index)
        VALUES 
            (req1_id, 'Sarah Johnson', 'sarah.johnson@email.com', 'signer', 'signed', NOW() - INTERVAL '2 days', 1),
            (req1_id, 'HR Manager', 'hr@serenityrehab.com', 'signer', 'signed', NOW() - INTERVAL '2 days', 2)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Recipients for request 2 (pending)
    IF req2_id IS NOT NULL THEN
        INSERT INTO signature_recipients (signature_request_id, name, email, role, status, order_index)
        VALUES 
            (req2_id, 'Michael Chen', 'michael.chen@email.com', 'signer', 'pending', 1),
            (req2_id, 'HR Manager', 'hr@serenityrehab.com', 'signer', 'pending', 2)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Recipients for request 3 (viewed)
    IF req3_id IS NOT NULL THEN
        INSERT INTO signature_recipients (signature_request_id, name, email, role, status, viewed_at, order_index)
        VALUES 
            (req3_id, 'Emily Davis', 'emily.davis@email.com', 'signer', 'viewed', NOW() - INTERVAL '6 hours', 1),
            (req3_id, 'HR Manager', 'hr@serenityrehab.com', 'signer', 'pending', NULL, 2)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Update the first request to completed since all signed
UPDATE signature_requests 
SET completed_at = NOW() - INTERVAL '2 days'
WHERE request_id = 'SIG-SAMPLE-001';

SELECT 'Signature tables created successfully!' as message;

