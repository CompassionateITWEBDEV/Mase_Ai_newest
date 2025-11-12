-- Add cancel_reason column to staff_visits table
-- This allows storing the reason when a visit is cancelled

ALTER TABLE IF EXISTS public.staff_visits 
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.staff_visits.cancel_reason IS 'Reason provided when visit is cancelled';

