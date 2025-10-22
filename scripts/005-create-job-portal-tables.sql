-- Job Portal Tables Migration
-- Creates tables for applicants, employers, and job applications

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create applicants table (healthcare professionals)
CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Link to Supabase auth.users
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    
    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    
    -- Professional Info
    profession TEXT,
    experience_level TEXT,
    education_level TEXT,
    certifications TEXT,
    
    -- Account Settings
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    marketing_opt_in BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create employers table (healthcare facilities)
CREATE TABLE IF NOT EXISTS public.employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Link to Supabase auth.users
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    
    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    
    -- Company Info
    company_name TEXT NOT NULL,
    company_type TEXT, -- e.g., 'hospital', 'nursing_home', 'assisted_living'
    facility_size TEXT, -- e.g., 'small', 'medium', 'large', 'enterprise'
    
    -- Account Settings
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    marketing_opt_in BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES public.employers(id) ON DELETE CASCADE,
    
    -- Application details
    job_title TEXT NOT NULL,
    job_type TEXT, -- e.g., 'full-time', 'part-time', 'contract'
    status TEXT DEFAULT 'pending', -- e.g., 'pending', 'reviewing', 'accepted', 'rejected'
    cover_letter TEXT,
    resume_url TEXT,
    
    -- Additional info
    notes TEXT,
    applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applicants_email ON public.applicants(email);
CREATE INDEX IF NOT EXISTS idx_applicants_auth_user_id ON public.applicants(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_applicants_is_active ON public.applicants(is_active);

CREATE INDEX IF NOT EXISTS idx_employers_email ON public.employers(email);
CREATE INDEX IF NOT EXISTS idx_employers_auth_user_id ON public.employers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employers_is_active ON public.employers(is_active);

CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_employer_id ON public.job_applications(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- Add triggers for auto-updating updated_at timestamp
CREATE TRIGGER set_timestamp_applicants
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_employers
    BEFORE UPDATE ON public.employers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_job_applications
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Add Row Level Security (RLS) policies
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can only read/update their own data
CREATE POLICY "Applicants can view own data" ON public.applicants
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Applicants can update own data" ON public.applicants
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Employers can only read/update their own data
CREATE POLICY "Employers can view own data" ON public.employers
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Employers can update own data" ON public.employers
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Anyone can insert (for registration)
CREATE POLICY "Anyone can insert applicants" ON public.applicants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert employers" ON public.employers
    FOR INSERT WITH CHECK (true);

-- Job applications policies
CREATE POLICY "Applicants can view own applications" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.applicants
            WHERE applicants.id = job_applications.applicant_id
            AND applicants.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Employers can view applications to their jobs" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employers
            WHERE employers.id = job_applications.employer_id
            AND employers.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Applicants can insert own applications" ON public.job_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.applicants
            WHERE applicants.id = job_applications.applicant_id
            AND applicants.auth_user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.applicants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.job_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.applicants TO anon;
GRANT SELECT, INSERT, UPDATE ON public.employers TO anon;

