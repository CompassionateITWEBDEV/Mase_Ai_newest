-- Staff Competency Assessment Tables

-- Main competency evaluations table
CREATE TABLE IF NOT EXISTS public.staff_competency_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  evaluator_name TEXT,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('initial', 'annual', 'skills-validation', 'performance-improvement')),
  overall_score DECIMAL(5, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in-progress', 'completed', 'needs-improvement', 'not-competent')),
  next_evaluation_due DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competency areas/categories within an evaluation
CREATE TABLE IF NOT EXISTS public.staff_competency_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.staff_competency_evaluations(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  description TEXT,
  weight INTEGER DEFAULT 0, -- percentage weight (0-100)
  category_score DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual skills/competencies
CREATE TABLE IF NOT EXISTS public.staff_competency_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.staff_competency_areas(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  assessment_method TEXT CHECK (assessment_method IN ('demonstration', 'written', 'observation', 'simulation')),
  passing_score INTEGER DEFAULT 80,
  self_assessment_score INTEGER,
  supervisor_assessment_score INTEGER,
  final_score INTEGER,
  status TEXT NOT NULL DEFAULT 'not-assessed' CHECK (status IN ('not-assessed', 'competent', 'needs-improvement', 'not-competent')),
  last_assessed DATE,
  next_due DATE,
  evidence JSONB DEFAULT '[]'::jsonb, -- Array of evidence strings
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Improvement Plans (PIPs)
CREATE TABLE IF NOT EXISTS public.staff_pip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.staff_competency_evaluations(id) ON DELETE SET NULL,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  target_completion_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'extended', 'cancelled')),
  supervisor_id UUID REFERENCES public.staff(id),
  supervisor_name TEXT,
  review_dates DATE[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PIP Goals
CREATE TABLE IF NOT EXISTS public.staff_pip_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pip_id UUID NOT NULL REFERENCES public.staff_pip(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  target_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  actions JSONB DEFAULT '[]'::jsonb, -- Array of action items
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certifications/licenses linked to evaluations
CREATE TABLE IF NOT EXISTS public.staff_competency_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES public.staff_competency_evaluations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date DATE,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending-renewal')),
  renewal_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competency_eval_staff ON public.staff_competency_evaluations(staff_id);
CREATE INDEX IF NOT EXISTS idx_competency_eval_type ON public.staff_competency_evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_competency_eval_status ON public.staff_competency_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_competency_eval_date ON public.staff_competency_evaluations(evaluation_date);

CREATE INDEX IF NOT EXISTS idx_competency_area_eval ON public.staff_competency_areas(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_competency_skill_area ON public.staff_competency_skills(area_id);
CREATE INDEX IF NOT EXISTS idx_competency_skill_status ON public.staff_competency_skills(status);

CREATE INDEX IF NOT EXISTS idx_pip_staff ON public.staff_pip(staff_id);
CREATE INDEX IF NOT EXISTS idx_pip_status ON public.staff_pip(status);
CREATE INDEX IF NOT EXISTS idx_pip_goals_pip ON public.staff_pip_goals(pip_id);

CREATE INDEX IF NOT EXISTS idx_certs_staff ON public.staff_competency_certifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_certs_eval ON public.staff_competency_certifications(evaluation_id);

-- Enable RLS
ALTER TABLE public.staff_competency_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_competency_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_competency_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_pip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_pip_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_competency_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated read, service role write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_competency_evaluations' AND policyname = 'competency_eval_read') THEN
    CREATE POLICY "competency_eval_read" ON public.staff_competency_evaluations FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_competency_areas' AND policyname = 'competency_area_read') THEN
    CREATE POLICY "competency_area_read" ON public.staff_competency_areas FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_competency_skills' AND policyname = 'competency_skill_read') THEN
    CREATE POLICY "competency_skill_read" ON public.staff_competency_skills FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_pip' AND policyname = 'pip_read') THEN
    CREATE POLICY "pip_read" ON public.staff_pip FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_pip_goals' AND policyname = 'pip_goals_read') THEN
    CREATE POLICY "pip_goals_read" ON public.staff_pip_goals FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_competency_certifications' AND policyname = 'certs_read') THEN
    CREATE POLICY "certs_read" ON public.staff_competency_certifications FOR SELECT USING (true);
  END IF;
END $$;

-- Service role can do everything
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_competency_evaluations' AND policyname = 'competency_eval_service_role') THEN
    CREATE POLICY "competency_eval_service_role" ON public.staff_competency_evaluations FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_competency_areas' AND policyname = 'competency_area_service_role') THEN
    CREATE POLICY "competency_area_service_role" ON public.staff_competency_areas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_competency_skills' AND policyname = 'competency_skill_service_role') THEN
    CREATE POLICY "competency_skill_service_role" ON public.staff_competency_skills FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_pip' AND policyname = 'pip_service_role') THEN
    CREATE POLICY "pip_service_role" ON public.staff_pip FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_pip_goals' AND policyname = 'pip_goals_service_role') THEN
    CREATE POLICY "pip_goals_service_role" ON public.staff_pip_goals FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_competency_certifications' AND policyname = 'certs_service_role') THEN
    CREATE POLICY "certs_service_role" ON public.staff_competency_certifications FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.staff_competency_evaluations IS 'Main competency evaluation records';
COMMENT ON TABLE public.staff_competency_areas IS 'Competency areas/categories within evaluations';
COMMENT ON TABLE public.staff_competency_skills IS 'Individual skills assessed within competency areas';
COMMENT ON TABLE public.staff_pip IS 'Performance Improvement Plans for staff needing improvement';
COMMENT ON TABLE public.staff_pip_goals IS 'Goals within Performance Improvement Plans';

