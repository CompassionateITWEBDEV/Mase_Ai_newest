-- Create physicians table for ordering physician management and CAQH verification
CREATE TABLE IF NOT EXISTS public.physicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic physician information
    npi TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialty TEXT,
    
    -- License information
    license_number TEXT,
    license_state TEXT,
    license_expiration DATE,
    
    -- CAQH verification
    caqh_id TEXT,
    verification_status TEXT DEFAULT 'not_verified', -- verified, pending, expired, error, not_verified
    last_verified DATE,
    
    -- Board certification
    board_certification TEXT,
    board_expiration DATE,
    
    -- Insurance and DEA
    malpractice_insurance BOOLEAN DEFAULT false,
    malpractice_expiration DATE,
    dea_number TEXT,
    dea_expiration DATE,
    
    -- Affiliations and notes
    hospital_affiliations TEXT[],
    notes TEXT,
    
    -- Audit fields
    added_by TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_physicians_npi ON public.physicians(npi);
CREATE INDEX IF NOT EXISTS idx_physicians_last_name ON public.physicians(last_name);
CREATE INDEX IF NOT EXISTS idx_physicians_verification_status ON public.physicians(verification_status);
CREATE INDEX IF NOT EXISTS idx_physicians_license_expiration ON public.physicians(license_expiration);
CREATE INDEX IF NOT EXISTS idx_physicians_is_active ON public.physicians(is_active);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_physicians_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_physicians_updated_at
    BEFORE UPDATE ON public.physicians
    FOR EACH ROW
    EXECUTE FUNCTION update_physicians_updated_at();

-- Add some sample data for testing
INSERT INTO public.physicians (
    npi, first_name, last_name, specialty, license_number, license_state, license_expiration,
    caqh_id, verification_status, last_verified, board_certification, board_expiration,
    malpractice_insurance, malpractice_expiration, dea_number, dea_expiration,
    hospital_affiliations, notes, added_by
) VALUES 
(
    '1234567890',
    'Dr. Sarah',
    'Johnson',
    'Internal Medicine',
    'MD123456',
    'MI',
    '2026-12-31',
    'CAQH123456',
    'verified',
    CURRENT_DATE,
    'Internal Medicine',
    '2027-06-30',
    true,
    '2026-08-15',
    'BJ1234567',
    '2027-03-20',
    ARRAY['Henry Ford Hospital', 'Beaumont Hospital'],
    'Primary care physician for home health patients',
    'Admin User'
),
(
    '0987654321',
    'Dr. Michael',
    'Chen',
    'Cardiology',
    'MD789012',
    'MI',
    '2025-03-15',
    NULL,
    'expired',
    '2024-12-01',
    'Cardiovascular Disease',
    '2026-12-31',
    true,
    '2026-11-30',
    NULL,
    NULL,
    ARRAY['University of Michigan Hospital'],
    'Specialist for cardiac patients',
    'Clinical Director'
),
(
    '1122334455',
    'Dr. Emily',
    'Rodriguez',
    'Family Medicine',
    'MD345678',
    'MI',
    '2027-09-30',
    NULL,
    'pending',
    NULL,
    'Family Medicine',
    '2027-04-15',
    true,
    '2026-07-31',
    NULL,
    NULL,
    ARRAY['McLaren Health Care'],
    'Recently added physician',
    'HR Manager'
)
ON CONFLICT (npi) DO NOTHING;






