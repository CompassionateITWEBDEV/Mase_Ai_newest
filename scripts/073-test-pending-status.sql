-- Test Script: Set Physician to Pending Status
-- Use this to manually test the pending status display

-- Set a specific physician to pending status (replace the NPI with your test physician)
UPDATE public.physicians 
SET 
    verification_status = 'pending',
    last_verified = NULL,
    caqh_id = NULL
WHERE npi = '1234567890';

-- Or set ALL physicians to pending for testing
-- UPDATE public.physicians 
-- SET 
--     verification_status = 'pending',
--     last_verified = NULL,
--     caqh_id = NULL
-- WHERE is_active = true;

-- Check the result
SELECT 
    npi,
    first_name,
    last_name,
    verification_status,
    last_verified,
    caqh_id
FROM public.physicians
ORDER BY created_at DESC;







