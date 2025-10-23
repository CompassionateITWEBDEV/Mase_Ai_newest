-- Add test employer for testing employer dashboard
-- Based on the actual employees table structure from Supabase

INSERT INTO employees (
  id,
  uuid,
  email,
  first_name,
  last_name,
  phone,
  address,
  city,
  state,
  zip_code,
  company_name,
  company_type,
  hiring_plan,
  is_hired,
  is_verified,
  marketing_opt_in,
  created_at,
  updated_at,
  last_login,
  timezone
) VALUES (
  'emp_test_001',
  '550e8400-e29b-41d4-a716-446655440001',
  'john.smith@serenityrehab.com',
  'John',
  'Smith',
  '(248) 555-0100',
  '123 Healthcare Drive',
  'Detroit',
  'MI',
  '48201',
  'Serenity Rehabilitation Center',
  'healthcare',
  'enterprise',
  false,
  true,
  true,
  NOW(),
  NOW(),
  NOW(),
  'America/Detroit'
);

-- Add a test job posting for this employer
INSERT INTO job_postings (
  id,
  employer_id,
  title,
  description,
  department,
  job_type,
  position_type,
  experience_required,
  education_required,
  requirements,
  benefits,
  salary_min,
  salary_max,
  salary_type,
  city,
  state,
  zip_code,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'emp_test_001',
  'Physical Therapist',
  'We are seeking a skilled Physical Therapist to join our team. The ideal candidate will have experience in outpatient rehabilitation and be passionate about helping patients recover and improve their quality of life.',
  'Physical Therapy',
  'Full-time',
  'Permanent',
  '2-5 years',
  'Doctorate in Physical Therapy',
  '• Valid PT license in Michigan
• CPR certification
• Experience with outpatient rehabilitation
• Strong communication skills
• Ability to work independently and as part of a team',
  '• Competitive salary
• Health insurance
• Dental insurance
• Vision insurance
• 401(k) matching
• Paid time off
• Continuing education allowance',
  75000,
  95000,
  'yearly',
  'Detroit',
  'MI',
  '48201',
  NOW(),
  NOW()
);

-- Add another job posting
INSERT INTO job_postings (
  id,
  employer_id,
  title,
  description,
  department,
  job_type,
  position_type,
  experience_required,
  education_required,
  requirements,
  benefits,
  salary_min,
  salary_max,
  salary_type,
  city,
  state,
  zip_code,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'emp_test_001',
  'Occupational Therapist',
  'Join our team as an Occupational Therapist and help patients regain independence in their daily activities. We offer a supportive environment with opportunities for professional growth.',
  'Occupational Therapy',
  'Full-time',
  'Permanent',
  '1-3 years',
  'Master''s in Occupational Therapy',
  '• Valid OT license in Michigan
• CPR certification
• Experience with adult rehabilitation
• Knowledge of adaptive equipment
• Strong assessment skills',
  '• Competitive salary
• Health insurance
• Dental insurance
• Vision insurance
• 401(k) matching
• Paid time off
• Professional development opportunities',
  70000,
  90000,
  'yearly',
  'Detroit',
  'MI',
  '48201',
  NOW(),
  NOW()
);

-- Add some test applications for these job postings
INSERT INTO applications (
  id,
  applicant_id,
  job_posting_id,
  status,
  applied_at,
  cover_letter,
  resume_url,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440002',
  'hired',
  NOW() - INTERVAL '5 days',
  'I am very interested in this Physical Therapist position and believe my experience in outpatient rehabilitation makes me a great fit.',
  'https://example.com/resume1.pdf',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '2 days'
);

INSERT INTO applications (
  id,
  applicant_id,
  job_posting_id,
  status,
  applied_at,
  cover_letter,
  resume_url,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440003',
  'accepted',
  NOW() - INTERVAL '3 days',
  'I am excited about the opportunity to work as an Occupational Therapist at Serenity Rehabilitation Center.',
  'https://example.com/resume2.pdf',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 day'
);

INSERT INTO applications (
  id,
  applicant_id,
  job_posting_id,
  status,
  applied_at,
  cover_letter,
  resume_url,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440002',
  'pending',
  NOW() - INTERVAL '1 day',
  'I would like to apply for the Physical Therapist position.',
  'https://example.com/resume3.pdf',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
);



