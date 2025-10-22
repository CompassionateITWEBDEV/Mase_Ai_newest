-- Create OASIS assessments table
CREATE TABLE IF NOT EXISTS oasis_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id TEXT UNIQUE NOT NULL,
  patient_id TEXT,
  patient_name TEXT,
  mrn TEXT,
  visit_type TEXT,
  payor TEXT,
  visit_date TIMESTAMP,
  clinician_name TEXT,
  
  -- File information
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  
  -- Upload metadata
  upload_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  notes TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  
  -- Processing status
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMP,
  
  -- AI Analysis results
  extracted_text TEXT,
  primary_diagnosis JSONB,
  secondary_diagnoses JSONB,
  suggested_codes JSONB,
  corrections JSONB,
  risk_factors JSONB,
  recommendations JSONB,
  flagged_issues JSONB,
  
  -- Quality metrics
  quality_score NUMERIC(5,2),
  confidence_score NUMERIC(5,2),
  completeness_score NUMERIC(5,2),
  
  -- Financial analysis
  current_revenue NUMERIC(10,2),
  optimized_revenue NUMERIC(10,2),
  revenue_increase NUMERIC(10,2),
  financial_impact JSONB,
  
  -- Workflow
  reviewer_id TEXT,
  review_status TEXT,
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  next_steps JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create doctor orders table
CREATE TABLE IF NOT EXISTS doctor_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES oasis_assessments(id) ON DELETE CASCADE,
  upload_id TEXT UNIQUE NOT NULL,
  
  -- File information
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  
  -- Order details
  order_date TIMESTAMP,
  ordering_physician TEXT,
  physician_npi TEXT,
  order_type TEXT,
  
  -- Extracted content
  extracted_text TEXT,
  diagnoses JSONB,
  medications JSONB,
  treatments JSONB,
  frequency TEXT,
  duration TEXT,
  
  -- Verification
  matches_oasis BOOLEAN,
  discrepancies JSONB,
  verification_notes TEXT,
  
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_oasis_upload_id ON oasis_assessments(upload_id);
CREATE INDEX IF NOT EXISTS idx_oasis_patient_id ON oasis_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_oasis_status ON oasis_assessments(status);
CREATE INDEX IF NOT EXISTS idx_oasis_uploaded_at ON oasis_assessments(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_orders_assessment_id ON doctor_orders(assessment_id);
CREATE INDEX IF NOT EXISTS idx_doctor_orders_upload_id ON doctor_orders(upload_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oasis_assessments_updated_at BEFORE UPDATE ON oasis_assessments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_orders_updated_at BEFORE UPDATE ON doctor_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
