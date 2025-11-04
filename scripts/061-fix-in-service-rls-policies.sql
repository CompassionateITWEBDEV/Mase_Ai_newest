-- Fix RLS policies for in-service training tables
-- This adds INSERT, UPDATE, DELETE policies that were missing

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view trainings" ON public.in_service_trainings;
DROP POLICY IF EXISTS "Allow authenticated users to manage trainings" ON public.in_service_trainings;
DROP POLICY IF EXISTS "Allow authenticated users to create trainings" ON public.in_service_trainings;
DROP POLICY IF EXISTS "Allow authenticated users to update trainings" ON public.in_service_trainings;
DROP POLICY IF EXISTS "Allow authenticated users to delete trainings" ON public.in_service_trainings;

-- Allow authenticated users to view all trainings
CREATE POLICY "Allow authenticated users to view trainings"
    ON public.in_service_trainings FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to create trainings
CREATE POLICY "Allow authenticated users to create trainings"
    ON public.in_service_trainings FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update trainings
CREATE POLICY "Allow authenticated users to update trainings"
    ON public.in_service_trainings FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete trainings
CREATE POLICY "Allow authenticated users to delete trainings"
    ON public.in_service_trainings FOR DELETE
    TO authenticated
    USING (true);

-- Fix enrollments policies
DROP POLICY IF EXISTS "Users can manage their own enrollments" ON public.in_service_enrollments;
DROP POLICY IF EXISTS "Allow authenticated users to manage enrollments" ON public.in_service_enrollments;

-- Allow authenticated users to manage enrollments (for now, allow all - can be restricted later)
CREATE POLICY "Allow authenticated users to manage enrollments"
    ON public.in_service_enrollments FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Fix completions policies
DROP POLICY IF EXISTS "Users can view their own completions" ON public.in_service_completions;
DROP POLICY IF EXISTS "Allow authenticated users to manage completions" ON public.in_service_completions;

-- Allow authenticated users to manage completions
CREATE POLICY "Allow authenticated users to manage completions"
    ON public.in_service_completions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Fix assignments policies
DROP POLICY IF EXISTS "Allow authenticated users to manage assignments" ON public.in_service_assignments;

-- Allow authenticated users to manage assignments
CREATE POLICY "Allow authenticated users to manage assignments"
    ON public.in_service_assignments FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Fix requirements policies
DROP POLICY IF EXISTS "Users can view their own requirements" ON public.employee_training_requirements;
DROP POLICY IF EXISTS "Allow authenticated users to manage requirements" ON public.employee_training_requirements;

-- Allow authenticated users to manage requirements
CREATE POLICY "Allow authenticated users to manage requirements"
    ON public.employee_training_requirements FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Also allow service role to bypass RLS (for API operations)
-- Note: Service role key automatically bypasses RLS, but we can add explicit policies if needed

