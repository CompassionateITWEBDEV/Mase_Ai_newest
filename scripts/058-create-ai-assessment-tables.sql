-- AI Competency Assessment Tables

-- Main AI assessment evaluations table
CREATE TABLE IF NOT EXISTS public.staff_ai_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  competency_evaluation_id UUID REFERENCES public.staff_competency_evaluations(id) ON DELETE SET NULL,
  evaluator_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  assessment_type TEXT NOT NULL, -- 'live' | 'recorded'
  competency_area TEXT NOT NULL, -- 'clinical-assessment', 'medication-admin', 'wound-care', etc.
  overall_score DECIMAL(5, 2) DEFAULT 0,
  ai_confidence DECIMAL(5, 2) DEFAULT 0, -- AI confidence in the assessment (0-100)
  evaluation_time INTEGER, -- duration in seconds
  video_url TEXT, -- URL to stored video if recorded
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI assessment competency scores (detailed breakdown)
CREATE TABLE IF NOT EXISTS public.staff_ai_assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.staff_ai_assessments(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'Clinical Skills', 'Communication', 'Safety', etc.
  score DECIMAL(5, 2) NOT NULL,
  confidence DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI assessment observations (what the AI detected)
CREATE TABLE IF NOT EXISTS public.staff_ai_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.staff_ai_assessments(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  observation TEXT NOT NULL,
  timestamp TEXT, -- e.g. "00:02:15" for video timestamp
  confidence DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI assessment recommendations
CREATE TABLE IF NOT EXISTS public.staff_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.staff_ai_assessments(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  type TEXT DEFAULT 'improvement' CHECK (type IN ('improvement', 'strength', 'training', 'compliance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI assessment evidence (timestamps and descriptions from video/audio)
CREATE TABLE IF NOT EXISTS public.staff_ai_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.staff_ai_assessments(id) ON DELETE CASCADE,
  score_id UUID REFERENCES public.staff_ai_assessment_scores(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL, -- e.g. "00:02:15"
  description TEXT NOT NULL,
  confidence DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_assessment_staff ON public.staff_ai_assessments(staff_id);
CREATE INDEX IF NOT EXISTS idx_ai_assessment_eval ON public.staff_ai_assessments(competency_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_ai_assessment_status ON public.staff_ai_assessments(status);
CREATE INDEX IF NOT EXISTS idx_ai_assessment_type ON public.staff_ai_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_ai_assessment_date ON public.staff_ai_assessments(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_scores_assessment ON public.staff_ai_assessment_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_ai_observations_assessment ON public.staff_ai_observations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_assessment ON public.staff_ai_recommendations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_ai_evidence_assessment ON public.staff_ai_evidence(assessment_id);

-- Enable RLS
ALTER TABLE public.staff_ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_ai_assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_ai_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_ai_evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_assessments' AND policyname = 'ai_assessments_read') THEN
    CREATE POLICY "ai_assessments_read" ON public.staff_ai_assessments FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_assessment_scores' AND policyname = 'ai_scores_read') THEN
    CREATE POLICY "ai_scores_read" ON public.staff_ai_assessment_scores FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_observations' AND policyname = 'ai_observations_read') THEN
    CREATE POLICY "ai_observations_read" ON public.staff_ai_observations FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_recommendations' AND policyname = 'ai_recommendations_read') THEN
    CREATE POLICY "ai_recommendations_read" ON public.staff_ai_recommendations FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_evidence' AND policyname = 'ai_evidence_read') THEN
    CREATE POLICY "ai_evidence_read" ON public.staff_ai_evidence FOR SELECT USING (true);
  END IF;
END $$;

-- Service role can do everything
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_assessments' AND policyname = 'ai_assessments_service_role') THEN
    CREATE POLICY "ai_assessments_service_role" ON public.staff_ai_assessments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_assessment_scores' AND policyname = 'ai_scores_service_role') THEN
    CREATE POLICY "ai_scores_service_role" ON public.staff_ai_assessment_scores FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_observations' AND policyname = 'ai_observations_service_role') THEN
    CREATE POLICY "ai_observations_service_role" ON public.staff_ai_observations FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_recommendations' AND policyname = 'ai_recommendations_service_role') THEN
    CREATE POLICY "ai_recommendations_service_role" ON public.staff_ai_recommendations FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_ai_evidence' AND policyname = 'ai_evidence_service_role') THEN
    CREATE POLICY "ai_evidence_service_role" ON public.staff_ai_evidence FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.staff_ai_assessments IS 'Stores AI-powered competency assessment results';
COMMENT ON TABLE public.staff_ai_assessment_scores IS 'Detailed competency scores from AI analysis';
COMMENT ON TABLE public.staff_ai_observations IS 'AI-detected observations and behaviors during assessment';
COMMENT ON TABLE public.staff_ai_recommendations IS 'AI-generated recommendations for improvement or strengths';
COMMENT ON TABLE public.staff_ai_evidence IS 'Evidence timestamps and descriptions from video/audio analysis';

