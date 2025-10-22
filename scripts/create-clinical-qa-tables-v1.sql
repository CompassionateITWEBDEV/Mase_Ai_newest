-- Clinical Documentation QA System Tables

-- Main clinical documents table
CREATE TABLE IF NOT EXISTS clinical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id TEXT UNIQUE NOT NULL,
  patient_id TEXT,
  patient_name TEXT,
  mrn TEXT,
  document_type TEXT NOT NULL, -- 'oasis', 'poc', 'physician_order', 'rn_note', 'pt_note', 'ot_note', 'evaluation'
  document_subtype TEXT, -- e.g., 'soc', 'recert', 'discharge' for OASIS
  visit_date TIMESTAMP,
  clinician_name TEXT,
  clinician_type TEXT, -- 'RN', 'PT', 'OT', 'MD', etc.
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  extracted_text TEXT,
  upload_type TEXT, -- 'qa-review', 'coding-review', 'financial-optimization'
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error', 'reviewed'
  uploaded_at TIMESTAMP DEFAULT NOW(),
  uploaded_by TEXT,
  processed_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewer_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- QA Analysis results table
CREATE TABLE IF NOT EXISTS qa_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES clinical_documents(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'coding', 'clinical', 'compliance', 'financial'
  quality_score NUMERIC(5,2),
  confidence_score NUMERIC(5,2),
  completeness_score NUMERIC(5,2),
  accuracy_score NUMERIC(5,2),
  compliance_score NUMERIC(5,2),
  
  -- Clinical findings
  diagnoses JSONB, -- [{code, description, confidence, source}]
  suggested_codes JSONB, -- [{code, description, reason, revenueImpact, confidence}]
  corrections JSONB, -- [{field, current, suggested, reason, impact, revenueChange}]
  missing_elements JSONB, -- [{element, category, severity, recommendation}]
  
  -- Quality findings
  flagged_issues JSONB, -- [{issue, severity, location, suggestion, category}]
  risk_factors JSONB, -- [{factor, severity, recommendation, mitigation}]
  recommendations JSONB, -- [{category, recommendation, priority, expectedImpact}]
  
  -- Financial impact
  current_revenue NUMERIC(10,2),
  optimized_revenue NUMERIC(10,2),
  revenue_increase NUMERIC(10,2),
  financial_breakdown JSONB, -- [{category, current, optimized, difference}]
  
  -- Compliance
  regulatory_issues JSONB, -- [{regulation, issue, severity, remediation}]
  documentation_gaps JSONB, -- [{gap, impact, recommendation}]
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chart review sessions (for comprehensive multi-document QA)
CREATE TABLE IF NOT EXISTS chart_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  patient_name TEXT,
  mrn TEXT,
  review_type TEXT NOT NULL, -- 'comprehensive', 'focused', 'qapi'
  review_period_start DATE,
  review_period_end DATE,
  status TEXT DEFAULT 'in-progress', -- 'in-progress', 'completed', 'approved'
  reviewer_id TEXT,
  reviewer_name TEXT,
  
  -- Overall scores
  overall_quality_score NUMERIC(5,2),
  overall_compliance_score NUMERIC(5,2),
  overall_completeness_score NUMERIC(5,2),
  
  -- Aggregated findings
  total_documents INTEGER DEFAULT 0,
  documents_reviewed INTEGER DEFAULT 0,
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  high_issues INTEGER DEFAULT 0,
  medium_issues INTEGER DEFAULT 0,
  low_issues INTEGER DEFAULT 0,
  
  -- Financial summary
  total_revenue_opportunity NUMERIC(10,2),
  
  -- QAPI metrics
  qapi_metrics JSONB, -- Detailed QAPI metrics and trends
  action_items JSONB, -- [{item, priority, assignee, dueDate, status}]
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Link documents to chart reviews
CREATE TABLE IF NOT EXISTS chart_review_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_review_id UUID REFERENCES chart_reviews(id) ON DELETE CASCADE,
  document_id UUID REFERENCES clinical_documents(id) ON DELETE CASCADE,
  review_status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'approved', 'needs-correction'
  review_notes TEXT,
  added_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  UNIQUE(chart_review_id, document_id)
);

-- QAPI reports
CREATE TABLE IF NOT EXISTS qapi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual', 'ad-hoc'
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  generated_by TEXT,
  
  -- Summary metrics
  total_charts_reviewed INTEGER,
  total_documents_reviewed INTEGER,
  average_quality_score NUMERIC(5,2),
  average_compliance_score NUMERIC(5,2),
  
  -- Trend analysis
  quality_trend JSONB, -- [{period, score, change}]
  compliance_trend JSONB,
  revenue_trend JSONB,
  
  -- Issue analysis
  issue_categories JSONB, -- [{category, count, percentage, trend}]
  top_issues JSONB, -- [{issue, frequency, impact, recommendation}]
  
  -- Financial analysis
  total_revenue_opportunity NUMERIC(10,2),
  revenue_by_category JSONB,
  
  -- Recommendations
  strategic_recommendations JSONB,
  training_needs JSONB,
  process_improvements JSONB,
  
  report_data JSONB, -- Full detailed report data
  
  status TEXT DEFAULT 'draft', -- 'draft', 'final', 'published'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinical_documents_patient ON clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_type ON clinical_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_status ON clinical_documents(status);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_uploaded_at ON clinical_documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_qa_analysis_document ON qa_analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_chart_reviews_patient ON chart_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_chart_reviews_status ON chart_reviews(status);
CREATE INDEX IF NOT EXISTS idx_qapi_reports_period ON qapi_reports(report_period_start, report_period_end);
