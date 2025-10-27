-- Fix interview_reschedule_requests table columns
-- This ensures the table has the correct column structure

-- First, create the table if it doesn't exist (without NOT NULL constraints initially)
CREATE TABLE IF NOT EXISTS interview_reschedule_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID,
  application_id UUID,
  applicant_id UUID,
  employer_id UUID,
  original_date TIMESTAMP WITH TIME ZONE,
  proposed_date DATE,
  proposed_time TIME,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  review_date TIMESTAMP WITH TIME ZONE,
  review_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add proposed_date if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'proposed_date') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN proposed_date DATE;
  END IF;
  
  -- Add proposed_time if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'proposed_time') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN proposed_time TIME;
  END IF;
  
  -- Add original_date if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'original_date') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN original_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add review_date if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'review_date') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN review_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add review_by if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'review_by') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN review_by UUID;
  END IF;
  
  -- Add interview_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'interview_id') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN interview_id UUID;
  END IF;
  
  -- Add application_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'application_id') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN application_id UUID;
  END IF;
  
  -- Add applicant_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'applicant_id') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN applicant_id UUID;
  END IF;
  
  -- Add employer_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'employer_id') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN employer_id UUID;
  END IF;
  
  -- Add reason if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'reason') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN reason TEXT;
  END IF;
  
  -- Add status if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'status') THEN
    ALTER TABLE interview_reschedule_requests ADD COLUMN status VARCHAR(50);
  END IF;
END $$;

-- Add check constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'interview_reschedule_requests' 
    AND constraint_name LIKE '%status%'
  ) THEN
    ALTER TABLE interview_reschedule_requests ADD CONSTRAINT interview_reschedule_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Set default for status
ALTER TABLE interview_reschedule_requests 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_interview_id ON interview_reschedule_requests(interview_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_employer_id ON interview_reschedule_requests(employer_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_applicant_id ON interview_reschedule_requests(applicant_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON interview_reschedule_requests(status);

-- Enable RLS
ALTER TABLE interview_reschedule_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employers can view their reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Applicants can view their reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Applicants can insert reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Employers can update their reschedule requests" ON interview_reschedule_requests;

-- Recreate policies - simplified to allow service_role and basic auth
CREATE POLICY "Service role can access all reschedule requests" 
  ON interview_reschedule_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own reschedule requests" 
  ON interview_reschedule_requests FOR SELECT 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text OR
    applicant_id::text = auth.uid()::text
  );

CREATE POLICY "Users can insert their own reschedule requests" 
  ON interview_reschedule_requests FOR INSERT 
  WITH CHECK (
    auth.role() = 'service_role' OR
    applicant_id::text = auth.uid()::text
  );

CREATE POLICY "Users can update their own reschedule requests" 
  ON interview_reschedule_requests FOR UPDATE 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text
  );
