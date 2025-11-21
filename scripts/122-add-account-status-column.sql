-- =====================================================
-- ADD ACCOUNT_STATUS COLUMN
-- =====================================================
-- Adds a separate column for tracking login access status
-- Keeps is_active for general physician active/inactive status
-- =====================================================

-- Add account_status column for login access control
ALTER TABLE physicians 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'inactive' 
CHECK (account_status IN ('active', 'inactive', 'suspended', 'pending'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_physicians_account_status ON physicians(account_status);

-- Add comment for documentation
COMMENT ON COLUMN physicians.account_status IS 'Login access status: active (can login), inactive (no login), suspended (temporarily blocked), pending (awaiting activation)';

-- Set default account_status based on existing data
UPDATE physicians 
SET account_status = CASE 
  WHEN email IS NOT NULL AND password_hash IS NOT NULL THEN 'pending'
  ELSE 'inactive'
END
WHERE account_status = 'inactive';

-- =====================================================
-- EXPLANATION OF COLUMN USAGE
-- =====================================================
-- 
-- is_active (existing):
--   - General physician status in the system
--   - true = physician is active in the practice
--   - false = physician no longer with practice / removed
--   - Used for filtering physicians in admin views
-- 
-- account_status (new):
--   - Specific to login access and portal permissions
--   - 'active' = can login to doctor portal
--   - 'inactive' = cannot login (not yet activated)
--   - 'pending' = has credentials but waiting for admin activation
--   - 'suspended' = temporarily blocked from logging in
-- 
-- Both can be used independently:
--   - is_active = true, account_status = 'inactive' → Physician in practice but no portal access
--   - is_active = true, account_status = 'active' → Physician in practice with portal access
--   - is_active = false, account_status = 'active' → Physician left but can still login (should be cleaned up)
-- 
-- =====================================================

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ account_status column added successfully!';
  RAISE NOTICE '📋 Use account_status for login access control';
  RAISE NOTICE '🔐 Separate from is_active (general physician status)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Status Values:';
  RAISE NOTICE '   - active: Can login to portal';
  RAISE NOTICE '   - inactive: Cannot login (default)';
  RAISE NOTICE '   - pending: Has credentials, awaiting activation';
  RAISE NOTICE '   - suspended: Temporarily blocked';
END $$;

