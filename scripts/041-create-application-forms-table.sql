-- Create application_forms table to store detailed application data
-- This table will store the complete form submission from the job application modal

CREATE TABLE IF NOT EXISTS public.application_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE,

    -- Personal Information
    first_name TEXT NOT NULL,
    middle_initial TEXT,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    date_of_birth DATE,
    ssn TEXT,

    -- Position & Experience
    desired_position TEXT NOT NULL,
    employment_type TEXT DEFAULT 'full-time',
    availability TEXT,
    years_experience TEXT,
    work_history TEXT,
    specialties TEXT,

    -- Education
    high_school TEXT,
    hs_grad_year INTEGER,
    college TEXT,
    degree TEXT,
    major TEXT,
    college_grad_year INTEGER,

    -- Licenses & Certifications
    license TEXT,
    license_state TEXT,
    license_expiry DATE,
    cpr TEXT,
    other_certs TEXT,

    -- Compliance & Background
    hipaa_training BOOLEAN DEFAULT false,
    hipaa_details TEXT,
    conflict_interest BOOLEAN DEFAULT false,
    conflict_details TEXT,
    relationship_conflict BOOLEAN DEFAULT false,
    relationship_details TEXT,
    conviction_history BOOLEAN DEFAULT false,
    conviction_details TEXT,
    registry_history BOOLEAN DEFAULT false,
    background_consent BOOLEAN DEFAULT false,

    -- Health & Safety
    tb_test_status TEXT,
    tb_test_date DATE,
    tb_history_details TEXT,
    infection_training BOOLEAN DEFAULT false,
    infection_details TEXT,
    physical_accommodation BOOLEAN DEFAULT false,
    physical_details TEXT,
    hep_b_vaccination TEXT,
    flu_vaccination TEXT,
    immunization_details TEXT,

    -- References
    reference_1_name TEXT,
    reference_1_relationship TEXT,
    reference_1_company TEXT,
    reference_1_phone TEXT,
    reference_1_email TEXT,
    reference_2_name TEXT,
    reference_2_relationship TEXT,
    reference_2_company TEXT,
    reference_2_phone TEXT,
    reference_2_email TEXT,
    reference_3_name TEXT,
    reference_3_relationship TEXT,
    reference_3_company TEXT,
    reference_3_phone TEXT,
    reference_3_email TEXT,

    -- Emergency Contact
    emergency_name TEXT,
    emergency_relationship TEXT,
    emergency_phone TEXT,
    emergency_email TEXT,
    emergency_address TEXT,

    -- Terms & Agreements
    terms_agreed BOOLEAN DEFAULT false,
    employment_at_will BOOLEAN DEFAULT false,
    drug_testing_consent BOOLEAN DEFAULT false,

    -- Metadata
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_application_forms_job_application_id ON public.application_forms(job_application_id);
CREATE INDEX IF NOT EXISTS idx_application_forms_email ON public.application_forms(email);
CREATE INDEX IF NOT EXISTS idx_application_forms_submitted_at ON public.application_forms(submitted_at);

-- Enable RLS
ALTER TABLE public.application_forms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow applicants to view own application forms" ON public.application_forms
    FOR SELECT USING (
        job_application_id IN (
            SELECT id FROM public.job_applications
            WHERE applicant_id IN (
                SELECT id FROM public.applicants
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Allow applicants to insert own application forms" ON public.application_forms
    FOR INSERT WITH CHECK (
        job_application_id IN (
            SELECT id FROM public.job_applications
            WHERE applicant_id IN (
                SELECT id FROM public.applicants
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Allow employers to view application forms for their jobs" ON public.application_forms
    FOR SELECT USING (
        job_application_id IN (
            SELECT id FROM public.job_applications
            WHERE employer_id IN (
                SELECT id FROM public.employers
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON public.application_forms TO anon;
GRANT SELECT, INSERT ON public.application_forms TO authenticated;

-- Add comment
COMMENT ON TABLE public.application_forms IS 'Detailed application form data submitted by applicants';

