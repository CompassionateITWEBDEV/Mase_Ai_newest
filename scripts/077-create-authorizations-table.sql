-- ================================================================
-- CREATE AUTHORIZATIONS TABLE
-- Complete schema for authorization tracking
-- ================================================================

BEGIN;

-- Create authorizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.authorizations (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Patient information
  patient_name TEXT NOT NULL,
  patient_id TEXT,
  
  -- Insurance information
  insurance_provider TEXT NOT NULL,
  insurance_id TEXT NOT NULL,
  
  -- Authorization details
  authorization_type TEXT NOT NULL DEFAULT 'initial',
  -- Options: initial, recertification, additional_services
  
  authorization_number TEXT,
  
  -- Services
  requested_services TEXT[] NOT NULL DEFAULT '{}',
  approved_services TEXT[] DEFAULT '{}',
  approved_visits INTEGER,
  
  -- Diagnosis
  diagnosis_code TEXT,
  diagnosis TEXT NOT NULL,
  
  -- Status and priority
  status TEXT NOT NULL DEFAULT 'pending',
  -- Options: pending, approved, denied, expired, in_review
  
  priority TEXT NOT NULL DEFAULT 'medium',
  -- Options: low, medium, high, urgent
  
  -- Dates
  submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  response_date DATE,
  expiration_date DATE,
  
  -- Financial
  estimated_reimbursement DECIMAL(10, 2) DEFAULT 0,
  actual_reimbursement DECIMAL(10, 2),
  
  -- Assignment
  assigned_to TEXT,
  assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  
  -- Notes and reasons
  denial_reason TEXT,
  reviewer_notes TEXT,
  
  -- Timeline tracking
  timeline JSONB DEFAULT '[]'::jsonb,
  -- Array of timeline events: [{date, action, user, notes}]
  
  -- Referral linkage
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_authorizations_status 
ON public.authorizations(status);

CREATE INDEX IF NOT EXISTS idx_authorizations_patient_name 
ON public.authorizations(patient_name);

CREATE INDEX IF NOT EXISTS idx_authorizations_priority 
ON public.authorizations(priority);

CREATE INDEX IF NOT EXISTS idx_authorizations_assigned_staff_id 
ON public.authorizations(assigned_staff_id);

CREATE INDEX IF NOT EXISTS idx_authorizations_referral_id 
ON public.authorizations(referral_id);

CREATE INDEX IF NOT EXISTS idx_authorizations_submitted_date 
ON public.authorizations(submitted_date DESC);

CREATE INDEX IF NOT EXISTS idx_authorizations_expiration_date 
ON public.authorizations(expiration_date) 
WHERE expiration_date IS NOT NULL;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_authorizations_updated_at ON public.authorizations;
CREATE TRIGGER update_authorizations_updated_at
    BEFORE UPDATE ON public.authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.authorizations IS 'Tracks authorization requests and their status for insurance approvals';
COMMENT ON COLUMN public.authorizations.authorization_type IS 'Type of authorization: initial, recertification, or additional_services';
COMMENT ON COLUMN public.authorizations.status IS 'Current status: pending, approved, denied, expired, or in_review';
COMMENT ON COLUMN public.authorizations.priority IS 'Priority level: low, medium, high, or urgent';
COMMENT ON COLUMN public.authorizations.timeline IS 'JSON array of timeline events tracking authorization history';
COMMENT ON COLUMN public.authorizations.assigned_staff_id IS 'Foreign key to staff table - ID of staff member assigned to handle this authorization';
COMMENT ON COLUMN public.authorizations.referral_id IS 'Foreign key to referrals table - Links authorization to its originating referral';

COMMIT;

-- ================================================================
-- Verify the table was created
-- ================================================================
SELECT 
    'Authorizations table created successfully' as message,
    COUNT(*) as row_count
FROM public.authorizations;

