-- ========================================
-- CHECK STAFF TABLE ONLY (For Assignments)
-- ========================================

-- 1. Count active staff members
SELECT COUNT(*) as total_active_staff 
FROM staff 
WHERE is_active = true;

-- 2. List all active staff members
SELECT 
  id, 
  name, 
  email, 
  role_id, 
  department, 
  credentials, 
  is_active,
  created_at
FROM staff
WHERE is_active = true
ORDER BY name;

-- ========================================
-- CHECK FOR DUPLICATES BETWEEN TABLES
-- ========================================

-- 3. Check if any staff members are ALSO hired applicants
-- (This would cause duplicates if we combine both tables)
SELECT 
  s.name as staff_name,
  s.email as staff_email,
  s.id as staff_id,
  a.first_name || ' ' || a.last_name as applicant_name,
  a.email as applicant_email,
  a.id as applicant_id,
  ja.status as application_status
FROM staff s
LEFT JOIN applicants a ON LOWER(TRIM(s.email)) = LOWER(TRIM(a.email))
LEFT JOIN job_applications ja ON a.id = ja.applicant_id
WHERE s.is_active = true
  AND (ja.status IN ('accepted', 'hired') OR ja.status IS NULL)
ORDER BY s.name;

-- ========================================
-- WHAT THE API RETURNS (Assignment Tab):
-- ========================================
-- The API (/api/employees/list) returns ONLY staff table
-- NO hired applicants are included
-- This prevents duplicates when same person exists in both tables

-- ========================================
-- EXPECTED RESULTS:
-- Query 1: Should show count of staff (e.g., 4 or 5)
-- Query 2: Should list ONLY staff members (no applicants)
-- Query 3: Should show if any staff are ALSO applicants
--          (this is WHY we don't combine - to prevent duplicates)
-- ========================================

