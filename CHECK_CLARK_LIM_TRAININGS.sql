-- =====================================================
-- CHECK CLARK LIM'S TRAINING ASSIGNMENTS
-- =====================================================

-- Step 1: Find Clark Lim's staff record
SELECT 
  'Clark Lim Staff Record' as check_name,
  id, 
  name, 
  email, 
  role_id, 
  credentials,
  is_active
FROM staff 
WHERE LOWER(name) LIKE '%clark%' 
   OR LOWER(email) LIKE '%clark%';

-- Step 2: Check available trainings in the system
SELECT 
  'Available In-Service Trainings' as check_name,
  id,
  title,
  description,
  ceu_hours,
  status,
  is_active
FROM in_service_trainings
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Check if Clark has any assignments
SELECT 
  'Clark Lim Assignments' as check_name,
  a.id as assignment_id,
  a.training_id,
  t.title as training_title,
  a.assigned_to_type,
  a.assigned_to_value,
  a.assigned_employee_ids,
  a.status,
  a.assigned_date,
  a.due_date
FROM in_service_assignments a
LEFT JOIN in_service_trainings t ON a.training_id = t.id
WHERE a.status = 'active'
  AND (
    a.assigned_to_type = 'all' 
    OR '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1' = ANY(a.assigned_employee_ids)
  )
ORDER BY a.assigned_date DESC;

-- Step 4: Check if Clark has any enrollments
SELECT 
  'Clark Lim Enrollments' as check_name,
  e.id as enrollment_id,
  e.training_id,
  t.title as training_title,
  e.status,
  e.progress,
  e.enrollment_date,
  e.start_date
FROM in_service_enrollments e
LEFT JOIN in_service_trainings t ON e.training_id = t.id
WHERE e.employee_id = '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1'
ORDER BY e.enrollment_date DESC;

-- Step 5: Check if Clark has any completed trainings
SELECT 
  'Clark Lim Completions' as check_name,
  c.id as completion_id,
  c.training_id,
  t.title as training_title,
  c.completion_date,
  c.score,
  c.ceu_hours_earned,
  c.certificate_number
FROM in_service_completions c
LEFT JOIN in_service_trainings t ON c.training_id = t.id
WHERE c.employee_id = '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1'
ORDER BY c.completion_date DESC;

-- Step 6: Check ALL active assignments (to see what exists)
SELECT 
  'All Active Assignments' as check_name,
  COUNT(*) as total_assignments,
  assigned_to_type,
  assigned_to_value
FROM in_service_assignments
WHERE status = 'active'
GROUP BY assigned_to_type, assigned_to_value;

-- Step 7: Get Clark Lim's complete training status
SELECT 
  'Clark Lim Training Summary' as summary_name,
  (SELECT COUNT(*) FROM in_service_assignments WHERE status = 'active' 
    AND (assigned_to_type = 'all' OR '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1' = ANY(assigned_employee_ids))) as total_assignments,
  (SELECT COUNT(*) FROM in_service_enrollments WHERE employee_id = '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1') as total_enrollments,
  (SELECT COUNT(*) FROM in_service_enrollments WHERE employee_id = '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1' AND status = 'enrolled') as not_started,
  (SELECT COUNT(*) FROM in_service_enrollments WHERE employee_id = '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1' AND status = 'in_progress') as in_progress,
  (SELECT COUNT(*) FROM in_service_completions WHERE employee_id = '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1') as completed;

