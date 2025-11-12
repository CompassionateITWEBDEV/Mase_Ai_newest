-- Add 'scheduled' status to staff_visits table check constraint
-- This allows appointments to be created with 'scheduled' status before they start

-- First, drop the existing constraint
ALTER TABLE IF EXISTS public.staff_visits
DROP CONSTRAINT IF EXISTS staff_visits_status_check;

-- Add the new constraint with 'scheduled' status included
ALTER TABLE IF EXISTS public.staff_visits
ADD CONSTRAINT staff_visits_status_check 
CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));

-- Update default status to 'scheduled' for new appointments
ALTER TABLE IF EXISTS public.staff_visits
ALTER COLUMN status SET DEFAULT 'scheduled';

-- Make start_time nullable for scheduled appointments (it will be set when visit actually starts)
ALTER TABLE IF EXISTS public.staff_visits
ALTER COLUMN start_time DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.staff_visits.status IS 'Visit status: scheduled (future appointment), in_progress (currently happening), completed (finished), cancelled (cancelled)';

