-- Clinical Documentation QA System Database Schema
-- This creates all tables needed for OASIS, POC, PO, RN, PT, OT, and evaluation QA

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS qapi_reports CASCADE;
DROP TABLE IF EXISTS chart_reviews CASCADE;
DROP TABLE IF EXISTS qa_analysis CASCADE;
DROP TABLE IF EXISTS clinical_documents CASCADE;
DROP TABLE IF EXISTS doctor_orders CASCADE;
DROP TABLE IF EXISTS oasis_assessments CASCADE;

-- OASIS Assessments Table
CREATE TABLE oasis_assessments (
  id BIGSERIAL PRIMARY KEY,
  upload_id TEXT UNIQUE NOT NULL,
  patient_id TEXT,
  patient_name TEXT,
  mrn TEXT,
  visit_type TEXT,
  payor TEXT,
  visit_date TIMESTAMP,
  clinician_name TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'oasis',
  upload_type TEXT DEFAULT 'financial_optimization',
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  status TEXT DEFAULT 'processing',
  processed_at TIMESTAMP DEFAULT NOW(),
  
  -- Extracted content
  extracted_text TEXT,
  
  -- Clinical data
  primary_diagnosis TEXT,
  secondary_diagnoses TEXT[],
  
  -- AI Analysis results
  suggested_codes JSONB,
  corrections JSONB,
  risk_factors JSONB,
  recommendations JSONB,
  flagged_issues JSONB,
  
  -- Quality metrics
  quality_score INTEGER,
  confidence_score INTEGER,
  completeness_score INTEGER,
  
  -- Financial analysis
  current_revenue DECIMAL(10,2),
  optimized_revenue DECIMAL(10,2),
  revenue_increase DECIMAL(10,2),
  financial_impact JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Doctor Orders Table
CREATE TABLE doctor_orders (
  id BIGSERIAL PRIMARY KEY,
  upload_id TEXT UNIQUE NOT NULL,
  oasis_assessment_id BIGINT REFERENCES oasis_assessments(id) ON DELETE CASCADE,
  patient_id TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  extracted_text TEXT,
  
  -- Comparison with OASIS
  discrepancies JSONB,
  alignment_score INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clinical Documents Table (POC, PO, RN, PT, OT, Evaluations)
CREATE TABLE clinical_documents (
  id BIGSERIAL PRIMARY KEY,
  upload_id TEXT UNIQUE NOT NULL,
  chart_id TEXT NOT NULL, -- Groups documents for the same patient/episode
  document_type TEXT NOT NULL, -- 'poc', 'physician_order', 'rn_note', 'pt_note', 'ot_note', 'evaluation'
  patient_id TEXT,
  patient_name TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  extracted_text TEXT,
  
  -- Document metadata
  document_date TIMESTAMP,
  clinician_name TEXT,
  discipline TEXT,
  
  status TEXT DEFAULT 'processing',
  processed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- QA Analysis Table (stores AI analysis for each document)
CREATE TABLE qa_analysis (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT,
  document_type TEXT NOT NULL, -- 'oasis', 'poc', 'physician_order', etc.
  chart_id TEXT,
  
  -- Quality scores
  quality_score INTEGER,
  compliance_score INTEGER,
  completeness_score INTEGER,
  accuracy_score INTEGER,
  confidence_score INTEGER,
  
  -- Analysis results
  findings JSONB, -- Issues found
  recommendations JSONB, -- Suggested improvements
  missing_elements JSONB, -- Required elements not present
  coding_suggestions JSONB, -- ICD-10, CPT code suggestions
  
  -- Financial impact
  revenue_impact JSONB,
  
  -- Compliance flags
  regulatory_issues JSONB,
  documentation_gaps JSONB,
  
  analyzed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chart Reviews Table (comprehensive review of all documents for a patient)
CREATE TABLE chart_reviews (
  id BIGSERIAL PRIMARY KEY,
  chart_id TEXT UNIQUE NOT NULL,
  patient_id TEXT,
  patient_name TEXT,
  
  -- Document counts
  total_documents INTEGER DEFAULT 0,
  documents_analyzed INTEGER DEFAULT 0,
  
  -- Aggregate scores
  overall_quality_score INTEGER,
  overall_compliance_score INTEGER,
  overall_completeness_score INTEGER,
  
  -- Summary
  critical_issues JSONB,
  recommendations JSONB,
  total_revenue_impact DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'needs_review'
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- QAPI Reports Table (Quality Assurance Performance Improvement)
CREATE TABLE qapi_reports (
  id BIGSERIAL PRIMARY KEY,
  report_id TEXT UNIQUE NOT NULL,
  report_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual', 'ad_hoc'
  report_period_start DATE,
  report_period_end DATE,
  
  -- Metrics
  total_charts_reviewed INTEGER,
  average_quality_score DECIMAL(5,2),
  average_compliance_score DECIMAL(5,2),
  
  -- Trends
  quality_trends JSONB,
  common_issues JSONB,
  improvement_areas JSONB,
  
  -- Financial summary
  total_revenue_opportunity DECIMAL(12,2),
  
  -- Report data
  detailed_findings JSONB,
  action_items JSONB,
  
  generated_by TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_oasis_patient_id ON oasis_assessments(patient_id);
CREATE INDEX idx_oasis_upload_id ON oasis_assessments(upload_id);
CREATE INDEX idx_oasis_status ON oasis_assessments(status);
CREATE INDEX idx_oasis_processed_at ON oasis_assessments(processed_at);

CREATE INDEX idx_doctor_orders_oasis_id ON doctor_orders(oasis_assessment_id);
CREATE INDEX idx_doctor_orders_patient_id ON doctor_orders(patient_id);

CREATE INDEX idx_clinical_docs_chart_id ON clinical_documents(chart_id);
CREATE INDEX idx_clinical_docs_type ON clinical_documents(document_type);
CREATE INDEX idx_clinical_docs_patient_id ON clinical_documents(patient_id);

CREATE INDEX idx_qa_analysis_chart_id ON qa_analysis(chart_id);
CREATE INDEX idx_qa_analysis_doc_type ON qa_analysis(document_type);

CREATE INDEX idx_chart_reviews_chart_id ON chart_reviews(chart_id);
CREATE INDEX idx_chart_reviews_status ON chart_reviews(status);

CREATE INDEX idx_qapi_reports_period ON qapi_reports(report_period_start, report_period_end);

-- Enable Row Level Security (RLS)
ALTER TABLE oasis_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE qapi_reports ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON oasis_assessments FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON doctor_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON clinical_documents FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON qa_analysis FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON chart_reviews FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON qapi_reports FOR ALL USING (true);
