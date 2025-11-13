-- Create patient_care_team table for managing care team relationships
-- This allows multiple staff members to be assigned to a patient's care team

CREATE TABLE IF NOT EXISTS public.patient_care_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- e.g., "Primary Care Physician", "Registered Nurse", "Physical Therapist", "Social Worker"
    specialty TEXT, -- e.g., "Internal Medicine", "Home Health", "Orthopedic PT"
    is_primary BOOLEAN DEFAULT FALSE, -- Mark primary provider
    is_assigned_staff BOOLEAN DEFAULT FALSE, -- Mark assigned staff for home visits
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    removed_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, staff_id) -- Prevent duplicate staff assignments (one staff per patient)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_care_team_patient_id ON public.patient_care_team(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_care_team_staff_id ON public.patient_care_team(staff_id);
CREATE INDEX IF NOT EXISTS idx_patient_care_team_active ON public.patient_care_team(patient_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_patient_care_team_primary ON public.patient_care_team(patient_id, is_primary) WHERE is_primary = TRUE;

-- Add comments for documentation
COMMENT ON TABLE public.patient_care_team IS 'Many-to-many relationship between patients and their care team members';
COMMENT ON COLUMN public.patient_care_team.role IS 'Role of staff member in care team (e.g., Primary Care Physician, Registered Nurse)';
COMMENT ON COLUMN public.patient_care_team.specialty IS 'Specialty of the staff member (e.g., Internal Medicine, Home Health)';
COMMENT ON COLUMN public.patient_care_team.is_primary IS 'True if this is the primary care provider';
COMMENT ON COLUMN public.patient_care_team.is_assigned_staff IS 'True if this is the assigned staff for home visits';
COMMENT ON COLUMN public.patient_care_team.is_active IS 'True if this care team member is currently active';

-- Migration script to populate care team from existing data
-- Migrate assigned_staff_id to care team
INSERT INTO public.patient_care_team (patient_id, staff_id, role, is_primary, is_assigned_staff, is_active)
SELECT 
  id as patient_id,
  assigned_staff_id as staff_id,
  'Assigned Staff' as role,
  FALSE as is_primary,
  TRUE as is_assigned_staff,
  TRUE as is_active
FROM public.patients
WHERE assigned_staff_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.patient_care_team 
    WHERE patient_id = patients.id 
    AND staff_id = patients.assigned_staff_id
  )
ON CONFLICT DO NOTHING;

-- Migrate primary_provider_id to care team
INSERT INTO public.patient_care_team (patient_id, staff_id, role, is_primary, is_assigned_staff, is_active)
SELECT 
  id as patient_id,
  primary_provider_id as staff_id,
  'Primary Care Provider' as role,
  TRUE as is_primary,
  FALSE as is_assigned_staff,
  TRUE as is_active
FROM public.patients
WHERE primary_provider_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.patient_care_team 
    WHERE patient_id = patients.id 
    AND staff_id = patients.primary_provider_id
  )
ON CONFLICT DO NOTHING;

