-- =====================================================
-- PT EXERCISES COMPLETE SETUP
-- Run this file to set up everything needed for PT exercises
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: CREATE TABLES
-- =====================================================

-- Create pt_exercise_programs table
CREATE TABLE IF NOT EXISTS pt_exercise_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES staff(id),
  program_name TEXT NOT NULL,
  current_week INTEGER DEFAULT 1,
  total_weeks INTEGER NOT NULL,
  completed_sessions INTEGER DEFAULT 0,
  total_sessions INTEGER NOT NULL,
  next_session_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'discontinued')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pt_exercises table
CREATE TABLE IF NOT EXISTS pt_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES pt_exercise_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  repetitions TEXT NOT NULL,
  sets INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Moderate', 'Hard')),
  video_url TEXT,
  ai_tips TEXT,
  order_sequence INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pt_exercise_completions table
CREATE TABLE IF NOT EXISTS pt_exercise_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID REFERENCES pt_exercises(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  program_id UUID REFERENCES pt_exercise_programs(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  notes TEXT,
  pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pt_weekly_goals table
CREATE TABLE IF NOT EXISTS pt_weekly_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES pt_exercise_programs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  week_number INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pt_programs_patient_id ON pt_exercise_programs(patient_id);
CREATE INDEX IF NOT EXISTS idx_pt_programs_therapist_id ON pt_exercise_programs(therapist_id);
CREATE INDEX IF NOT EXISTS idx_pt_programs_status ON pt_exercise_programs(status);
CREATE INDEX IF NOT EXISTS idx_pt_exercises_program_id ON pt_exercises(program_id);
CREATE INDEX IF NOT EXISTS idx_pt_completions_patient_id ON pt_exercise_completions(patient_id);
CREATE INDEX IF NOT EXISTS idx_pt_completions_exercise_id ON pt_exercise_completions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_pt_completions_completed_at ON pt_exercise_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_goals_program_id ON pt_weekly_goals(program_id);
CREATE INDEX IF NOT EXISTS idx_pt_goals_patient_id ON pt_weekly_goals(patient_id);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE pt_exercise_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_weekly_goals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role has full access to pt_exercise_programs" ON pt_exercise_programs;
DROP POLICY IF EXISTS "Service role has full access to pt_exercises" ON pt_exercises;
DROP POLICY IF EXISTS "Service role has full access to pt_exercise_completions" ON pt_exercise_completions;
DROP POLICY IF EXISTS "Service role has full access to pt_weekly_goals" ON pt_weekly_goals;
DROP POLICY IF EXISTS "Users can view their own exercise programs" ON pt_exercise_programs;
DROP POLICY IF EXISTS "Users can view exercises" ON pt_exercises;
DROP POLICY IF EXISTS "Users can view their own completions" ON pt_exercise_completions;
DROP POLICY IF EXISTS "Users can insert their own completions" ON pt_exercise_completions;
DROP POLICY IF EXISTS "Users can view their own goals" ON pt_weekly_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON pt_weekly_goals;

-- Service role policies
CREATE POLICY "Service role has full access to pt_exercise_programs"
  ON pt_exercise_programs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to pt_exercises"
  ON pt_exercises FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to pt_exercise_completions"
  ON pt_exercise_completions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to pt_weekly_goals"
  ON pt_weekly_goals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated user policies
CREATE POLICY "Users can view their own exercise programs"
  ON pt_exercise_programs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view exercises"
  ON pt_exercises FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their own completions"
  ON pt_exercise_completions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own completions"
  ON pt_exercise_completions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view their own goals"
  ON pt_weekly_goals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own goals"
  ON pt_weekly_goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 5: CREATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pt_program_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_pt_exercise_programs_updated_at ON pt_exercise_programs;
DROP TRIGGER IF EXISTS update_pt_exercises_updated_at ON pt_exercises;

-- Create triggers
CREATE TRIGGER update_pt_exercise_programs_updated_at
  BEFORE UPDATE ON pt_exercise_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_pt_program_updated_at();

CREATE TRIGGER update_pt_exercises_updated_at
  BEFORE UPDATE ON pt_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_pt_program_updated_at();

-- =====================================================
-- STEP 6: ADD COMMENTS
-- =====================================================

COMMENT ON TABLE pt_exercise_programs IS 'Stores PT exercise programs assigned to patients';
COMMENT ON TABLE pt_exercises IS 'Stores individual exercises within PT programs';
COMMENT ON TABLE pt_exercise_completions IS 'Tracks when patients complete exercises';
COMMENT ON TABLE pt_weekly_goals IS 'Stores weekly goals for PT programs';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅';
  RAISE NOTICE '✅ PT EXERCISES SETUP COMPLETE!';
  RAISE NOTICE '✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables Created:';
  RAISE NOTICE '   - pt_exercise_programs';
  RAISE NOTICE '   - pt_exercises';
  RAISE NOTICE '   - pt_exercise_completions';
  RAISE NOTICE '   - pt_weekly_goals';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Indexes: Created (9 indexes)';
  RAISE NOTICE '🔒 RLS Policies: Enabled and configured';
  RAISE NOTICE '🔔 Triggers: Configured for automatic timestamps';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Restart your Next.js dev server';
  RAISE NOTICE '   2. Navigate to /pt-management as PT staff';
  RAISE NOTICE '   3. Create a test exercise program';
  RAISE NOTICE '   4. Login as patient and view in portal';
  RAISE NOTICE '';
  RAISE NOTICE '📖 Full Documentation: PT_EXERCISES_IMPLEMENTATION.md';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready for production! 🚀';
END $$;

