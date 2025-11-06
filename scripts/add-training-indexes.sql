-- =====================================================
-- ADD INDEXES FOR TRAINING TABLES TO PREVENT TIMEOUT
-- =====================================================
-- Run this in Supabase SQL Editor to speed up queries
-- This will fix the "statement timeout" error (57014)

-- 1. Index for in_service_enrollments (most critical)
CREATE INDEX IF NOT EXISTS idx_enrollments_employee_id 
ON in_service_enrollments(employee_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_training_id 
ON in_service_enrollments(training_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_status 
ON in_service_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_enrollments_employee_status 
ON in_service_enrollments(employee_id, status);

-- 2. Index for in_service_completions
CREATE INDEX IF NOT EXISTS idx_completions_employee_id 
ON in_service_completions(employee_id);

CREATE INDEX IF NOT EXISTS idx_completions_training_id 
ON in_service_completions(training_id);

CREATE INDEX IF NOT EXISTS idx_completions_enrollment_id 
ON in_service_completions(enrollment_id);

-- 3. Index for in_service_assignments
CREATE INDEX IF NOT EXISTS idx_assignments_status 
ON in_service_assignments(status);

CREATE INDEX IF NOT EXISTS idx_assignments_training_id 
ON in_service_assignments(training_id);

CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to 
ON in_service_assignments(assigned_to_type, assigned_to_value);

-- 4. Index for employee_training_requirements
CREATE INDEX IF NOT EXISTS idx_requirements_employee_year 
ON employee_training_requirements(employee_id, year);

-- 5. Index for staff table
CREATE INDEX IF NOT EXISTS idx_staff_email 
ON staff(email);

CREATE INDEX IF NOT EXISTS idx_staff_is_active 
ON staff(is_active);

-- 6. Index for in_service_trainings
CREATE INDEX IF NOT EXISTS idx_trainings_status 
ON in_service_trainings(status);

-- Analyze tables to update statistics
ANALYZE in_service_enrollments;
ANALYZE in_service_completions;
ANALYZE in_service_assignments;
ANALYZE employee_training_requirements;
ANALYZE in_service_trainings;
ANALYZE staff;

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'in_service_enrollments',
  'in_service_completions',
  'in_service_assignments',
  'employee_training_requirements',
  'in_service_trainings',
  'staff'
)
ORDER BY tablename, indexname;

