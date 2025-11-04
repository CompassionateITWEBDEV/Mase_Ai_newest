-- ================================================
-- Script 064: Optimize In-Service Training Indexes
-- ================================================
-- This script adds indexes to improve query performance
-- and prevent timeout errors when fetching trainings
-- ================================================

-- Add indexes for faster lookups on in_service_trainings table
CREATE INDEX IF NOT EXISTS idx_trainings_status 
  ON in_service_trainings(status);

CREATE INDEX IF NOT EXISTS idx_trainings_category 
  ON in_service_trainings(category);

CREATE INDEX IF NOT EXISTS idx_trainings_created_at 
  ON in_service_trainings(created_at DESC);

-- Add indexes for faster joins on in_service_enrollments table
CREATE INDEX IF NOT EXISTS idx_enrollments_training_id 
  ON in_service_enrollments(training_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_employee_id 
  ON in_service_enrollments(employee_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_status 
  ON in_service_enrollments(status);

-- Composite index for common query pattern (training + employee)
CREATE INDEX IF NOT EXISTS idx_enrollments_training_employee 
  ON in_service_enrollments(training_id, employee_id);

-- Add indexes for faster joins on in_service_completions table
CREATE INDEX IF NOT EXISTS idx_completions_training_id 
  ON in_service_completions(training_id);

CREATE INDEX IF NOT EXISTS idx_completions_employee_id 
  ON in_service_completions(employee_id);

CREATE INDEX IF NOT EXISTS idx_completions_completion_date 
  ON in_service_completions(completion_date DESC);

-- Composite index for common query pattern (training + employee)
CREATE INDEX IF NOT EXISTS idx_completions_training_employee 
  ON in_service_completions(training_id, employee_id);

-- Add indexes for in_service_assignments table
CREATE INDEX IF NOT EXISTS idx_assignments_training_id 
  ON in_service_assignments(training_id);

CREATE INDEX IF NOT EXISTS idx_assignments_status 
  ON in_service_assignments(status);

CREATE INDEX IF NOT EXISTS idx_assignments_assigned_date 
  ON in_service_assignments(assigned_date DESC);

-- Add index for employee_training_requirements table
CREATE INDEX IF NOT EXISTS idx_training_requirements_employee_year 
  ON employee_training_requirements(employee_id, year);

-- ================================================
-- Verify indexes were created
-- ================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'in_service_trainings',
    'in_service_enrollments',
    'in_service_completions',
    'in_service_assignments',
    'employee_training_requirements'
  )
ORDER BY tablename, indexname;

-- ================================================
-- Expected Performance Improvements
-- ================================================
-- - Training Library: < 2 seconds (from 30+ seconds timeout)
-- - Assignment Stats: < 3 seconds (from 10+ seconds)
-- - Employee Progress: < 2 seconds (from 5+ seconds)
-- - Overall: 10-20x faster queries
-- ================================================

