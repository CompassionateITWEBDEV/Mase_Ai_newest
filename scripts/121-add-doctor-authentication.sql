-- =====================================================
-- DOCTOR AUTHENTICATION SYSTEM
-- =====================================================
-- Extends physicians table to support telehealth doctor login
-- =====================================================

-- Add authentication and telehealth fields to physicians table
ALTER TABLE physicians 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS telehealth_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS availability_mode TEXT DEFAULT 'immediate' CHECK (availability_mode IN ('immediate', 'scheduled', 'both')),
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 125.00,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS total_consultations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_physicians_email ON physicians(email);
CREATE INDEX IF NOT EXISTS idx_physicians_is_available ON physicians(is_available);
CREATE INDEX IF NOT EXISTS idx_physicians_telehealth_enabled ON physicians(telehealth_enabled);

-- Add comments for documentation
COMMENT ON COLUMN physicians.email IS 'Doctor email for login authentication';
COMMENT ON COLUMN physicians.password_hash IS 'Hashed password for authentication';
COMMENT ON COLUMN physicians.is_available IS 'Whether doctor is currently available for consultations';
COMMENT ON COLUMN physicians.telehealth_enabled IS 'Whether doctor participates in telehealth consultations';
COMMENT ON COLUMN physicians.availability_mode IS 'immediate, scheduled, or both';
COMMENT ON COLUMN physicians.hourly_rate IS 'Compensation rate per consultation';
COMMENT ON COLUMN physicians.total_consultations IS 'Total number of consultations completed';
COMMENT ON COLUMN physicians.average_rating IS 'Average rating from nurses/patients';

-- Update existing physicians to have telehealth enabled
UPDATE physicians 
SET telehealth_enabled = true, 
    is_available = false,
    availability_mode = 'immediate'
WHERE telehealth_enabled IS NULL;

-- =====================================================
-- SAMPLE DOCTOR FOR TESTING (Optional)
-- =====================================================
-- Uncomment to add a test doctor account

/*
INSERT INTO physicians (
  npi,
  first_name,
  last_name,
  email,
  password_hash,
  specialty,
  license_number,
  license_state,
  license_expiration,
  dea_number,
  years_experience,
  bio,
  telehealth_enabled,
  is_available,
  availability_mode,
  hourly_rate,
  is_active
) VALUES (
  '9999999999',
  'John',
  'Smith',
  'doctor@test.com',
  'password123', -- TODO: Hash in production
  'Emergency Medicine',
  'MD999999',
  'MI',
  '2027-12-31',
  'BS9999999',
  15,
  'Board-certified emergency medicine physician with 15 years of experience in urgent care and telehealth consultations.',
  true,
  true,
  'immediate',
  150.00,
  true
) ON CONFLICT (npi) DO NOTHING;
*/

-- =====================================================
-- GRANTS
-- =====================================================

-- Allow authenticated users to read physicians (for doctor portal)
GRANT SELECT ON physicians TO authenticated;
GRANT SELECT ON physicians TO anon;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Doctor authentication fields added successfully!';
  RAISE NOTICE '📋 Physicians table now supports telehealth doctor login';
  RAISE NOTICE '🔐 Doctors can now register and login via /doctor-portal';
END $$;

