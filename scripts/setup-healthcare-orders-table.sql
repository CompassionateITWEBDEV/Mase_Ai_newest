-- =====================================================
-- HEALTHCARE ORDERS TABLE SETUP
-- =====================================================
-- Run this in your Supabase SQL Editor to create the
-- healthcare_orders table for Order Management
-- =====================================================

-- Create healthcare_orders table
CREATE TABLE IF NOT EXISTS healthcare_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    axxess_order_id TEXT,
    patient_name TEXT NOT NULL,
    patient_id TEXT,
    order_type TEXT,
    physician TEXT,
    date_received DATE,
    status TEXT DEFAULT 'pending_qa' CHECK (status IN ('pending_qa', 'qa_approved', 'qa_rejected', 'pending_signature', 'signed', 'completed')),
    priority TEXT DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
    qa_reviewer TEXT,
    qa_date TIMESTAMPTZ,
    qa_comments TEXT,
    signature_status TEXT CHECK (signature_status IN ('pending', 'signed', 'expired')),
    signature_request_id TEXT,
    services JSONB DEFAULT '[]'::jsonb,
    insurance_type TEXT,
    estimated_value DECIMAL(10,2) DEFAULT 0,
    chart_id TEXT,
    quality_score INTEGER,
    qa_completed_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    signed_by TEXT,
    signature_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_healthcare_orders_status ON healthcare_orders(status);
CREATE INDEX IF NOT EXISTS idx_healthcare_orders_patient ON healthcare_orders(patient_name);
CREATE INDEX IF NOT EXISTS idx_healthcare_orders_physician ON healthcare_orders(physician);
CREATE INDEX IF NOT EXISTS idx_healthcare_orders_created ON healthcare_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_healthcare_orders_signature ON healthcare_orders(signature_request_id);

-- Enable Row Level Security
ALTER TABLE healthcare_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON healthcare_orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON healthcare_orders;
DROP POLICY IF EXISTS "Enable update for all users" ON healthcare_orders;
DROP POLICY IF EXISTS "Enable delete for all users" ON healthcare_orders;

-- Create policies
CREATE POLICY "Enable read access for all users" ON healthcare_orders
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON healthcare_orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON healthcare_orders
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON healthcare_orders
    FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_healthcare_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS healthcare_orders_updated_at ON healthcare_orders;
CREATE TRIGGER healthcare_orders_updated_at
    BEFORE UPDATE ON healthcare_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_healthcare_orders_updated_at();

-- Insert sample data for testing
INSERT INTO healthcare_orders (order_id, axxess_order_id, patient_name, patient_id, order_type, physician, date_received, status, priority, services, insurance_type, estimated_value)
VALUES 
    ('ORD-001', 'AXX-2024-001', 'John Smith', 'P-12345', 'Home Health', 'Dr. Sarah Johnson', NOW() - INTERVAL '2 days', 'pending_qa', 'routine', '["Skilled Nursing", "Physical Therapy"]'::jsonb, 'Medicare', 1250.00),
    ('ORD-002', 'AXX-2024-002', 'Maria Garcia', 'P-12346', 'Hospice', 'Dr. Michael Chen', NOW() - INTERVAL '1 day', 'pending_qa', 'urgent', '["Hospice Care", "Pain Management"]'::jsonb, 'Medicaid', 2100.00),
    ('ORD-003', 'AXX-2024-003', 'Robert Wilson', 'P-12347', 'Home Health', 'Dr. Emily Brown', NOW(), 'qa_approved', 'routine', '["Occupational Therapy", "Speech Therapy"]'::jsonb, 'Private Insurance', 1800.00),
    ('ORD-004', 'AXX-2024-004', 'Linda Davis', 'P-12348', 'Home Health', 'Dr. James Wilson', NOW() - INTERVAL '3 days', 'pending_signature', 'stat', '["Skilled Nursing", "Wound Care"]'::jsonb, 'Medicare', 950.00),
    ('ORD-005', 'AXX-2024-005', 'James Brown', 'P-12349', 'Hospice', 'Dr. Lisa Anderson', NOW() - INTERVAL '5 days', 'signed', 'routine', '["Hospice Care", "Social Services"]'::jsonb, 'Medicare', 3200.00)
ON CONFLICT (order_id) DO UPDATE SET
    patient_name = EXCLUDED.patient_name,
    status = EXCLUDED.status,
    updated_at = NOW();

SELECT 'Healthcare orders table created successfully!' as message;

