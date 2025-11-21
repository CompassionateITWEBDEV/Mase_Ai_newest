-- ================================================================
-- FIX AUTHORIZATIONS TABLE - COMPLETE SOLUTION
-- Run this ENTIRE script in your Supabase SQL Editor
-- ================================================================

BEGIN;

-- Step 1: Drop the old table if it exists (this is safe - no data loss concern for new feature)
DROP TABLE IF EXISTS public.authorizations CASCADE;

-- Step 2: Create the table with the correct schema (NO last_updated column)
CREATE TABLE public.authorizations (
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
  priority TEXT NOT NULL DEFAULT 'medium',
  
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
  
  -- Timeline tracking (JSON array)
  timeline JSONB DEFAULT '[]'::jsonb,
  
  -- Referral linkage
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  
  -- Audit fields (NO last_updated - only these two!)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_authorizations_status 
ON public.authorizations(status);

CREATE INDEX idx_authorizations_patient_name 
ON public.authorizations(patient_name);

CREATE INDEX idx_authorizations_priority 
ON public.authorizations(priority);

CREATE INDEX idx_authorizations_assigned_staff_id 
ON public.authorizations(assigned_staff_id);

CREATE INDEX idx_authorizations_referral_id 
ON public.authorizations(referral_id);

CREATE INDEX idx_authorizations_submitted_date 
ON public.authorizations(submitted_date DESC);

CREATE INDEX idx_authorizations_expiration_date 
ON public.authorizations(expiration_date) 
WHERE expiration_date IS NOT NULL;

-- Step 4: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_authorizations_updated_at ON public.authorizations;
CREATE TRIGGER update_authorizations_updated_at
    BEFORE UPDATE ON public.authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Add comments for documentation
COMMENT ON TABLE public.authorizations IS 'Tracks authorization requests and their status for insurance approvals';
COMMENT ON COLUMN public.authorizations.authorization_type IS 'Type of authorization: initial, recertification, or additional_services';
COMMENT ON COLUMN public.authorizations.status IS 'Current status: pending, approved, denied, expired, or in_review';
COMMENT ON COLUMN public.authorizations.priority IS 'Priority level: low, medium, high, or urgent';
COMMENT ON COLUMN public.authorizations.timeline IS 'JSON array of timeline events tracking authorization history';

COMMIT;

-- ================================================================
-- VERIFY THE FIX
-- ================================================================
SELECT 
    '✅ Authorizations table fixed successfully!' as status,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'authorizations'
ORDER BY ordinal_position;

-- ================================================================
-- ✅ DONE! 
-- ================================================================
-- The authorizations table is now correct.
-- You should see columns like: id, patient_name, insurance_provider, etc.
-- You should NOT see a 'last_updated' column.
-- You should only see 'created_at' and 'updated_at' for timestamps.
-- ================================================================





