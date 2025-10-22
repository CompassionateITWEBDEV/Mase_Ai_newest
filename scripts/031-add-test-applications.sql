-- Add test applications for employer dashboard testing
-- First, add some test applicants (using INSERT ... ON CONFLICT to handle existing emails)
INSERT INTO applicants (
  id,
  first_name,
  last_name,
  email,
  phone,
  profession,
  experience_level,
  education_level,
  city,
  state,
  created_at,
  updated_at
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', 'Sarah', 'Johnson', 'sarah.johnson@email.com', '(248) 555-0101', 'Physical Therapist', '2-5 years', 'Doctorate', 'Detroit', 'MI', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440011', 'Michael', 'Brown', 'michael.brown@email.com', '(248) 555-0102', 'Occupational Therapist', '1-3 years', 'Masters', 'Detroit', 'MI', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440012', 'Emily', 'Davis', 'emily.davis@email.com', '(248) 555-0103', 'Physical Therapist', '5+ years', 'Doctorate', 'Detroit', 'MI', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440013', 'David', 'Wilson', 'david.wilson@email.com', '(248) 555-0104', 'Occupational Therapist', '2-5 years', 'Masters', 'Detroit', 'MI', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440014', 'Lisa', 'Anderson', 'lisa.anderson@email.com', '(248) 555-0105', 'Physical Therapist', '1-3 years', 'Doctorate', 'Detroit', 'MI', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  profession = EXCLUDED.profession,
  experience_level = EXCLUDED.experience_level,
  education_level = EXCLUDED.education_level,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  updated_at = NOW();

-- Add test applications with different statuses (using INSERT ... ON CONFLICT to handle existing IDs)
INSERT INTO job_applications (
  id,
  applicant_id,
  employer_id,
  job_posting_id,
  job_title,
  job_type,
  status,
  cover_letter,
  notes,
  applied_date,
  updated_at
) VALUES 
  -- Hired applications
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Physical Therapist', 'Full-time', 'accepted', 'I am very interested in this position and would love to contribute to your team.', 'Excellent candidate, hired immediately', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
  
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Occupational Therapist', 'Full-time', 'hired', 'I have extensive experience in occupational therapy and am excited about this opportunity.', 'Great fit for the team', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
  
  -- Pending applications
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Physical Therapist', 'Full-time', 'pending', 'I am a highly experienced PT looking for new challenges.', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  
  ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Occupational Therapist', 'Full-time', 'pending', 'I am passionate about helping patients regain independence.', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  -- Interview scheduled
  ('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Physical Therapist', 'Full-time', 'interview_scheduled', 'I would love to discuss this opportunity further.', 'Interview scheduled for next week', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),
  
  -- Rejected application
  ('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Occupational Therapist', 'Full-time', 'rejected', 'I am interested in this position.', 'Not a good fit for this role', NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO UPDATE SET
  applicant_id = EXCLUDED.applicant_id,
  employer_id = EXCLUDED.employer_id,
  job_posting_id = EXCLUDED.job_posting_id,
  job_title = EXCLUDED.job_title,
  job_type = EXCLUDED.job_type,
  status = EXCLUDED.status,
  cover_letter = EXCLUDED.cover_letter,
  notes = EXCLUDED.notes,
  applied_date = EXCLUDED.applied_date,
  updated_at = NOW();

-- Update job_postings to have correct application counts
UPDATE job_postings 
SET applications_count = (
  SELECT COUNT(*) 
  FROM job_applications 
  WHERE job_posting_id = job_postings.id
)
WHERE id IN ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003');

-- Add comments
COMMENT ON TABLE job_applications IS 'Test applications for employer dashboard functionality testing';
