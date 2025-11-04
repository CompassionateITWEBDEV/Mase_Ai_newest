-- Create cancellation requests table for staff shift cancellations
CREATE TABLE IF NOT EXISTS public.staff_shift_cancel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.staff_shifts(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'declined'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.staff_shift_cancel_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_shift_cancel_requests' AND policyname = 'Allow read for authenticated'
  ) THEN
    CREATE POLICY "Allow read for authenticated" ON public.staff_shift_cancel_requests
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_shift_cancel_requests' AND policyname = 'Allow all with service role'
  ) THEN
    CREATE POLICY "Allow all with service role" ON public.staff_shift_cancel_requests
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;




