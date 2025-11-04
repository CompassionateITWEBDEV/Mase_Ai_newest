-- Link Staff Competency Evaluations with Self Evaluations

-- Add evaluation_id column to link self-evaluations to competency evaluations
ALTER TABLE public.staff_self_evaluations
ADD COLUMN IF NOT EXISTS competency_evaluation_id UUID REFERENCES public.staff_competency_evaluations(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_self_eval_competency_eval ON public.staff_self_evaluations(competency_evaluation_id);

-- Add link from competency_evaluations to track if self-evaluation is required
ALTER TABLE public.staff_competency_evaluations
ADD COLUMN IF NOT EXISTS self_evaluation_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS self_evaluation_status TEXT CHECK (self_evaluation_status IN ('pending', 'submitted', 'not-required'));

-- Comment for documentation
COMMENT ON COLUMN public.staff_self_evaluations.competency_evaluation_id IS 'Links self-evaluation to a specific competency evaluation when evaluation_type is competency';
COMMENT ON COLUMN public.staff_competency_evaluations.self_evaluation_required IS 'Whether staff member needs to complete self-evaluation';
COMMENT ON COLUMN public.staff_competency_evaluations.self_evaluation_status IS 'Status of self-evaluation completion';

