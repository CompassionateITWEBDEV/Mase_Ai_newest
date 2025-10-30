-- Add missing columns to application_forms table
-- This fixes the schema mismatch between the form and database

-- Add additional_info column
ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Add any other missing columns that might be referenced in the form
ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS license_number TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS cpr_certification TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS other_certifications TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS background_check_consent BOOLEAN DEFAULT false;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS drug_test_consent BOOLEAN DEFAULT false;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS immunization_records BOOLEAN DEFAULT false;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS tb_test BOOLEAN DEFAULT false;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS flu_vaccine BOOLEAN DEFAULT false;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS covid_vaccine BOOLEAN DEFAULT false;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS physical_limitations TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS reference1_name TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS reference1_phone TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS reference1_relationship TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS reference2_name TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS reference2_phone TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS reference2_relationship TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS reference3_name TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS reference3_phone TEXT;

ALTER TABLE public.application_forms 
ADD COLUMN IF NOT EXISTS reference3_relationship TEXT;

-- Add comment
COMMENT ON COLUMN public.application_forms.additional_info IS 'Additional information provided by the applicant';


