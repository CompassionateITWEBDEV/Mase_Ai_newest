-- Communications Tables Setup
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (to ensure clean setup)
-- Comment out these lines if you want to preserve existing data
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS meeting_participants CASCADE;
DROP TABLE IF EXISTS scheduled_meetings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, staff_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES staff(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'meeting_invite', 'file', 'system')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create scheduled_meetings table
CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  agenda TEXT,
  organizer_id UUID REFERENCES staff(id),
  meeting_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  duration_minutes INTEGER DEFAULT 30,
  meeting_link TEXT,
  meeting_type TEXT DEFAULT 'general' CHECK (meeting_type IN ('general', 'training', 'evaluation', 'recurring', 'standup')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meeting_participants table
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES scheduled_meetings(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
  attended BOOLEAN DEFAULT FALSE,
  UNIQUE(meeting_id, staff_id)
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES staff(id),
  assigned_by UUID REFERENCES staff(id),
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE,
  commenter_id UUID REFERENCES staff(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_staff ON conversation_participants(staff_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON scheduled_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_organizer ON scheduled_meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON task_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON task_assignments(status);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all for conversations" ON conversations;
DROP POLICY IF EXISTS "Enable all for conversation_participants" ON conversation_participants;
DROP POLICY IF EXISTS "Enable all for messages" ON messages;
DROP POLICY IF EXISTS "Enable all for scheduled_meetings" ON scheduled_meetings;
DROP POLICY IF EXISTS "Enable all for meeting_participants" ON meeting_participants;
DROP POLICY IF EXISTS "Enable all for task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Enable all for task_comments" ON task_comments;

-- Create policies (allowing all for now - in production, restrict by user)
CREATE POLICY "Enable all for conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Enable all for conversation_participants" ON conversation_participants FOR ALL USING (true);
CREATE POLICY "Enable all for messages" ON messages FOR ALL USING (true);
CREATE POLICY "Enable all for scheduled_meetings" ON scheduled_meetings FOR ALL USING (true);
CREATE POLICY "Enable all for meeting_participants" ON meeting_participants FOR ALL USING (true);
CREATE POLICY "Enable all for task_assignments" ON task_assignments FOR ALL USING (true);
CREATE POLICY "Enable all for task_comments" ON task_comments FOR ALL USING (true);

-- Insert sample data
DO $$
DECLARE
  staff1_id UUID;
  staff2_id UUID;
  conv_id UUID;
BEGIN
  -- Get existing staff members
  SELECT id INTO staff1_id FROM staff ORDER BY created_at LIMIT 1;
  SELECT id INTO staff2_id FROM staff ORDER BY created_at OFFSET 1 LIMIT 1;
  
  IF staff1_id IS NOT NULL THEN
    -- Create a sample conversation
    INSERT INTO conversations (type, name, created_by)
    VALUES ('group', 'Team General', staff1_id)
    RETURNING id INTO conv_id;
    
    -- Add participants
    IF conv_id IS NOT NULL THEN
      INSERT INTO conversation_participants (conversation_id, staff_id, is_admin)
      VALUES (conv_id, staff1_id, true);
      
      IF staff2_id IS NOT NULL THEN
        INSERT INTO conversation_participants (conversation_id, staff_id, is_admin)
        VALUES (conv_id, staff2_id, false);
      END IF;
      
      -- Add sample messages
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES 
        (conv_id, staff1_id, 'Welcome to the team chat!'),
        (conv_id, staff1_id, 'Please use this for general announcements.');
      
      IF staff2_id IS NOT NULL THEN
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (conv_id, staff2_id, 'Thanks! Looking forward to working with everyone.');
      END IF;
    END IF;
    
    -- Create a sample meeting
    INSERT INTO scheduled_meetings (title, description, organizer_id, meeting_date, start_time, duration_minutes, meeting_type)
    VALUES 
      ('Weekly Team Standup', 'Regular team sync meeting', staff1_id, CURRENT_DATE + INTERVAL '1 day', '10:00', 30, 'standup');
    
    -- Create a sample task
    IF staff2_id IS NOT NULL THEN
      INSERT INTO task_assignments (title, description, assigned_to, assigned_by, due_date, priority)
      VALUES 
        ('Complete onboarding documents', 'Fill out all required HR forms', staff2_id, staff1_id, CURRENT_DATE + INTERVAL '7 days', 'medium');
    END IF;
  END IF;
END $$;

SELECT 'Communications tables created successfully!' as result;
