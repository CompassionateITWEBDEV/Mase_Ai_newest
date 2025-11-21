-- =====================================================
-- FIX STAFF NAMES FOR CONSULTATION DIALOG
-- =====================================================
-- This script ensures all staff members have proper names
-- =====================================================

-- Check current staff data
SELECT id, name, email, role_id FROM staff;

-- Update staff without names to have a proper name based on email
UPDATE staff 
SET name = CASE 
  WHEN name IS NULL OR name = '' THEN 
    COALESCE(
      split_part(email, '@', 1),  -- Use email prefix as fallback
      'Staff Member'
    )
  ELSE name
END
WHERE name IS NULL OR name = '';

-- Verify the update
SELECT id, name, email, role_id FROM staff;

-- =====================================================
-- If you need to manually set names, use this format:
-- =====================================================
-- UPDATE staff SET name = 'John Doe' WHERE email = 'john@example.com';
-- UPDATE staff SET name = 'Jane Smith' WHERE email = 'jane@example.com';

DO $$
BEGIN
  RAISE NOTICE '✅ Staff names updated!';
  RAISE NOTICE '📋 Please verify the names are correct';
  RAISE NOTICE '💡 You can manually update names using:';
  RAISE NOTICE '   UPDATE staff SET name = ''Your Name'' WHERE id = ''staff-id'';';
END $$;

