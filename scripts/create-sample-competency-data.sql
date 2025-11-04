-- Script to create sample competency assessment data
-- This creates test data that will show progress bars in the Staff Assessments tab

-- Step 1: Get or create test staff members (if they don't exist)
-- Note: Replace these UUIDs with actual staff IDs from your database

-- First, let's find existing staff or create test staff
DO $$
DECLARE
  test_staff_id UUID;
  test_evaluator_id UUID;
  eval_id UUID;
  area1_id UUID;
  area2_id UUID;
  area3_id UUID;
  area4_id UUID;
  area5_id UUID;
BEGIN
  -- Get first staff member as test subject (or create one)
  SELECT id INTO test_staff_id 
  FROM staff 
  LIMIT 1;
  
  -- Get first staff member as evaluator
  SELECT id INTO test_evaluator_id 
  FROM staff 
  LIMIT 1;
  
  -- If no staff exists, create test staff
  IF test_staff_id IS NULL THEN
    INSERT INTO staff (id, email, name, department, is_active)
    VALUES 
      (gen_random_uuid(), 'sarah.johnson@test.com', 'Sarah Johnson', 'RN', true),
      (gen_random_uuid(), 'lisa.garcia@test.com', 'Lisa Garcia', 'LPN', true)
    RETURNING id INTO test_staff_id;
  END IF;
  
  IF test_evaluator_id IS NULL THEN
    SELECT id INTO test_evaluator_id FROM staff LIMIT 1;
  END IF;
  
  -- Create evaluation for Sarah Johnson (or first staff)
  INSERT INTO staff_competency_evaluations (
    staff_id,
    evaluator_id,
    evaluator_name,
    evaluation_date,
    evaluation_type,
    overall_score,
    status,
    next_evaluation_due
  ) VALUES (
    test_staff_id,
    test_evaluator_id,
    'Dr. Martinez',
    CURRENT_DATE,
    'annual',
    91.0,
    'completed',
    (CURRENT_DATE + INTERVAL '6 months')::DATE
  ) RETURNING id INTO eval_id;
  
  RAISE NOTICE 'Created evaluation with ID: %', eval_id;
  
  -- Create Competency Area 1: Safety & Compliance (Weight: 25%)
  INSERT INTO staff_competency_areas (
    evaluation_id,
    category_name,
    description,
    weight,
    category_score
  ) VALUES (
    eval_id,
    'Safety & Compliance',
    'Demonstrates knowledge and adherence to safety protocols',
    25,
    100.0
  ) RETURNING id INTO area1_id;
  
  -- Add skills to Safety & Compliance (3 skills, all competent)
  INSERT INTO staff_competency_skills (
    area_id,
    skill_name,
    description,
    required,
    assessment_method,
    passing_score,
    supervisor_assessment_score,
    final_score,
    status,
    last_assessed
  ) VALUES
    (area1_id, 'Hand hygiene protocols', 'Follows proper hand hygiene procedures', true, 'observation', 80, 95, 95, 'competent', CURRENT_DATE),
    (area1_id, 'Infection control measures', 'Implements infection control protocols correctly', true, 'observation', 80, 90, 90, 'competent', CURRENT_DATE),
    (area1_id, 'Safety equipment usage', 'Uses safety equipment appropriately', true, 'demonstration', 80, 100, 100, 'competent', CURRENT_DATE);
  
  -- Create Competency Area 2: Communication Skills (Weight: 20%)
  INSERT INTO staff_competency_areas (
    evaluation_id,
    category_name,
    description,
    weight,
    category_score
  ) VALUES (
    eval_id,
    'Communication Skills',
    'Effective communication with patients and team',
    20,
    100.0
  ) RETURNING id INTO area2_id;
  
  -- Add skills to Communication Skills (2 skills, all competent)
  INSERT INTO staff_competency_skills (
    area_id,
    skill_name,
    description,
    required,
    assessment_method,
    passing_score,
    supervisor_assessment_score,
    final_score,
    status,
    last_assessed
  ) VALUES
    (area2_id, 'Patient communication', 'Communicates clearly with patients', true, 'observation', 80, 95, 95, 'competent', CURRENT_DATE),
    (area2_id, 'Team communication', 'Effectively communicates with team members', true, 'observation', 80, 90, 90, 'competent', CURRENT_DATE);
  
  -- Create Competency Area 3: Documentation (Weight: 15%)
  INSERT INTO staff_competency_areas (
    evaluation_id,
    category_name,
    description,
    weight,
    category_score
  ) VALUES (
    eval_id,
    'Documentation',
    'Accurate and timely documentation practices',
    15,
    95.0
  ) RETURNING id INTO area3_id;
  
  -- Add skills to Documentation (4 skills, all competent)
  INSERT INTO staff_competency_skills (
    area_id,
    skill_name,
    description,
    required,
    assessment_method,
    passing_score,
    supervisor_assessment_score,
    final_score,
    status,
    last_assessed
  ) VALUES
    (area3_id, 'Chart documentation', 'Completes charts accurately', true, 'observation', 80, 95, 95, 'competent', CURRENT_DATE),
    (area3_id, 'Progress notes', 'Writes clear progress notes', true, 'observation', 80, 90, 90, 'competent', CURRENT_DATE),
    (area3_id, 'Medication records', 'Maintains accurate medication records', true, 'observation', 80, 95, 95, 'competent', CURRENT_DATE),
    (area3_id, 'Incident reporting', 'Completes incident reports properly', true, 'observation', 80, 100, 100, 'competent', CURRENT_DATE);
  
  -- Create Competency Area 4: Clinical Assessment (Weight: 25%)
  INSERT INTO staff_competency_areas (
    evaluation_id,
    category_name,
    description,
    weight,
    category_score
  ) VALUES (
    eval_id,
    'Clinical Assessment',
    'Performs clinical assessments accurately',
    25,
    95.0
  ) RETURNING id INTO area4_id;
  
  -- Add skills to Clinical Assessment (5 skills, all competent)
  INSERT INTO staff_competency_skills (
    area_id,
    skill_name,
    description,
    required,
    assessment_method,
    passing_score,
    supervisor_assessment_score,
    final_score,
    status,
    last_assessed
  ) VALUES
    (area4_id, 'Vital signs measurement', 'Accurately measures vital signs', true, 'demonstration', 80, 95, 95, 'competent', CURRENT_DATE),
    (area4_id, 'Physical assessment', 'Performs thorough physical assessments', true, 'observation', 80, 90, 90, 'competent', CURRENT_DATE),
    (area4_id, 'Pain assessment', 'Conducts proper pain assessments', true, 'observation', 80, 95, 95, 'competent', CURRENT_DATE),
    (area4_id, 'Wound assessment', 'Assesses wounds correctly', true, 'demonstration', 80, 90, 90, 'competent', CURRENT_DATE),
    (area4_id, 'Medication assessment', 'Assesses medication effectiveness', true, 'observation', 80, 100, 100, 'competent', CURRENT_DATE);
  
  -- Create Competency Area 5: Supervision & Delegation (Weight: 15%)
  INSERT INTO staff_competency_areas (
    evaluation_id,
    category_name,
    description,
    weight,
    category_score
  ) VALUES (
    eval_id,
    'Supervision & Delegation',
    'Effectively supervises and delegates tasks',
    15,
    90.0
  ) RETURNING id INTO area5_id;
  
  -- Add skills to Supervision & Delegation (3 skills, all competent)
  INSERT INTO staff_competency_skills (
    area_id,
    skill_name,
    description,
    required,
    assessment_method,
    passing_score,
    supervisor_assessment_score,
    final_score,
    status,
    last_assessed
  ) VALUES
    (area5_id, 'Task delegation', 'Delegates tasks appropriately', true, 'observation', 80, 90, 90, 'competent', CURRENT_DATE),
    (area5_id, 'Staff supervision', 'Supervises staff effectively', true, 'observation', 80, 85, 85, 'competent', CURRENT_DATE),
    (area5_id, 'Performance feedback', 'Provides constructive feedback', true, 'observation', 80, 95, 95, 'competent', CURRENT_DATE);
  
  RAISE NOTICE '✅ Sample competency data created successfully!';
  RAISE NOTICE 'Evaluation ID: %', eval_id;
  RAISE NOTICE 'Staff ID: %', test_staff_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Go to /staff-competency';
  RAISE NOTICE '2. Click "Staff Assessments" tab';
  RAISE NOTICE '3. You should see the assessment with progress bars!';
  
END $$;

-- Verification query - Run this to check what was created
SELECT 
  e.id as evaluation_id,
  s.name as staff_name,
  e.overall_score,
  e.status,
  e.evaluator_name,
  COUNT(DISTINCT a.id) as num_areas,
  COUNT(DISTINCT sk.id) as num_skills,
  COUNT(DISTINCT CASE WHEN sk.status = 'competent' THEN sk.id END) as competent_skills
FROM staff_competency_evaluations e
JOIN staff s ON s.id = e.staff_id
LEFT JOIN staff_competency_areas a ON a.evaluation_id = e.id
LEFT JOIN staff_competency_skills sk ON sk.area_id = a.id
WHERE e.evaluation_date >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY e.id, s.name, e.overall_score, e.status, e.evaluator_name
ORDER BY e.created_at DESC;


