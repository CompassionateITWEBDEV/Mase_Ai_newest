-- Test script to verify notifications table structure
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'notifications'
) AS table_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Check if we can insert a test record
INSERT INTO notifications (employer_id, type, title, message, read) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'application', 'Test Notification', 'This is a test', false);

-- Check if the record was inserted
SELECT * FROM notifications WHERE title = 'Test Notification';

-- Clean up test record
DELETE FROM notifications WHERE title = 'Test Notification';
