-- ================================================================
-- MARKETING REFERRALS TABLE
-- ================================================================
-- This table stores referrals submitted via the Referral Intake page
-- Used for marketing tracking and intelligent routing to Serenity/CHHS/MASE
-- ================================================================

-- Create marketing_referrals table
CREATE TABLE IF NOT EXISTS public.marketing_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_number TEXT NOT NULL UNIQUE,
    
    -- Facility Information
    facility_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    
    -- Patient Information (HIPAA compliant - can use full names here as this is intake)
    patient_name TEXT NOT NULL,
    patient_age TEXT,
    
    -- Referral Details
    service_needed TEXT NOT NULL,
    urgency_level TEXT NOT NULL DEFAULT 'routine', -- 'routine', 'urgent', 'stat'
    referral_date DATE NOT NULL DEFAULT CURRENT_DATE,
    insurance_type TEXT,
    notes TEXT,
    
    -- Marketing Tracking
    referred_by TEXT NOT NULL, -- Marketer name
    source TEXT, -- 'qr', 'link', 'direct', 'phone'
    facility_id TEXT, -- From QR code or link
    
    -- Routing Information
    routing_destination TEXT NOT NULL, -- 'serenity', 'chhs', 'general'
    organization_name TEXT NOT NULL, -- 'Serenity', 'CHHS', 'M.A.S.E. Pro'
    
    -- Status Tracking
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'scheduled', 'admitted', 'declined', 'cancelled'
    status_updated_at TIMESTAMP WITH TIME ZONE,
    assigned_to TEXT, -- Staff member handling this referral
    
    -- Follow-up tracking
    contact_attempts INTEGER DEFAULT 0,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date DATE,
    
    -- Conversion tracking
    converted_to_referral_id UUID, -- Links to main referrals table if converted
    conversion_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_marketing_referrals_facility_name ON public.marketing_referrals(facility_name);
CREATE INDEX IF NOT EXISTS idx_marketing_referrals_referred_by ON public.marketing_referrals(referred_by);
CREATE INDEX IF NOT EXISTS idx_marketing_referrals_status ON public.marketing_referrals(status);
CREATE INDEX IF NOT EXISTS idx_marketing_referrals_routing ON public.marketing_referrals(routing_destination);
CREATE INDEX IF NOT EXISTS idx_marketing_referrals_urgency ON public.marketing_referrals(urgency_level);
CREATE INDEX IF NOT EXISTS idx_marketing_referrals_created_at ON public.marketing_referrals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_referrals_referral_date ON public.marketing_referrals(referral_date DESC);

-- Create function to generate unique referral numbers
CREATE OR REPLACE FUNCTION generate_marketing_referral_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_number := 'MKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM public.marketing_referrals WHERE referral_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
        
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique referral number';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate referral number
CREATE OR REPLACE FUNCTION set_marketing_referral_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_number IS NULL OR NEW.referral_number = '' THEN
        NEW.referral_number := generate_marketing_referral_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_marketing_referral_number ON public.marketing_referrals;
CREATE TRIGGER trigger_set_marketing_referral_number
    BEFORE INSERT ON public.marketing_referrals
    FOR EACH ROW
    EXECUTE FUNCTION set_marketing_referral_number();

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_marketing_referrals_updated_at ON public.marketing_referrals;
CREATE TRIGGER update_marketing_referrals_updated_at
    BEFORE UPDATE ON public.marketing_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update status_updated_at when status changes
CREATE OR REPLACE FUNCTION update_marketing_referral_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.status_updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_status_timestamp ON public.marketing_referrals;
CREATE TRIGGER trigger_update_status_timestamp
    BEFORE UPDATE ON public.marketing_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_marketing_referral_status_timestamp();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.marketing_referrals ENABLE ROW LEVEL SECURITY;

-- Policy for viewing marketing referrals (all authenticated users)
CREATE POLICY "Anyone can view marketing referrals" ON public.marketing_referrals
    FOR SELECT USING (true);

-- Policy for inserting marketing referrals (anyone can submit)
CREATE POLICY "Anyone can insert marketing referrals" ON public.marketing_referrals
    FOR INSERT WITH CHECK (true);

-- Policy for updating marketing referrals (authenticated users)
CREATE POLICY "Anyone can update marketing referrals" ON public.marketing_referrals
    FOR UPDATE USING (true);

-- Service role has full access
CREATE POLICY "Service role has full access to marketing referrals" ON public.marketing_referrals
    FOR ALL TO service_role
    USING (TRUE) WITH CHECK (TRUE);

-- ================================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================================

-- Insert a few sample marketing referrals
INSERT INTO public.marketing_referrals 
(facility_name, contact_name, contact_phone, contact_email, patient_name, patient_age, 
 service_needed, urgency_level, referred_by, source, routing_destination, organization_name, status)
VALUES
('Mercy General Hospital', 'John Smith', '555-0101', 'jsmith@mercy.com', 'Jane Doe', '65', 
 'home-health', 'routine', 'Sarah Johnson', 'qr', 'chhs', 'CHHS', 'new'),
 
('Lakeside Behavioral Center', 'Emily Brown', '555-0102', 'ebrown@lakeside.com', 'Robert Wilson', '42', 
 'behavioral', 'urgent', 'Mike Davis', 'link', 'serenity', 'Serenity', 'contacted'),
 
('Riverside Medical Center', 'David Lee', '555-0103', 'dlee@riverside.com', 'Mary Johnson', '78', 
 'skilled-nursing', 'stat', 'Sarah Johnson', 'direct', 'chhs', 'CHHS', 'scheduled')
ON CONFLICT (referral_number) DO NOTHING;

-- ================================================================
-- VIEWS FOR ANALYTICS
-- ================================================================

-- View for referral statistics by marketer
CREATE OR REPLACE VIEW marketing_referral_stats AS
SELECT 
    referred_by,
    COUNT(*) as total_referrals,
    COUNT(*) FILTER (WHERE status = 'new') as new_referrals,
    COUNT(*) FILTER (WHERE status = 'contacted') as contacted_referrals,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_referrals,
    COUNT(*) FILTER (WHERE status = 'admitted') as admitted_referrals,
    COUNT(*) FILTER (WHERE converted_to_referral_id IS NOT NULL) as converted_referrals,
    ROUND(AVG(CASE WHEN converted_to_referral_id IS NOT NULL THEN 100.0 ELSE 0.0 END), 2) as conversion_rate,
    COUNT(*) FILTER (WHERE urgency_level = 'stat') as stat_referrals,
    COUNT(*) FILTER (WHERE urgency_level = 'urgent') as urgent_referrals
FROM public.marketing_referrals
GROUP BY referred_by;

-- View for referral statistics by organization
CREATE OR REPLACE VIEW marketing_routing_stats AS
SELECT 
    routing_destination,
    organization_name,
    COUNT(*) as total_referrals,
    COUNT(*) FILTER (WHERE status = 'admitted') as admitted_count,
    COUNT(*) FILTER (WHERE status = 'declined') as declined_count,
    ROUND(AVG(CASE WHEN status = 'admitted' THEN 100.0 ELSE 0.0 END), 2) as admission_rate
FROM public.marketing_referrals
GROUP BY routing_destination, organization_name;

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Marketing referrals table created successfully!';
    RAISE NOTICE '📊 Indexes created for performance';
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '📈 Analytics views created';
    RAISE NOTICE '🎯 Ready for referral intake!';
END $$;

