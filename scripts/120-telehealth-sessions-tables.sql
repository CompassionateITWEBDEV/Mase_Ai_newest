-- =====================================================
-- TELEHEALTH VIDEO CONSULTATION SYSTEM
-- =====================================================
-- Creates tables for doctor-nurse video consultations
-- Supports Vonage Video API integration
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS telehealth_sessions CASCADE;
DROP TABLE IF EXISTS telehealth_consultations CASCADE;

-- =====================================================
-- CONSULTATIONS TABLE
-- =====================================================
-- Stores consultation requests from nurses to doctors
CREATE TABLE telehealth_consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_initials TEXT,
  patient_age INTEGER,
  nurse_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  nurse_name TEXT NOT NULL,
  doctor_id UUID, -- Will be set when doctor accepts
  doctor_name TEXT,
  
  -- Consultation Details
  reason_for_consult TEXT NOT NULL,
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  symptoms JSONB DEFAULT '[]'::jsonb,
  vital_signs JSONB DEFAULT '{}'::jsonb,
  
  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')),
  
  -- Clinical Information
  chief_complaint TEXT,
  doctor_notes TEXT,
  orders_given TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  
  -- Compensation
  estimated_duration INTEGER DEFAULT 15, -- minutes
  compensation_amount DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Metadata
  cancellation_reason TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT
);

-- =====================================================
-- VIDEO SESSIONS TABLE
-- =====================================================
-- Stores Vonage Video API session data
CREATE TABLE telehealth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to consultation
  consultation_id UUID REFERENCES telehealth_consultations(id) ON DELETE CASCADE,
  
  -- Vonage Video API Data
  session_id TEXT NOT NULL UNIQUE,
  nurse_token TEXT NOT NULL,
  doctor_token TEXT NOT NULL,
  
  -- Participants
  nurse_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  doctor_id UUID,
  
  -- Session Status
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'active', 'ended', 'failed')),
  
  -- Recording
  recording_enabled BOOLEAN DEFAULT false,
  recording_id TEXT,
  recording_url TEXT,
  
  -- Metrics
  duration_seconds INTEGER,
  connection_quality TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  error_code TEXT
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Consultations indexes
CREATE INDEX idx_consultations_status ON telehealth_consultations(status);
CREATE INDEX idx_consultations_nurse ON telehealth_consultations(nurse_id);
CREATE INDEX idx_consultations_doctor ON telehealth_consultations(doctor_id);
CREATE INDEX idx_consultations_patient ON telehealth_consultations(patient_id);
CREATE INDEX idx_consultations_urgency ON telehealth_consultations(urgency_level);
CREATE INDEX idx_consultations_created ON telehealth_consultations(created_at DESC);
CREATE INDEX idx_consultations_pending ON telehealth_consultations(status) WHERE status = 'pending';

-- Sessions indexes
CREATE INDEX idx_sessions_consultation ON telehealth_sessions(consultation_id);
CREATE INDEX idx_sessions_status ON telehealth_sessions(status);
CREATE INDEX idx_sessions_nurse ON telehealth_sessions(nurse_id);
CREATE INDEX idx_sessions_doctor ON telehealth_sessions(doctor_id);
CREATE INDEX idx_sessions_created ON telehealth_sessions(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE telehealth_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE telehealth_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Nurses can see their own consultations
CREATE POLICY "Nurses can view their consultations"
  ON telehealth_consultations
  FOR SELECT
  USING (
    nurse_id = auth.uid()
    OR doctor_id = auth.uid()
  );

-- Policy: Nurses can create consultations
CREATE POLICY "Nurses can create consultations"
  ON telehealth_consultations
  FOR INSERT
  WITH CHECK (nurse_id = auth.uid());

-- Policy: Nurses and doctors can update consultations
CREATE POLICY "Participants can update consultations"
  ON telehealth_consultations
  FOR UPDATE
  USING (
    nurse_id = auth.uid()
    OR doctor_id = auth.uid()
  );

-- Policy: Doctors can see pending consultations
CREATE POLICY "Doctors can view pending consultations"
  ON telehealth_consultations
  FOR SELECT
  USING (status = 'pending' OR doctor_id = auth.uid());

-- Policy: Sessions visible to participants
CREATE POLICY "Participants can view sessions"
  ON telehealth_sessions
  FOR SELECT
  USING (
    nurse_id = auth.uid()
    OR doctor_id = auth.uid()
  );

-- Policy: Service role can manage everything
CREATE POLICY "Service role full access consultations"
  ON telehealth_consultations
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access sessions"
  ON telehealth_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-update consultation status
CREATE OR REPLACE FUNCTION update_consultation_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    NEW.accepted_at = NOW();
  ELSIF NEW.status = 'in_progress' AND OLD.status = 'accepted' THEN
    NEW.started_at = NOW();
  ELSIF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status = 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for consultation timestamps
CREATE TRIGGER consultation_status_timestamps
  BEFORE UPDATE ON telehealth_consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_consultation_timestamps();

-- Function to calculate session duration
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for session duration
CREATE TRIGGER session_duration_calculation
  BEFORE UPDATE ON telehealth_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

-- =====================================================
-- SAMPLE DATA (for testing) - OPTIONAL
-- =====================================================

-- Uncomment to insert a sample pending consultation
-- Note: Replace 'nurse-uuid-here' with an actual nurse ID from your staff table

/*
INSERT INTO telehealth_consultations (
  patient_name,
  patient_initials,
  patient_age,
  nurse_id,
  nurse_name,
  reason_for_consult,
  urgency_level,
  symptoms,
  vital_signs,
  chief_complaint,
  estimated_duration,
  compensation_amount
) VALUES (
  'John Doe',
  'J.D.',
  67,
  'nurse-uuid-here', -- Replace with actual nurse ID
  'Sarah Johnson',
  'Patient experiencing chest pain and shortness of breath',
  'high',
  '["Chest pain", "Shortness of breath", "Dizziness", "Nausea"]'::jsonb,
  '{"bloodPressure": "160/95", "heartRate": 98, "temperature": 99.2, "oxygenSaturation": 94}'::jsonb,
  'Acute chest pain with respiratory distress',
  15,
  125.00
);
*/

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON telehealth_consultations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON telehealth_sessions TO authenticated;
GRANT SELECT ON telehealth_consultations TO anon;
GRANT SELECT ON telehealth_sessions TO anon;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE telehealth_consultations IS 'Stores emergency consultation requests from nurses to doctors';
COMMENT ON TABLE telehealth_sessions IS 'Stores Vonage Video API session data for video calls';
COMMENT ON COLUMN telehealth_consultations.urgency_level IS 'low, medium, high, or critical';
COMMENT ON COLUMN telehealth_consultations.status IS 'pending, accepted, in_progress, completed, cancelled, rejected';
COMMENT ON COLUMN telehealth_sessions.session_id IS 'Vonage Video API session ID';
COMMENT ON COLUMN telehealth_sessions.nurse_token IS 'Vonage token for nurse to join session';
COMMENT ON COLUMN telehealth_sessions.doctor_token IS 'Vonage token for doctor to join session';

