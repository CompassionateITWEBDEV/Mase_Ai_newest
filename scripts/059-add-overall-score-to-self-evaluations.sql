-- Add overall_score column to staff_self_evaluations

ALTER TABLE staff_self_evaluations
  ADD COLUMN IF NOT EXISTS overall_score DECIMAL(5, 2);

