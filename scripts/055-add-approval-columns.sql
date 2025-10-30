-- Add approval/review columns for staff self evaluations

ALTER TABLE staff_self_evaluations
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;


