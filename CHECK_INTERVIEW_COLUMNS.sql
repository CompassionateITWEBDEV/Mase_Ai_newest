-- Check if interview columns exist in job_applications table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'job_applications' 
AND column_name IN (
  'interview_date',
  'interview_time', 
  'interview_location',
  'interviewer',
  'interview_notes'
)
ORDER BY column_name;

-- Check a sample application to see if interview data exists
SELECT 
    id,
    status,
    interview_date,
    interview_time,
    interview_location,
    interviewer,
    interview_notes
FROM job_applications
WHERE status = 'interview_scheduled'
LIMIT 5;

