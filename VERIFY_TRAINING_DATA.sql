-- ========================================
-- COMPREHENSIVE TRAINING DATA VERIFICATION
-- ========================================
-- Run these queries to verify all training data is properly set up

-- ========================================
-- 1. CHECK IF TABLES EXIST
-- ========================================
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN (
  'in_service_trainings',
  'in_service_enrollments',
  'in_service_completions',
  'in_service_assignments',
  'employee_training_requirements'
)
ORDER BY tablename;

-- ========================================
-- 2. CHECK COMPLETED TRAININGS BY EMPLOYEE
-- ========================================
SELECT 
  c.employee_id,
  COALESCE(s.name, a.first_name || ' ' || a.last_name) as employee_name,
  t.title as training_title,
  c.completion_date,
  c.score,
  c.ceu_hours_earned,
  c.certificate_number
FROM in_service_completions c
LEFT JOIN staff s ON c.employee_id = s.id
LEFT JOIN applicants a ON c.employee_id = a.id
LEFT JOIN in_service_trainings t ON c.training_id = t.id
WHERE c.employee_id IS NOT NULL
ORDER BY c.completion_date DESC
LIMIT 50;

-- ========================================
-- 3. CHECK IN-PROGRESS TRAININGS
-- ========================================
SELECT 
  e.employee_id,
  COALESCE(s.name, a.first_name || ' ' || a.last_name) as employee_name,
  t.title as training_title,
  e.status,
  e.progress,
  e.start_date,
  e.estimated_completion_date
FROM in_service_enrollments e
LEFT JOIN staff s ON e.employee_id = s.id
LEFT JOIN applicants a ON e.employee_id = a.id
LEFT JOIN in_service_trainings t ON e.training_id = t.id
WHERE e.status = 'in_progress'
ORDER BY e.start_date DESC
LIMIT 50;

-- ========================================
-- 4. CHECK ASSIGNED (NOT STARTED) TRAININGS
-- ========================================
SELECT 
  e.employee_id,
  COALESCE(s.name, a.first_name || ' ' || a.last_name) as employee_name,
  t.title as training_title,
  e.status,
  e.enrollment_date,
  a_assign.due_date,
  a_assign.priority
FROM in_service_enrollments e
LEFT JOIN staff s ON e.employee_id = s.id
LEFT JOIN applicants a ON e.employee_id = a.id
LEFT JOIN in_service_trainings t ON e.training_id = t.id
LEFT JOIN in_service_assignments a_assign ON e.training_id = a_assign.training_id
WHERE e.status = 'enrolled'
ORDER BY e.enrollment_date DESC
LIMIT 50;

-- ========================================
-- 5. CHECK ASSIGNMENTS (ALL TYPES)
-- ========================================
SELECT 
  a.id,
  t.title as training_title,
  a.assigned_to_type,
  a.assigned_to_value,
  a.due_date,
  a.priority,
  a.status,
  CASE 
    WHEN a.assigned_to_type = 'all' THEN 'All Staff'
    WHEN a.assigned_to_type = 'role' THEN 'Role: ' || a.assigned_to_value
    WHEN a.assigned_to_type = 'individual' THEN 
      COALESCE(array_length(a.assigned_employee_ids, 1), 0)::TEXT || ' employees'
    ELSE 'Unknown'
  END as assigned_to_description
FROM in_service_assignments a
LEFT JOIN in_service_trainings t ON a.training_id = t.id
WHERE a.status = 'active'
ORDER BY a.assigned_date DESC
LIMIT 50;

-- ========================================
-- 6. CHECK EMPLOYEE ANNUAL REQUIREMENTS
-- ========================================
SELECT 
  r.employee_id,
  COALESCE(s.name, a.first_name || ' ' || a.last_name) as employee_name,
  COALESCE(s.credentials, s.role_id, a.profession, 'Unknown') as role,
  r.year,
  r.annual_requirement_hours,
  r.completed_hours,
  r.in_progress_hours,
  r.remaining_hours,
  r.compliance_status,
  r.last_training_date,
  ROUND((r.completed_hours / NULLIF(r.annual_requirement_hours, 0)) * 100, 1) as completion_percentage
FROM employee_training_requirements r
LEFT JOIN staff s ON r.employee_id = s.id
LEFT JOIN applicants a ON r.employee_id = a.id
WHERE r.year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY r.completed_hours DESC;

-- ========================================
-- 7. OVERALL STATISTICS SUMMARY
-- ========================================
SELECT 
  -- Total employees with training records
  (SELECT COUNT(DISTINCT employee_id) FROM in_service_enrollments) as total_employees_enrolled,
  
  -- Total completions
  (SELECT COUNT(*) FROM in_service_completions) as total_completions,
  
  -- Total CEU hours earned
  (SELECT COALESCE(SUM(ceu_hours_earned), 0) FROM in_service_completions) as total_ceu_hours,
  
  -- Average score
  (SELECT ROUND(AVG(score), 1) FROM in_service_completions WHERE score IS NOT NULL) as average_score,
  
  -- In-progress count
  (SELECT COUNT(*) FROM in_service_enrollments WHERE status = 'in_progress') as in_progress_count,
  
  -- Assigned (not started) count
  (SELECT COUNT(*) FROM in_service_enrollments WHERE status = 'enrolled') as assigned_count,
  
  -- Active assignments count
  (SELECT COUNT(*) FROM in_service_assignments WHERE status = 'active') as active_assignments,
  
  -- Compliance status breakdown
  (SELECT COUNT(*) FROM employee_training_requirements WHERE compliance_status = 'on_track' AND year = EXTRACT(YEAR FROM CURRENT_DATE)) as on_track_count,
  (SELECT COUNT(*) FROM employee_training_requirements WHERE compliance_status = 'behind' AND year = EXTRACT(YEAR FROM CURRENT_DATE)) as behind_count,
  (SELECT COUNT(*) FROM employee_training_requirements WHERE compliance_status = 'at_risk' AND year = EXTRACT(YEAR FROM CURRENT_DATE)) as at_risk_count,
  (SELECT COUNT(*) FROM employee_training_requirements WHERE compliance_status = 'non_compliant' AND year = EXTRACT(YEAR FROM CURRENT_DATE)) as non_compliant_count;

-- ========================================
-- 8. CHECK FOR MISSING DATA / ORPHANED RECORDS
-- ========================================

-- Completions without employee match
SELECT 
  c.id,
  c.employee_id,
  c.training_id,
  'Completion without employee' as issue
FROM in_service_completions c
WHERE NOT EXISTS (
  SELECT 1 FROM staff WHERE id = c.employee_id
  UNION
  SELECT 1 FROM applicants WHERE id = c.employee_id
)
LIMIT 10;

-- Enrollments without employee match
SELECT 
  e.id,
  e.employee_id,
  e.training_id,
  'Enrollment without employee' as issue
FROM in_service_enrollments e
WHERE NOT EXISTS (
  SELECT 1 FROM staff WHERE id = e.employee_id
  UNION
  SELECT 1 FROM applicants WHERE id = e.employee_id
)
LIMIT 10;

-- Completions/Enrollments without training match
SELECT 
  c.id,
  c.training_id,
  'Completion without training' as issue
FROM in_service_completions c
WHERE NOT EXISTS (
  SELECT 1 FROM in_service_trainings WHERE id = c.training_id
)
LIMIT 10;

-- ========================================
-- 9. TRAINING COMPLETIONS THIS MONTH
-- ========================================
SELECT 
  COUNT(*) as completions_this_month,
  SUM(ceu_hours_earned) as ceu_hours_this_month,
  ROUND(AVG(score), 1) as avg_score_this_month
FROM in_service_completions
WHERE completion_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND completion_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- ========================================
-- 10. EMPLOYEES WITHOUT ANNUAL REQUIREMENTS
-- ========================================
SELECT 
  s.id,
  s.name,
  s.credentials,
  s.role_id,
  'Missing annual requirement' as issue
FROM staff s
WHERE s.is_active = true
  AND NOT EXISTS (
    SELECT 1 
    FROM employee_training_requirements r 
    WHERE r.employee_id = s.id 
      AND r.year = EXTRACT(YEAR FROM CURRENT_DATE)
  )
LIMIT 20;

-- ========================================
-- EXPECTED RESULTS:
-- 1. All 5 tables should exist
-- 2. Completed trainings should have employee names and training titles
-- 3. In-progress trainings should have progress > 0
-- 4. Assigned trainings should have due dates
-- 5. Assignments should have proper type and value
-- 6. Annual requirements should show realistic hours (0-20)
-- 7. Overall stats should match individual counts
-- 8. No orphaned records (missing employees/trainings)
-- 9. This month's stats should be >= 0
-- 10. All active staff should have annual requirements
-- ========================================

