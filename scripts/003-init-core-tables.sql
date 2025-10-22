-- Create the 'patients' table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    axxess_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    referral_date DATE,
    current_status TEXT,
    discharge_status TEXT,
    referral_accepted BOOLEAN,
    assigned_staff_id UUID REFERENCES public.staff(id), -- Link to staff table
    soc_due_date DATE,
    soc_window_status TEXT,
    location TEXT,
    referral_type TEXT,
    priority TEXT,
    diagnosis TEXT,
    age INTEGER,
    insurance TEXT,
    phone_number TEXT,
    address TEXT,
    emergency_contact TEXT,
    episode_start_date DATE,
    episode_end_date DATE,
    next_re_eval_date DATE,
    lupa_status TEXT,
    total_episode_cost NUMERIC(10, 2),
    projected_cost NUMERIC(10, 2),
    visit_frequencies JSONB, -- Store as JSONB for flexibility
    patient_goals JSONB,     -- Store as JSONB
    dme_orders JSONB,        -- Store as JSONB
    wound_care JSONB,        -- Store as JSONB
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'staff' table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE, -- Link to Supabase auth.users if applicable
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role_id TEXT, -- Link to USER_ROLES in lib/auth.ts
    department TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    organization TEXT,
    phone_number TEXT,
    address TEXT,
    credentials TEXT, -- e.g., RN, PT, MD
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    axxess_order_id TEXT UNIQUE NOT NULL,
    patient_id UUID REFERENCES public.patients(id),
    order_type TEXT NOT NULL,
    physician_name TEXT,
    date_received DATE,
    status TEXT,
    priority TEXT,
    qa_reviewer_id UUID REFERENCES public.staff(id),
    qa_date DATE,
    qa_comments TEXT,
    signature_status TEXT,
    services TEXT[],
    insurance_type TEXT,
    estimated_value NUMERIC(10, 2),
    billing_data JSONB,
    financial_data JSONB,
    compliance_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'visits' table
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id),
    staff_id UUID REFERENCES public.staff(id),
    order_id UUID REFERENCES public.orders(id),
    visit_date DATE NOT NULL,
    discipline TEXT NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    cost NUMERIC(10, 2),
    status TEXT, -- e.g., 'scheduled', 'completed', 'missed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'documents' table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id),
    order_id UUID REFERENCES public.orders(id),
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL, -- URL to Vercel Blob or Supabase Storage
    file_name TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.staff(id),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT, -- e.g., 'pending_review', 'approved', 'rejected'
    metadata JSONB, -- e.g., OCR results, signature status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'integrations_config' table to store API keys and settings securely
CREATE TABLE IF NOT EXISTS public.integrations_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_name TEXT UNIQUE NOT NULL, -- e.g., 'axxess', 'availity', 'change_healthcare'
    api_url TEXT,
    username TEXT,
    password TEXT, -- Store encrypted or use Supabase Vault for sensitive data
    api_key TEXT,   -- Store encrypted
    agency_id TEXT,
    environment TEXT,
    auto_sync BOOLEAN DEFAULT FALSE,
    sync_interval_minutes INTEGER,
    enable_webhooks BOOLEAN DEFAULT FALSE,
    webhook_url TEXT,
    data_retention_days INTEGER,
    compression_enabled BOOLEAN DEFAULT FALSE,
    encryption_enabled BOOLEAN DEFAULT FALSE,
    last_sync_time TIMESTAMP WITH TIME ZONE,
    status TEXT, -- e.g., 'connected', 'disconnected', 'error'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'notifications' table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.staff(id), -- Target user for notification
    patient_id UUID REFERENCES public.patients(id),
    order_id UUID REFERENCES public.orders(id),
    type TEXT NOT NULL, -- e.g., 'lupa_alert', 're_eval_due', 'new_referral', 'billing_issue'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the 'audit_logs' table for tracking system actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.staff(id),
    action TEXT NOT NULL, -- e.g., 'login', 'patient_update', 'order_status_change'
    resource_type TEXT, -- e.g., 'patient', 'order', 'integration'
    resource_id UUID,
    details JSONB, -- Additional context about the action
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a trigger to automatically update 'updated_at' column
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t record;
BEGIN
    FOR t IN SELECT relname FROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
    LOOP
        EXECUTE format('
            CREATE TRIGGER set_timestamp
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        ', t.relname);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
