-- Create referrals table for managing incoming referrals
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT NOT NULL,
    referral_date DATE NOT NULL,
    referral_source TEXT NOT NULL, -- "Mercy Hospital", "Fax Upload", "ExtendedCare Network", etc.
    diagnosis TEXT NOT NULL,
    insurance_provider TEXT NOT NULL,
    insurance_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Processing', 'Pending Auth', 'Approved', 'Denied'
    ai_recommendation TEXT, -- 'Approve', 'Deny', 'Review'
    ai_reason TEXT,
    soc_due_date DATE,
    
    -- ExtendedCare specific data (stored as JSONB)
    extendedcare_data JSONB,
    
    -- Eligibility and insurance monitoring
    eligibility_status JSONB,
    insurance_monitoring JSONB,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_date ON public.referrals(referral_date);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_source ON public.referrals(referral_source);
CREATE INDEX IF NOT EXISTS idx_referrals_patient_name ON public.referrals(patient_name);
CREATE INDEX IF NOT EXISTS idx_referrals_insurance_provider ON public.referrals(insurance_provider);

-- Create GIN index for JSONB columns
CREATE INDEX IF NOT EXISTS idx_referrals_extendedcare_data ON public.referrals USING GIN(extendedcare_data);
CREATE INDEX IF NOT EXISTS idx_referrals_eligibility_status ON public.referrals USING GIN(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_referrals_insurance_monitoring ON public.referrals USING GIN(insurance_monitoring);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Staff can view all referrals
CREATE POLICY "Staff can view all referrals" ON public.referrals
    FOR SELECT USING (auth.role() = 'service_role' OR 
                     EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid()));

-- Staff can create referrals
CREATE POLICY "Staff can create referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR 
                          EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid()));

-- Staff can update referrals
CREATE POLICY "Staff can update referrals" ON public.referrals
    FOR UPDATE USING (auth.role() = 'service_role' OR 
                     EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid()));

-- Staff can delete referrals
CREATE POLICY "Staff can delete referrals" ON public.referrals
    FOR DELETE USING (auth.role() = 'service_role' OR 
                     EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid()));

-- Add comments
COMMENT ON TABLE public.referrals IS 'Stores incoming referrals from various sources including ExtendedCare, fax, email, and hospital/clinic referrals';
COMMENT ON COLUMN public.referrals.status IS 'Current status: New, Processing, Pending Auth, Approved, Denied';
COMMENT ON COLUMN public.referrals.ai_recommendation IS 'AI-powered recommendation: Approve, Deny, or Review';
COMMENT ON COLUMN public.referrals.extendedcare_data IS 'JSONB field storing ExtendedCare network specific information';
COMMENT ON COLUMN public.referrals.eligibility_status IS 'JSONB field storing eligibility check results and history';
COMMENT ON COLUMN public.referrals.insurance_monitoring IS 'JSONB field storing insurance monitoring status and history';

