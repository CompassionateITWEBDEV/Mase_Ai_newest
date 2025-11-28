-- Migration: Add QA fields to clinical_documents table
-- This adds upload_type, priority, and notes columns to support QA type selection

-- Add upload_type column (stores the selected QA type: 'comprehensive-qa', 'coding-review', 'financial-optimization', 'qapi-audit')
ALTER TABLE clinical_documents 
ADD COLUMN IF NOT EXISTS upload_type TEXT;

-- Add priority column (stores the priority level: 'low', 'medium', 'high', 'urgent')
ALTER TABLE clinical_documents 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Add notes column (stores any additional notes from the upload form)
ALTER TABLE clinical_documents 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clinical_documents.upload_type IS 'QA type selected during upload: comprehensive-qa, coding-review, financial-optimization, qapi-audit';
COMMENT ON COLUMN clinical_documents.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN clinical_documents.notes IS 'Additional notes or comments from the upload form';

-- Create index on upload_type for faster queries
CREATE INDEX IF NOT EXISTS idx_clinical_documents_upload_type ON clinical_documents(upload_type);

-- Create index on priority for faster queries
CREATE INDEX IF NOT EXISTS idx_clinical_documents_priority ON clinical_documents(priority);


