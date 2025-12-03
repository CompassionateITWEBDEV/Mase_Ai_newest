-- HR Complaints System Database Schema
-- Create table for storing HR complaints with proper access controls

-- Drop existing table if exists
DROP TABLE IF EXISTS hr_complaints CASCADE;
DROP TABLE IF EXISTS complaint_notes CASCADE;
DROP TABLE IF EXISTS complaint_attachments CASCADE;

-- Main HR Complaints Table
CREATE TABLE hr_complaints (
  id BIGSERIAL PRIMARY KEY,
  complaint_id TEXT UNIQUE NOT NULL, -- HR-XXXX format
  
  -- Complaint Details
  type TEXT NOT NULL, -- harassment, discrimination, safety, policy-violation, retaliation, ethics, other
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  date_of_incident DATE,
  urgency TEXT DEFAULT 'medium', -- low, medium, high
  
  -- Submitter Information
  submitted_by_id UUID REFERENCES auth.users(id),
  submitted_by_name TEXT,
  submitted_by_role TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  
  -- Witnesses
  witnesses_present BOOLEAN DEFAULT FALSE,
  witness_details TEXT,
  
  -- Actions and Outcomes
  actions_taken TEXT,
  desired_outcome TEXT,
  
  -- Assignment and Status
  status TEXT DEFAULT 'pending', -- pending, under-investigation, resolved, closed
  assigned_to_id UUID REFERENCES auth.users(id),
  assigned_to_name TEXT,
  assigned_to_role TEXT,
  
  -- Resolution
  resolution TEXT,
  resolution_date TIMESTAMP,
  
  -- Tracking
  tracking_number TEXT UNIQUE,
  
  -- Timestamps
  submitted_date TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Complaint Investigation Notes Table
CREATE TABLE complaint_notes (
  id BIGSERIAL PRIMARY KEY,
  complaint_id BIGINT REFERENCES hr_complaints(id) ON DELETE CASCADE,
  
  -- Note Details
  note TEXT NOT NULL,
  action_type TEXT, -- received, assigned, investigation-started, interview-scheduled, evidence-gathered, resolved, closed
  
  -- Author
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  author_role TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Complaint Attachments Table
CREATE TABLE complaint_attachments (
  id BIGSERIAL PRIMARY KEY,
  complaint_id BIGINT REFERENCES hr_complaints(id) ON DELETE CASCADE,
  
  -- File Details
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  
  -- Uploader
  uploaded_by_id UUID REFERENCES auth.users(id),
  uploaded_by_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_complaints_status ON hr_complaints(status);
CREATE INDEX idx_complaints_type ON hr_complaints(type);
CREATE INDEX idx_complaints_urgency ON hr_complaints(urgency);
CREATE INDEX idx_complaints_submitted_by ON hr_complaints(submitted_by_id);
CREATE INDEX idx_complaints_assigned_to ON hr_complaints(assigned_to_id);
CREATE INDEX idx_complaints_anonymous ON hr_complaints(anonymous);
CREATE INDEX idx_complaints_tracking ON hr_complaints(tracking_number);
CREATE INDEX idx_complaint_notes_complaint ON complaint_notes(complaint_id);

-- Enable Row Level Security
ALTER TABLE hr_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hr_complaints
-- Users can view their own complaints
CREATE POLICY "Users can view own complaints" ON hr_complaints
  FOR SELECT USING (
    auth.uid() = submitted_by_id OR
    auth.uid() = assigned_to_id OR
    anonymous = false
  );

-- Users can insert complaints
CREATE POLICY "Users can insert complaints" ON hr_complaints
  FOR INSERT WITH CHECK (true);

-- Only assigned personnel can update complaints
CREATE POLICY "Assigned personnel can update complaints" ON hr_complaints
  FOR UPDATE USING (
    auth.uid() = assigned_to_id
  );

-- RLS Policies for complaint_notes
CREATE POLICY "View notes for accessible complaints" ON complaint_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hr_complaints 
      WHERE hr_complaints.id = complaint_notes.complaint_id
      AND (hr_complaints.submitted_by_id = auth.uid() OR hr_complaints.assigned_to_id = auth.uid())
    )
  );

CREATE POLICY "Insert notes for assigned complaints" ON complaint_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM hr_complaints 
      WHERE hr_complaints.id = complaint_notes.complaint_id
      AND hr_complaints.assigned_to_id = auth.uid()
    )
  );

-- Function to generate complaint ID
CREATE OR REPLACE FUNCTION generate_complaint_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.complaint_id := 'HR-' || LPAD(NEW.id::TEXT, 4, '0');
  NEW.tracking_number := 'TRK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate complaint ID
CREATE TRIGGER set_complaint_id
  BEFORE INSERT ON hr_complaints
  FOR EACH ROW
  EXECUTE FUNCTION generate_complaint_id();

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_complaint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated := NOW();
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_complaint_timestamp
  BEFORE UPDATE ON hr_complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_complaint_timestamp();

-- Insert sample data for testing
INSERT INTO hr_complaints (type, subject, description, location, date_of_incident, urgency, submitted_by_name, submitted_by_role, anonymous, status, assigned_to_name, assigned_to_role, witnesses_present, actions_taken)
VALUES 
  ('harassment', 'Inappropriate workplace behavior', 'Experiencing inappropriate comments and behavior from supervisor during team meetings.', 'Conference Room B', '2024-01-10', 'high', 'Jane Smith', 'RN', false, 'under-investigation', 'Sarah Mitchell', 'HR Director', true, 'Documented incidents and spoke with colleague witness'),
  ('safety', 'Inadequate PPE supplies', 'Consistent shortage of N95 masks and gloves in patient care areas.', 'Medical/Surgical Unit', '2024-01-05', 'medium', 'Anonymous', NULL, true, 'pending', NULL, NULL, false, NULL),
  ('discrimination', 'Unfair scheduling practices', 'Believe I am being given unfavorable shifts due to my age compared to younger staff members.', 'Nursing Department', '2024-01-15', 'medium', 'Robert Johnson', 'LPN', false, 'resolved', 'Michael Rodriguez', 'HR Manager', false, NULL);

-- Update the first complaint with resolution
UPDATE hr_complaints SET resolution = 'Scheduling policy reviewed and updated. Training provided to supervisors.', resolution_date = NOW() WHERE type = 'discrimination';

-- Insert sample notes
INSERT INTO complaint_notes (complaint_id, note, action_type, author_name, author_role)
SELECT id, 'Initial complaint received and case opened', 'received', 'System', 'Auto'
FROM hr_complaints WHERE type = 'harassment';

INSERT INTO complaint_notes (complaint_id, note, action_type, author_name, author_role)
SELECT id, 'Interviewed complainant and gathered initial evidence', 'investigation-started', 'Sarah Mitchell', 'HR Director'
FROM hr_complaints WHERE type = 'harassment';


