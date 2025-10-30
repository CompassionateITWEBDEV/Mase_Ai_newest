-- Create staff_shifts table for Staff Schedule feature
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon .. 6=Sun
  start_time TEXT NOT NULL, -- e.g. '08:00'
  end_time TEXT NOT NULL,   -- e.g. '17:00'
  shift_type TEXT DEFAULT 'field', -- 'office' | 'field'
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff ON public.staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_day ON public.staff_shifts(day_of_week);

-- Enable RLS and allow authenticated read, and service-role writes
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_shifts' AND policyname = 'Allow read for authenticated'
  ) THEN
    CREATE POLICY "Allow read for authenticated" ON public.staff_shifts
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_shifts' AND policyname = 'Allow all with service role'
  ) THEN
    CREATE POLICY "Allow all with service role" ON public.staff_shifts
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.staff_shifts IS 'Stores weekly shifts for each staff member for the Staff Schedule UI';


