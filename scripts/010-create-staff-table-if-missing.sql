-- Create or update staff table to ensure it has correct structure
-- This fixes the "email column not found" error

-- Drop the existing staff table if it has wrong structure (be careful in production!)
-- For development, we can safely drop and recreate
DROP TABLE IF EXISTS public.staff CASCADE;

-- Create the staff table with correct structure
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role_id TEXT,
    department TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    organization TEXT,
    phone_number TEXT,
    address TEXT,
    credentials TEXT,
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role_id ON public.staff(role_id);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON public.staff(is_active);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_staff ON public.staff;

CREATE TRIGGER set_timestamp_staff
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow staff inserts" ON public.staff;
DROP POLICY IF EXISTS "Allow staff select for login" ON public.staff;
DROP POLICY IF EXISTS "Allow staff updates" ON public.staff;

-- Create policies
CREATE POLICY "Allow staff inserts" 
ON public.staff FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow staff select for login" 
ON public.staff FOR SELECT USING (true);

CREATE POLICY "Allow staff updates" 
ON public.staff FOR UPDATE USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.staff TO anon;
GRANT SELECT, INSERT, UPDATE ON public.staff TO authenticated;

-- Insert a test staff member (optional)
INSERT INTO public.staff (email, name, role_id, department, is_active)
VALUES ('admin@test.com', 'Test Admin', 'super_admin', 'Administration', true)
ON CONFLICT (email) DO NOTHING;

