-- Add columns for module quiz scores and time tracking
-- These columns track per-module quiz scores and time spent

ALTER TABLE public.in_service_enrollments
ADD COLUMN IF NOT EXISTS module_quiz_scores JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS module_time_spent JSONB DEFAULT '{}'::jsonb;

-- Add comments to explain the columns
COMMENT ON COLUMN public.in_service_enrollments.module_quiz_scores IS 'Tracks quiz scores per module: {moduleId: score}';
COMMENT ON COLUMN public.in_service_enrollments.module_time_spent IS 'Tracks time spent per module in seconds: {moduleId: seconds}';

