-- Create in-service training system tables
-- This script creates all tables needed for the in-service education management system

-- Training Modules/Courses Table
CREATE TABLE IF NOT EXISTS public.in_service_trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Clinical Skills', 'Patient Safety', 'Safety & Compliance', 'Compliance', 'Professional Development')),
    type TEXT NOT NULL CHECK (type IN ('video_course', 'interactive_course', 'blended_learning', 'online_course', 'hands_on_workshop')),
    duration INTEGER NOT NULL, -- in minutes
    ceu_hours DECIMAL(5, 2) NOT NULL,
    description TEXT,
    target_roles TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of roles like ['RN', 'LPN', 'CNA', 'PT', 'PTA', 'OT', 'All']
    difficulty TEXT CHECK (difficulty IN ('Basic', 'Intermediate', 'Advanced')),
    prerequisites TEXT[] DEFAULT ARRAY[]::TEXT[],
    accreditation TEXT,
    expiry_months INTEGER,
    mandatory BOOLEAN DEFAULT false,
    due_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    
    -- Training content structure
    modules JSONB DEFAULT '[]'::jsonb, -- Array of module objects
    quiz_config JSONB DEFAULT '{"questions": 10, "passingScore": 80, "attempts": 3}'::jsonb,
    
    -- Statistics
    enrolled_count INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    average_score DECIMAL(5, 2) DEFAULT 0,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Enrollments (when employee starts/enrolls in a training)
CREATE TABLE IF NOT EXISTS public.in_service_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_id UUID NOT NULL REFERENCES public.in_service_trainings(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL, -- References staff.id or applicants.id
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_accessed TIMESTAMP WITH TIME ZONE,
    estimated_completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(training_id, employee_id)
);

-- Training Completions (when employee completes a training)
CREATE TABLE IF NOT EXISTS public.in_service_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES public.in_service_enrollments(id) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES public.in_service_trainings(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score DECIMAL(5, 2) CHECK (score >= 0 AND score <= 100),
    ceu_hours_earned DECIMAL(5, 2) NOT NULL,
    certificate_number TEXT,
    certificate_url TEXT,
    quiz_attempts INTEGER DEFAULT 0,
    final_quiz_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(enrollment_id)
);

-- Training Assignments (when admin assigns training to employees)
CREATE TABLE IF NOT EXISTS public.in_service_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_id UUID NOT NULL REFERENCES public.in_service_trainings(id) ON DELETE CASCADE,
    assigned_to_type TEXT NOT NULL CHECK (assigned_to_type IN ('all', 'role', 'department', 'individual')),
    assigned_to_value TEXT, -- Role name, department name, or 'all'
    assigned_employee_ids UUID[], -- For individual assignments
    assigned_by UUID, -- Admin user ID
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date DATE NOT NULL,
    notes TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Training Requirements (annual requirements per employee)
CREATE TABLE IF NOT EXISTS public.employee_training_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL,
    year INTEGER NOT NULL,
    annual_requirement_hours DECIMAL(5, 2) DEFAULT 20.0,
    completed_hours DECIMAL(5, 2) DEFAULT 0,
    in_progress_hours DECIMAL(5, 2) DEFAULT 0,
    remaining_hours DECIMAL(5, 2),
    compliance_status TEXT DEFAULT 'on_track' CHECK (compliance_status IN ('on_track', 'behind', 'at_risk', 'non_compliant')),
    last_training_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(employee_id, year)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trainings_category ON public.in_service_trainings(category);
CREATE INDEX IF NOT EXISTS idx_trainings_status ON public.in_service_trainings(status);
CREATE INDEX IF NOT EXISTS idx_trainings_mandatory ON public.in_service_trainings(mandatory);
CREATE INDEX IF NOT EXISTS idx_enrollments_training ON public.in_service_enrollments(training_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_employee ON public.in_service_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.in_service_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_completions_training ON public.in_service_completions(training_id);
CREATE INDEX IF NOT EXISTS idx_completions_employee ON public.in_service_completions(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_training ON public.in_service_assignments(training_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.in_service_assignments(status);
CREATE INDEX IF NOT EXISTS idx_requirements_employee ON public.employee_training_requirements(employee_id);
CREATE INDEX IF NOT EXISTS idx_requirements_year ON public.employee_training_requirements(year);

-- Function to update training statistics
CREATE OR REPLACE FUNCTION update_training_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update enrollment count
    UPDATE public.in_service_trainings
    SET enrolled_count = (
        SELECT COUNT(*) 
        FROM public.in_service_enrollments 
        WHERE training_id = NEW.training_id
    )
    WHERE id = NEW.training_id;
    
    -- Update completed count and average score
    UPDATE public.in_service_trainings
    SET 
        completed_count = (
            SELECT COUNT(*) 
            FROM public.in_service_completions 
            WHERE training_id = NEW.training_id
        ),
        average_score = (
            SELECT COALESCE(AVG(score), 0)
            FROM public.in_service_completions 
            WHERE training_id = NEW.training_id
        )
    WHERE id = NEW.training_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics when enrollment is created
CREATE TRIGGER update_training_stats_on_enrollment
    AFTER INSERT OR UPDATE OR DELETE ON public.in_service_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_training_statistics();

-- Trigger to update statistics when completion is created
CREATE TRIGGER update_training_stats_on_completion
    AFTER INSERT OR UPDATE OR DELETE ON public.in_service_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_training_statistics();

-- Function to update employee training requirements
CREATE OR REPLACE FUNCTION update_employee_training_requirements()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER;
    emp_id UUID;
    total_completed DECIMAL(5, 2);
    total_in_progress DECIMAL(5, 2);
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        emp_id := NEW.employee_id;
    ELSE
        emp_id := OLD.employee_id;
    END IF;
    
    -- Calculate completed hours for current year
    SELECT COALESCE(SUM(ceu_hours_earned), 0)
    INTO total_completed
    FROM public.in_service_completions
    WHERE employee_id = emp_id
    AND EXTRACT(YEAR FROM completion_date) = current_year;
    
    -- Calculate in-progress hours
    SELECT COALESCE(SUM(t.ceu_hours * (e.progress / 100.0)), 0)
    INTO total_in_progress
    FROM public.in_service_enrollments e
    JOIN public.in_service_trainings t ON e.training_id = t.id
    WHERE e.employee_id = emp_id
    AND e.status = 'in_progress';
    
    -- Insert or update employee requirements
    INSERT INTO public.employee_training_requirements (employee_id, year, completed_hours, in_progress_hours, remaining_hours, last_training_date)
    VALUES (
        emp_id,
        current_year,
        total_completed,
        total_in_progress,
        GREATEST(0, 20.0 - total_completed - total_in_progress),
        (SELECT MAX(completion_date::DATE) FROM public.in_service_completions WHERE employee_id = emp_id)
    )
    ON CONFLICT (employee_id, year) 
    DO UPDATE SET
        completed_hours = EXCLUDED.completed_hours,
        in_progress_hours = EXCLUDED.in_progress_hours,
        remaining_hours = EXCLUDED.remaining_hours,
        last_training_date = EXCLUDED.last_training_date,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update employee requirements when completion changes
CREATE TRIGGER update_employee_requirements_on_completion
    AFTER INSERT OR UPDATE OR DELETE ON public.in_service_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_training_requirements();

-- Trigger to update employee requirements when enrollment changes
CREATE TRIGGER update_employee_requirements_on_enrollment
    AFTER INSERT OR UPDATE OR DELETE ON public.in_service_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_training_requirements();

-- Enable Row Level Security
ALTER TABLE public.in_service_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_service_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_service_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_training_requirements ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth requirements)
-- Allow authenticated users to read trainings
CREATE POLICY "Allow authenticated users to view trainings"
    ON public.in_service_trainings FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to manage their own enrollments
CREATE POLICY "Users can manage their own enrollments"
    ON public.in_service_enrollments FOR ALL
    TO authenticated
    USING (auth.uid()::text = employee_id::text OR employee_id IN (
        SELECT id FROM public.staff WHERE user_id = auth.uid()
    ));

-- Allow authenticated users to view their own completions
CREATE POLICY "Users can view their own completions"
    ON public.in_service_completions FOR SELECT
    TO authenticated
    USING (auth.uid()::text = employee_id::text OR employee_id IN (
        SELECT id FROM public.staff WHERE user_id = auth.uid()
    ));

-- Allow authenticated users to view their own requirements
CREATE POLICY "Users can view their own requirements"
    ON public.employee_training_requirements FOR SELECT
    TO authenticated
    USING (auth.uid()::text = employee_id::text OR employee_id IN (
        SELECT id FROM public.staff WHERE user_id = auth.uid()
    ));

