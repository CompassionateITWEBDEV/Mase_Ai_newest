-- Staff Self Evaluations table to store performance and competency self-assessments

-- Ensure gen_random_uuid() is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS staff_self_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id TEXT NOT NULL,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('performance','competency')),
  assessment_type TEXT NOT NULL, -- 'annual' | 'mid-year' | 'probationary' | 'initial' | 'skills-validation'
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved')),
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_staff_self_evals_staff_id ON staff_self_evaluations(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_self_evals_type ON staff_self_evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_staff_self_evals_status ON staff_self_evaluations(status);

-- Enable RLS and allow authenticated users basic access (adjust as needed)
ALTER TABLE staff_self_evaluations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_self_evaluations' AND policyname = 'staff_self_evaluations_all_authenticated'
  ) THEN
    CREATE POLICY staff_self_evaluations_all_authenticated ON staff_self_evaluations
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_staff_self_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_self_evaluations_updated_at ON staff_self_evaluations;
CREATE TRIGGER trg_staff_self_evaluations_updated_at
BEFORE UPDATE ON staff_self_evaluations
FOR EACH ROW EXECUTE FUNCTION set_staff_self_evaluations_updated_at();


