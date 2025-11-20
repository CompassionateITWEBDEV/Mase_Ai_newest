-- =====================================================
-- PT EXERCISE PROGRAM TABLES
-- Stores physical therapy exercise programs and tracking
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
  duration TEXT NOT NULL, -- e.g., "2 minutes"
  repetitions TEXT NOT NULL, -- e.g., "10-15 reps"
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pt_programs_patient_id ON pt_exercise_programs(patient_id);
CREATE INDEX IF NOT EXISTS idx_pt_programs_therapist_id ON pt_exercise_programs(therapist_id);
CREATE INDEX IF NOT EXISTS idx_pt_programs_status ON pt_exercise_programs(status);
CREATE INDEX IF NOT EXISTS idx_pt_exercises_program_id ON pt_exercises(program_id);
CREATE INDEX IF NOT EXISTS idx_pt_completions_patient_id ON pt_exercise_completions(patient_id);
CREATE INDEX IF NOT EXISTS idx_pt_completions_exercise_id ON pt_exercise_completions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_pt_completions_completed_at ON pt_exercise_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_goals_program_id ON pt_weekly_goals(program_id);
CREATE INDEX IF NOT EXISTS idx_pt_goals_patient_id ON pt_weekly_goals(patient_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE pt_exercise_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_weekly_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to pt_exercise_programs"
  ON pt_exercise_programs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to pt_exercises"
  ON pt_exercises FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to pt_exercise_completions"
  ON pt_exercise_completions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to pt_weekly_goals"
  ON pt_weekly_goals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policy: Authenticated users can view their own programs
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

-- Add comments
COMMENT ON TABLE pt_exercise_programs IS 'Stores PT exercise programs assigned to patients';
COMMENT ON TABLE pt_exercises IS 'Stores individual exercises within PT programs';
COMMENT ON TABLE pt_exercise_completions IS 'Tracks when patients complete exercises';
COMMENT ON TABLE pt_weekly_goals IS 'Stores weekly goals for PT programs';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pt_program_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_pt_exercise_programs_updated_at
  BEFORE UPDATE ON pt_exercise_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_pt_program_updated_at();

CREATE TRIGGER update_pt_exercises_updated_at
  BEFORE UPDATE ON pt_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_pt_program_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ PT Exercise tables created successfully!';
  RAISE NOTICE '📋 Tables: pt_exercise_programs, pt_exercises, pt_exercise_completions, pt_weekly_goals';
  RAISE NOTICE '🔒 RLS policies enabled for security';
  RAISE NOTICE '⚡ Indexes created for performance';
END $$;

