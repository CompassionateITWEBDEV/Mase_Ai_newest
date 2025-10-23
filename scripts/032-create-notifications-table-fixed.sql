-- Drop the table if it exists to start fresh
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID,
  type VARCHAR(50) NOT NULL CHECK (type IN ('application', 'interview', 'offer', 'document', 'candidate')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_notifications_employer_id ON notifications(employer_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for employers to see their own notifications
CREATE POLICY "Employers can view their own notifications" ON notifications
  FOR SELECT USING (employer_id::text = auth.uid()::text);

-- Create RLS policy for employers to update their own notifications
CREATE POLICY "Employers can update their own notifications" ON notifications
  FOR UPDATE USING (employer_id::text = auth.uid()::text);

-- Create RLS policy for system to insert notifications
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Insert some sample notifications for testing
INSERT INTO notifications (employer_id, type, title, message, action_url, read) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'application', 'New Application Received', 'Sarah Johnson applied for Registered Nurse position', '/employer-dashboard?tab=applications', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'interview', 'Interview Scheduled', 'Interview with Mike Chen scheduled for tomorrow at 2 PM', '/employer-dashboard?tab=applications', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'offer', 'Offer Response', 'Lisa Rodriguez accepted your job offer', '/employer-dashboard?tab=applications', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'document', 'Document Uploaded', 'John Smith uploaded their professional license', '/employer-dashboard?tab=applications', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'candidate', 'New Candidate', 'Emma Wilson joined the candidate pool', '/employer-dashboard?tab=candidates', true)
ON CONFLICT (id) DO NOTHING;
