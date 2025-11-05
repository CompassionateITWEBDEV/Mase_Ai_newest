-- =====================================================
-- SETUP SAMPLE TRAININGS FOR CLARK LIM (FIXED VERSION)
-- This will create trainings in different statuses:
-- 1. Not Started (assigned)
-- 2. In Progress  
-- 3. Completed
-- =====================================================

-- First, check what columns exist in in_service_trainings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'in_service_trainings'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 1: Create sample in-service trainings
-- =====================================================

-- Training 1: HIPAA Compliance Training (for "not started" status)
INSERT INTO in_service_trainings (
  title,
  description,
  category,
  ceu_hours,
  status,
  created_at
) VALUES (
  'HIPAA Compliance Training 2025',
  'Annual HIPAA compliance and patient privacy training required for all healthcare staff',
  'Compliance',
  2.0,
  'published',
  NOW()
) ON CONFLICT DO NOTHING
RETURNING id, title;

-- Training 2: CPR & First Aid Certification (for "in progress" status)
INSERT INTO in_service_trainings (
  title,
  description,
  category,
  ceu_hours,
  status,
  created_at
) VALUES (
  'CPR & First Aid Certification',
  'Basic life support and emergency response training',
  'Safety',
  4.0,
  'published',
  NOW()
) ON CONFLICT DO NOTHING
RETURNING id, title;

-- Training 3: Infection Control Protocols (for "completed" status)
INSERT INTO in_service_trainings (
  title,
  description,
  category,
  ceu_hours,
  status,
  created_at
) VALUES (
  'Infection Control & Prevention',
  'Best practices for infection control in healthcare settings',
  'Clinical',
  3.0,
  'published',
  NOW()
) ON CONFLICT DO NOTHING
RETURNING id, title;

-- =====================================================
-- STEP 2: Show the trainings we just created
-- =====================================================
SELECT 
  'Available Trainings' as info,
  id,
  title,
  category,
  ceu_hours,
  status
FROM in_service_trainings
WHERE title IN (
  'HIPAA Compliance Training 2025',
  'CPR & First Aid Certification',
  'Infection Control & Prevention'
)
ORDER BY title;

-- =====================================================
-- STEP 3: Assign trainings to Clark Lim
-- =====================================================

-- Insert assignments for each training
INSERT INTO in_service_assignments (
  training_id,
  assigned_to_type,
  assigned_to_value,
  assigned_employee_ids,
  assigned_date,
  due_date,
  status,
  priority,
  notes,
  created_at
)
SELECT 
  id,
  'individual'::text,
  'Clark Lim'::text,
  ARRAY['9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1']::uuid[],
  NOW(),
  NOW() + INTERVAL '30 days',
  'active',
  'high',
  'Sample training assignment for testing',
  NOW()
FROM in_service_trainings
WHERE title IN (
  'HIPAA Compliance Training 2025',
  'CPR & First Aid Certification',
  'Infection Control & Prevention'
)
ON CONFLICT DO NOTHING
RETURNING id, training_id, assigned_to_type;

-- =====================================================
-- STEP 4: Create enrollments for different statuses
-- =====================================================

-- STATUS 1: NOT STARTED (enrolled but not started)
-- Get HIPAA training and create enrollment
INSERT INTO in_service_enrollments (
  training_id,
  employee_id,
  enrollment_date,
  status,
  progress,
  completed_modules,
  created_at
)
SELECT 
  id,
  '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1'::uuid,
  NOW(),
  'enrolled',
  0,
  '[]'::jsonb,
  NOW()
FROM in_service_trainings
WHERE title = 'HIPAA Compliance Training 2025'
LIMIT 1
ON CONFLICT (training_id, employee_id) DO NOTHING
RETURNING id, training_id, status;

-- STATUS 2: IN PROGRESS (started but not completed)
-- Get CPR training and create enrollment
INSERT INTO in_service_enrollments (
  training_id,
  employee_id,
  enrollment_date,
  start_date,
  status,
  progress,
  completed_modules,
  last_accessed,
  created_at
)
SELECT 
  id,
  '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1'::uuid,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days',
  'in_progress',
  45,
  '[]'::jsonb,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '5 days'
FROM in_service_trainings
WHERE title = 'CPR & First Aid Certification'
LIMIT 1
ON CONFLICT (training_id, employee_id) DO NOTHING
RETURNING id, training_id, status, progress;

-- STATUS 3: COMPLETED
-- Get Infection Control training, create enrollment AND completion
WITH infection_training AS (
  SELECT id FROM in_service_trainings 
  WHERE title = 'Infection Control & Prevention'
  LIMIT 1
),
-- First create/update enrollment
enrollment AS (
  INSERT INTO in_service_enrollments (
    training_id,
    employee_id,
    enrollment_date,
    start_date,
    status,
    progress,
    completed_modules,
    last_accessed,
    created_at
  )
  SELECT 
    id,
    '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1'::uuid,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '10 days',
    'completed',
    100,
    '[]'::jsonb,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '15 days'
  FROM infection_training
  ON CONFLICT (training_id, employee_id) 
  DO UPDATE SET
    status = 'completed',
    progress = 100
  RETURNING id, training_id
)
-- Then create completion record
INSERT INTO in_service_completions (
  enrollment_id,
  training_id,
  employee_id,
  completion_date,
  score,
  ceu_hours_earned,
  certificate_number,
  quiz_attempts,
  final_quiz_score,
  created_at
)
SELECT 
  e.id,
  e.training_id,
  '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1'::uuid,
  NOW() - INTERVAL '5 days',
  92.5,
  3.0,
  'CERT-' || EXTRACT(EPOCH FROM NOW())::bigint,
  1,
  92.5,
  NOW() - INTERVAL '5 days'
FROM enrollment e
ON CONFLICT (enrollment_id) DO NOTHING
RETURNING id, training_id, completion_date, score;

-- =====================================================
-- STEP 5: Verify the setup
-- =====================================================

-- Show all trainings for Clark Lim
SELECT 
  '=== CLARK LIM TRAINING STATUS ===' as info,
  t.title,
  e.status,
  e.progress,
  e.enrollment_date,
  e.start_date,
  CASE 
    WHEN c.id IS NOT NULL THEN 'COMPLETED ✓'
    WHEN e.status = 'in_progress' THEN 'IN PROGRESS ⟳'
    WHEN e.status = 'enrolled' THEN 'NOT STARTED ○'
    ELSE 'UNKNOWN'
  END as display_status,
  c.completion_date,
  c.score,
  c.certificate_number
FROM in_service_enrollments e
LEFT JOIN in_service_trainings t ON e.training_id = t.id
LEFT JOIN in_service_completions c ON e.id = c.enrollment_id
WHERE e.employee_id = '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1'
ORDER BY 
  CASE 
    WHEN e.status = 'enrolled' THEN 1
    WHEN e.status = 'in_progress' THEN 2
    WHEN e.status = 'completed' THEN 3
    ELSE 4
  END;

-- Show summary
SELECT 
  '📊 SUMMARY' as info,
  COUNT(*) FILTER (WHERE e.status = 'enrolled') as "NOT STARTED",
  COUNT(*) FILTER (WHERE e.status = 'in_progress') as "IN PROGRESS",
  COUNT(*) FILTER (WHERE c.id IS NOT NULL) as "COMPLETED",
  COUNT(*) as "TOTAL"
FROM in_service_enrollments e
LEFT JOIN in_service_completions c ON e.id = c.enrollment_id
WHERE e.employee_id = '9d698bc3-7fa6-47d0-8dfe-d2668f2a57a1';

