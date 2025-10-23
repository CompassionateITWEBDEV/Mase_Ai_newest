-- Simple test for notifications table
-- Just check if we can insert and select

-- Insert a test notification
INSERT INTO notifications (employer_id, type, title, message, read) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'application', 'Test Notification', 'This is a test', false);

-- Select it back
SELECT id, employer_id, type, title, message, read FROM notifications WHERE title = 'Test Notification';

-- Clean up
DELETE FROM notifications WHERE title = 'Test Notification';
