-- =====================================================
-- PT EXERCISE SEED DATA
-- Sample data for testing PT exercise functionality
-- =====================================================

-- Insert sample PT exercise program
-- Note: Replace patient_id and therapist_id with actual IDs from your database
INSERT INTO pt_exercise_programs (
  id,
  patient_id,
  therapist_id,
  program_name,
  current_week,
  total_weeks,
  completed_sessions,
  total_sessions,
  next_session_date,
  status,
  notes
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM patients LIMIT 1), -- Get first patient
  (SELECT id FROM staff WHERE credentials LIKE '%PT%' LIMIT 1), -- Get first PT
  'Post-Surgery Rehabilitation Program',
  3,
  8,
  12,
  24,
  CURRENT_DATE + INTERVAL '2 days',
  'active',
  'Patient recovering from knee surgery. Focus on mobility and strength.'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample exercises
INSERT INTO pt_exercises (
  id,
  program_id,
  name,
  description,
  duration,
  repetitions,
  sets,
  difficulty,
  video_url,
  ai_tips,
  order_sequence,
  is_active
) VALUES 
(
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'Ankle Pumps',
  'Flex and point your foot to improve circulation and reduce swelling',
  '2 minutes',
  '10-15 reps',
  3,
  'Easy',
  '/exercises/ankle-pumps.mp4',
  'Keep movements slow and controlled. Focus on full range of motion. This exercise helps prevent blood clots and reduces swelling.',
  1,
  true
),
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Seated Leg Extensions',
  'Strengthen quadriceps while seated to improve knee stability',
  '3 minutes',
  '8-12 reps',
  2,
  'Moderate',
  '/exercises/leg-extensions.mp4',
  'Hold for 2 seconds at the top of each extension. Breathe normally throughout. Stop if you feel sharp pain.',
  2,
  true
),
(
  '22222222-2222-2222-2222-222222222223',
  '11111111-1111-1111-1111-111111111111',
  'Arm Circles',
  'Improve shoulder mobility and strength with controlled circular motions',
  '2 minutes',
  '10 forward, 10 backward',
  2,
  'Easy',
  '/exercises/arm-circles.mp4',
  'Start with small circles and gradually increase size. Keep shoulders relaxed. This helps maintain upper body mobility.',
  3,
  true
),
(
  '22222222-2222-2222-2222-222222222224',
  '11111111-1111-1111-1111-111111111111',
  'Heel Slides',
  'Gently bend and straighten your knee while lying down',
  '3 minutes',
  '10-15 reps',
  3,
  'Moderate',
  '/exercises/heel-slides.mp4',
  'Use a towel under your heel if needed. Progress slowly and dont force the movement. Focus on increasing range of motion gradually.',
  4,
  true
),
(
  '22222222-2222-2222-2222-222222222225',
  '11111111-1111-1111-1111-111111111111',
  'Standing Balance',
  'Practice balance to improve stability and prevent falls',
  '1 minute',
  'Hold 30 seconds',
  2,
  'Moderate',
  '/exercises/standing-balance.mp4',
  'Use a chair or counter for support if needed. Progress to closing eyes once comfortable. This exercise is crucial for fall prevention.',
  5,
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert sample completion (one exercise completed)
INSERT INTO pt_exercise_completions (
  id,
  exercise_id,
  patient_id,
  program_id,
  completed_at,
  duration_seconds,
  notes,
  pain_level
) VALUES (
  '33333333-3333-3333-3333-333333333331',
  '22222222-2222-2222-2222-222222222221',
  (SELECT patient_id FROM pt_exercise_programs WHERE id = '11111111-1111-1111-1111-111111111111'),
  '11111111-1111-1111-1111-111111111111',
  NOW() - INTERVAL '2 hours',
  120,
  'Completed all sets. Feeling good!',
  2
) ON CONFLICT (id) DO NOTHING;

-- Insert weekly goals
INSERT INTO pt_weekly_goals (
  id,
  program_id,
  patient_id,
  goal_text,
  completed,
  week_number,
  completed_at
) VALUES 
(
  '44444444-4444-4444-4444-444444444441',
  '11111111-1111-1111-1111-111111111111',
  (SELECT patient_id FROM pt_exercise_programs WHERE id = '11111111-1111-1111-1111-111111111111'),
  'Complete 3 exercise sessions',
  true,
  3,
  NOW() - INTERVAL '1 day'
),
(
  '44444444-4444-4444-4444-444444444442',
  '11111111-1111-1111-1111-111111111111',
  (SELECT patient_id FROM pt_exercise_programs WHERE id = '11111111-1111-1111-1111-111111111111'),
  'Practice balance exercises daily',
  false,
  3,
  NULL
),
(
  '44444444-4444-4444-4444-444444444443',
  '11111111-1111-1111-1111-111111111111',
  (SELECT patient_id FROM pt_exercise_programs WHERE id = '11111111-1111-1111-1111-111111111111'),
  'Log pain levels after exercises',
  false,
  3,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ PT Exercise seed data inserted!';
  RAISE NOTICE '📋 Created 1 program with 5 exercises';
  RAISE NOTICE '✅ Added 1 completion and 3 weekly goals';
  RAISE NOTICE '💡 Note: Update patient_id and therapist_id references as needed';
END $$;

