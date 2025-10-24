-- Create test users for authentication testing
-- This script creates test users in the auth.users table and corresponding profiles

-- Note: This is a template script. In practice, users should be created through the registration API
-- which properly handles Supabase Auth user creation and profile linking.

-- Example of what the registration API does:
-- 1. Creates user in auth.users via supabase.auth.signUp()
-- 2. Creates profile in applicants/employers table with auth_user_id

-- For testing purposes, you can manually create users in the Supabase dashboard:
-- 1. Go to Authentication > Users in Supabase dashboard
-- 2. Click "Add user" 
-- 3. Enter email and password
-- 4. Copy the user ID
-- 5. Insert profile data using the user ID

-- Example test applicant profile (after creating auth user):
/*
INSERT INTO applicants (
  auth_user_id,
  email,
  first_name,
  last_name,
  phone,
  profession,
  experience_level,
  education_level,
  city,
  state,
  is_active,
  email_verified
) VALUES (
  'USER_ID_FROM_AUTH_USERS', -- Replace with actual user ID from auth.users
  'test.applicant@example.com',
  'Test',
  'Applicant',
  '(555) 123-4567',
  'Physical Therapist',
  '2-5 years',
  'Doctorate',
  'Detroit',
  'MI',
  true,
  true
);
*/

-- Example test employer profile (after creating auth user):
/*
INSERT INTO employers (
  auth_user_id,
  email,
  first_name,
  last_name,
  phone,
  company_name,
  company_type,
  facility_size,
  city,
  state,
  is_active,
  email_verified
) VALUES (
  'USER_ID_FROM_AUTH_USERS', -- Replace with actual user ID from auth.users
  'test.employer@example.com',
  'Test',
  'Employer',
  '(555) 987-6543',
  'Test Healthcare Facility',
  'hospital',
  'large',
  'Detroit',
  'MI',
  true,
  true
);
*/

-- Example test staff profile (after creating auth user):
/*
INSERT INTO staff (
  user_id,
  email,
  name,
  role_id,
  department,
  is_active
) VALUES (
  'USER_ID_FROM_AUTH_USERS', -- Replace with actual user ID from auth.users
  'test.staff@example.com',
  'Test Staff',
  'admin',
  'IT',
  true
);
*/

-- Instructions for testing:
-- 1. Create users in Supabase Auth dashboard
-- 2. Copy their user IDs
-- 3. Run the appropriate INSERT statements above with the real user IDs
-- 4. Test login with the created credentials
