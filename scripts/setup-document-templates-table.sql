-- =====================================================
-- DOCUMENT TEMPLATES TABLE SETUP
-- =====================================================
-- Run this in your Supabase SQL Editor to create the
-- document_templates table for signature templates
-- =====================================================

-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    fields JSONB DEFAULT '[]'::jsonb,
    content TEXT, -- HTML/Markdown template content
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active);

-- Enable Row Level Security
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON document_templates;
DROP POLICY IF EXISTS "Enable insert for all users" ON document_templates;
DROP POLICY IF EXISTS "Enable update for all users" ON document_templates;
DROP POLICY IF EXISTS "Enable delete for all users" ON document_templates;

-- Create policies
CREATE POLICY "Enable read access for all users" ON document_templates
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON document_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON document_templates
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON document_templates
    FOR DELETE USING (true);

-- Insert default templates
INSERT INTO document_templates (template_id, name, description, category, fields)
VALUES 
    (
        'TEMP-001',
        'Employment Agreement',
        'Standard employment contract template for new hires',
        'HR',
        '[{"name": "Employee Name", "type": "text", "required": true}, {"name": "Position", "type": "text", "required": true}, {"name": "Start Date", "type": "date", "required": true}, {"name": "Salary", "type": "text", "required": true}, {"name": "Employee Signature", "type": "signature", "required": true}, {"name": "HR Signature", "type": "signature", "required": true}]'::jsonb
    ),
    (
        'TEMP-002',
        'Confidentiality Agreement',
        'Non-disclosure and confidentiality agreement for employees',
        'Legal',
        '[{"name": "Employee Name", "type": "text", "required": true}, {"name": "Department", "type": "text", "required": true}, {"name": "Effective Date", "type": "date", "required": true}, {"name": "Employee Signature", "type": "signature", "required": true}]'::jsonb
    ),
    (
        'TEMP-003',
        'Healthcare Order',
        'Physician signature for healthcare orders from Order Management',
        'Healthcare',
        '[{"name": "Patient Name", "type": "text", "required": true}, {"name": "Order Type", "type": "text", "required": true}, {"name": "Order Date", "type": "date", "required": true}, {"name": "Physician Signature", "type": "signature", "required": true}]'::jsonb
    ),
    (
        'TEMP-004',
        'HIPAA Agreement',
        'HIPAA privacy and security compliance agreement',
        'Compliance',
        '[{"name": "Employee Name", "type": "text", "required": true}, {"name": "Position", "type": "text", "required": true}, {"name": "Training Date", "type": "date", "required": true}, {"name": "Employee Signature", "type": "signature", "required": true}]'::jsonb
    ),
    (
        'TEMP-005',
        'Performance Evaluation',
        'Annual performance review and evaluation form',
        'HR',
        '[{"name": "Employee Name", "type": "text", "required": true}, {"name": "Supervisor", "type": "text", "required": true}, {"name": "Review Period", "type": "text", "required": true}, {"name": "Goals", "type": "textarea", "required": false}, {"name": "Employee Signature", "type": "signature", "required": true}, {"name": "Supervisor Signature", "type": "signature", "required": true}]'::jsonb
    )
ON CONFLICT (template_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    fields = EXCLUDED.fields,
    updated_at = NOW();

SELECT 'Document templates table created successfully!' as message;

