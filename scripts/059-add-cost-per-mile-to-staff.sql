-- Add cost_per_mile column to staff table for customizable cost tracking
-- This allows each staff member to have their own cost per mile rate
-- Defaults to IRS standard rate of $0.67/mile

-- Add cost_per_mile column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff' 
    AND column_name = 'cost_per_mile'
  ) THEN
    ALTER TABLE public.staff 
    ADD COLUMN cost_per_mile DECIMAL(10, 2) DEFAULT 0.67;
    
    -- Add comment
    COMMENT ON COLUMN public.staff.cost_per_mile IS 'Cost per mile for this staff member. Defaults to IRS standard rate of $0.67/mile. Can be customized per staff or vehicle.';
  END IF;
END $$;

-- Update existing staff records to have default cost_per_mile if NULL
UPDATE public.staff 
SET cost_per_mile = 0.67 
WHERE cost_per_mile IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_cost_per_mile ON public.staff(cost_per_mile);

COMMENT ON TABLE public.staff IS 'Staff members table with customizable cost per mile for GPS tracking and performance analysis';

