-- Create patient_reviews table for managing patient reviews and testimonials
-- This allows patients to review staff members and services

CREATE TABLE IF NOT EXISTS public.patient_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    staff_name TEXT NOT NULL,
    staff_role TEXT,
    visit_id UUID REFERENCES public.staff_visits(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    service_type TEXT,
    service_date DATE,
    verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'rejected', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_reviews_patient_id ON public.patient_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_reviews_staff_id ON public.patient_reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_patient_reviews_visit_id ON public.patient_reviews(visit_id);
CREATE INDEX IF NOT EXISTS idx_patient_reviews_status ON public.patient_reviews(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_patient_reviews_rating ON public.patient_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_patient_reviews_created_at ON public.patient_reviews(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.patient_reviews IS 'Patient reviews and testimonials for staff members and services';
COMMENT ON COLUMN public.patient_reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN public.patient_reviews.verified IS 'True if the review is verified (patient confirmed they received care)';
COMMENT ON COLUMN public.patient_reviews.helpful_count IS 'Number of times this review was marked as helpful';
COMMENT ON COLUMN public.patient_reviews.status IS 'Review status: pending (awaiting approval), published (visible), rejected (not approved), archived (hidden)';






