-- Update notifications table to support both employers and applicants
-- This script adds applicant_id column if it doesn't exist and updates constraints

-- Add applicant_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'applicant_id'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE;
    
    COMMENT ON COLUMN notifications.applicant_id IS 'Reference to applicant (for applicant notifications)';
  END IF;
END $$;

-- Add check constraint to ensure either employer_id or applicant_id is set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_user_type_check'
  ) THEN
    ALTER TABLE notifications
    ADD CONSTRAINT notifications_user_type_check 
    CHECK (
      (employer_id IS NOT NULL AND applicant_id IS NULL) OR 
      (employer_id IS NULL AND applicant_id IS NOT NULL)
    );
  END IF;
END $$;

-- Update RLS policies for applicant access
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Applicants can view their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Applicants can update their own notifications" ON notifications;
  
  -- Create new policies for applicants
  CREATE POLICY "Applicants can view their own notifications"
    ON notifications FOR SELECT
    USING (
      applicant_id IS NOT NULL AND 
      applicant_id = auth.uid()
    );

  CREATE POLICY "Applicants can update their own notifications"
    ON notifications FOR UPDATE
    USING (
      applicant_id IS NOT NULL AND 
      applicant_id = auth.uid()
    );
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_applicant_id 
  ON notifications(applicant_id) 
  WHERE applicant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_applicant_unread 
  ON notifications(applicant_id, read, created_at DESC) 
  WHERE applicant_id IS NOT NULL AND read = false;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

-- Add helpful comment
COMMENT ON TABLE notifications IS 'Notification system supporting both employers (employer_id) and applicants (applicant_id). Exactly one of employer_id or applicant_id must be set.';

