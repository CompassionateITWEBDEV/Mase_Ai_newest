-- ================================================================
-- 🚨 EMERGENCY FIX FOR FACILITY PORTAL ERROR
-- Run this FIRST before anything else!
-- ================================================================

BEGIN;

-- ================================================================
-- STEP 1: Check if referrals table exists
-- ================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
        RAISE EXCEPTION '❌ ERROR: referrals table does not exist! Run scripts/040-create-referrals-table.sql first!';
    END IF;
    RAISE NOTICE '✅ referrals table exists';
END $$;

-- ================================================================
-- STEP 2: Add ALL required base columns
-- ================================================================

-- patient_name
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS patient_name TEXT;
UPDATE public.referrals SET patient_name = 'Unknown' WHERE patient_name IS NULL;
ALTER TABLE public.referrals ALTER COLUMN patient_name SET NOT NULL;

-- referral_date
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_date DATE;
UPDATE public.referrals SET referral_date = CURRENT_DATE WHERE referral_date IS NULL;
ALTER TABLE public.referrals ALTER COLUMN referral_date SET NOT NULL;

-- referral_source
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_source TEXT;
UPDATE public.referrals SET referral_source = 'Manual Entry' WHERE referral_source IS NULL;
ALTER TABLE public.referrals ALTER COLUMN referral_source SET NOT NULL;

-- diagnosis
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS diagnosis TEXT;
UPDATE public.referrals SET diagnosis = 'Not specified' WHERE diagnosis IS NULL;
ALTER TABLE public.referrals ALTER COLUMN diagnosis SET NOT NULL;

-- insurance_provider
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
UPDATE public.referrals SET insurance_provider = 'Not provided' WHERE insurance_provider IS NULL;
ALTER TABLE public.referrals ALTER COLUMN insurance_provider SET NOT NULL;

-- insurance_id
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_id TEXT;
UPDATE public.referrals SET insurance_id = 'Not provided' WHERE insurance_id IS NULL;
ALTER TABLE public.referrals ALTER COLUMN insurance_id SET NOT NULL;

-- status
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS status TEXT;
UPDATE public.referrals SET status = 'New' WHERE status IS NULL;
ALTER TABLE public.referrals ALTER COLUMN status SET NOT NULL;

-- referral_number (CRITICAL for API)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'referral_number'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN referral_number TEXT;
        UPDATE public.referrals SET referral_number = 'REF-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 4, '0') WHERE referral_number IS NULL;
        ALTER TABLE public.referrals ALTER COLUMN referral_number SET NOT NULL;
    END IF;
    RAISE NOTICE '✅ All required base columns added';
END $$;

-- ================================================================
-- STEP 3: Add facility portal specific columns
-- ================================================================

DO $$
BEGIN
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS facility_name TEXT;
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS case_manager TEXT;
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}';
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS estimated_admission_date DATE;
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS actual_admission_date DATE;
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS discharge_date DATE;
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS feedback TEXT;
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'routine';
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_recommendation TEXT;
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_reason TEXT;
    RAISE NOTICE '✅ Facility portal columns added';
END $$;

-- ================================================================
-- STEP 4: Create indexes
-- ================================================================

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_referrals_facility_name ON public.referrals(facility_name);
    CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
    CREATE INDEX IF NOT EXISTS idx_referrals_referral_date ON public.referrals(referral_date DESC);
    CREATE INDEX IF NOT EXISTS idx_referrals_referral_number ON public.referrals(referral_number);
    RAISE NOTICE '✅ Indexes created';
END $$;

-- ================================================================
-- STEP 5: Create facility_users table if not exists
-- ================================================================

CREATE TABLE IF NOT EXISTS public.facility_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_name TEXT NOT NULL,
    facility_type TEXT NOT NULL DEFAULT 'hospital',
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL UNIQUE,
    contact_phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add facility_user_id to referrals
DO $$
BEGIN
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS facility_user_id UUID REFERENCES public.facility_users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_referrals_facility_user_id ON public.referrals(facility_user_id);
    RAISE NOTICE '✅ facility_users table ready';
END $$;

-- ================================================================
-- STEP 6: Insert default facility user
-- ================================================================

DO $$
BEGIN
    INSERT INTO public.facility_users (
        facility_name,
        facility_type,
        contact_name,
        contact_email,
        contact_phone,
        city,
        state
    ) VALUES (
        'Mercy Hospital',
        'hospital',
        'Lisa Rodriguez, RN',
        'lrodriguez@mercyhospital.com',
        '(555) 123-4567',
        'Flint',
        'MI'
    ) ON CONFLICT (contact_email) DO NOTHING;
    RAISE NOTICE '✅ Default facility user created';
END $$;

-- ================================================================
-- STEP 7: Create facility_messages table
-- ================================================================

CREATE TABLE IF NOT EXISTS public.facility_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_number TEXT UNIQUE,
    from_type TEXT NOT NULL,
    from_id UUID,
    from_name TEXT NOT NULL,
    to_type TEXT NOT NULL,
    to_id UUID,
    to_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'message',
    referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_facility_messages_from_id ON public.facility_messages(from_id);
    CREATE INDEX IF NOT EXISTS idx_facility_messages_to_id ON public.facility_messages(to_id);
    CREATE INDEX IF NOT EXISTS idx_facility_messages_referral_id ON public.facility_messages(referral_id);
    CREATE INDEX IF NOT EXISTS idx_facility_messages_created_at ON public.facility_messages(created_at DESC);
END $$;

-- Function to auto-generate message number
CREATE OR REPLACE FUNCTION generate_message_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_number := 'MSG-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        IF NOT EXISTS (SELECT 1 FROM public.facility_messages WHERE message_number = new_number) THEN
            RETURN new_number;
        END IF;
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate message number
CREATE OR REPLACE FUNCTION set_message_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.message_number IS NULL OR NEW.message_number = '' THEN
        NEW.message_number := generate_message_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_message_number ON public.facility_messages;
CREATE TRIGGER trigger_set_message_number
    BEFORE INSERT ON public.facility_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_message_number();

DO $$
BEGIN
    RAISE NOTICE '✅ facility_messages table ready';
END $$;

-- ================================================================
-- STEP 8: Enable RLS (basic policies)
-- ================================================================

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_messages ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (tighten in production)
DROP POLICY IF EXISTS "Allow all operations" ON public.referrals;
CREATE POLICY "Allow all operations" ON public.referrals FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON public.facility_users;
CREATE POLICY "Allow all operations" ON public.facility_users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON public.facility_messages;
CREATE POLICY "Allow all operations" ON public.facility_messages FOR ALL USING (true);

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies configured';
END $$;

COMMIT;

-- ================================================================
-- STEP 9: Verify everything is ready
-- ================================================================

-- Check all columns exist
DO $$
DECLARE
    missing_columns TEXT[];
    required_columns TEXT[] := ARRAY[
        'patient_name', 'referral_date', 'referral_source', 'diagnosis',
        'insurance_provider', 'insurance_id', 'status', 'referral_number',
        'facility_name', 'case_manager', 'services', 'urgency'
    ];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'referrals'
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION '❌ Missing columns: %', array_to_string(missing_columns, ', ');
    END IF;
    
    RAISE NOTICE '✅ All required columns exist!';
END $$;

-- Show summary
SELECT 
    '✅ FACILITY PORTAL DATABASE READY!' as status,
    COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'referrals';

-- Show facility user
SELECT 
    '✅ Default Facility User' as status,
    facility_name,
    contact_name,
    contact_email
FROM public.facility_users
WHERE facility_name = 'Mercy Hospital';

-- Final message
SELECT '
╔════════════════════════════════════════════════════════════╗
║          ✅ EMERGENCY FIX COMPLETE!                        ║
╚════════════════════════════════════════════════════════════╝

Next steps:
1. ✅ Database is now ready
2. 🔄 Restart your Next.js dev server (Ctrl+C, then npm run dev)
3. 🧪 Go to /facility-portal
4. ✅ It should work now!

If you still get errors:
- Check browser console for detailed error
- Check server terminal for API errors
- Verify .env.local has Supabase keys

' as instructions;

