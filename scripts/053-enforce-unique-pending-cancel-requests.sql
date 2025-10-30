-- Ensure only one pending cancel request per shift
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_pending_cancel_per_shift'
  ) THEN
    CREATE UNIQUE INDEX uniq_pending_cancel_per_shift
      ON public.staff_shift_cancel_requests(shift_id)
      WHERE status = 'pending';
  END IF;
END $$;


