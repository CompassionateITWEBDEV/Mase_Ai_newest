-- Fix reschedule request table column names
-- The table has old column names (new_date, new_time) that need to be renamed
-- or a new_date column needs to be converted to proposed_date

-- Check and add proposed_date column
DO $$
BEGIN
  -- If new_date exists, rename it to proposed_date
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'interview_reschedule_requests' 
             AND column_name = 'new_date') THEN
    
    -- Check if proposed_date doesn't exist yet
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interview_reschedule_requests' 
                   AND column_name = 'proposed_date') THEN
      ALTER TABLE interview_reschedule_requests 
      RENAME COLUMN new_date TO proposed_date;
      RAISE NOTICE 'Renamed new_date to proposed_date';
    ELSE
      -- Both exist, copy data and drop old column
      UPDATE interview_reschedule_requests 
      SET proposed_date = new_date 
      WHERE proposed_date IS NULL;
      ALTER TABLE interview_reschedule_requests 
      DROP COLUMN IF EXISTS new_date;
      RAISE NOTICE 'Migrated data from new_date to proposed_date and dropped new_date';
    END IF;
  ELSE
    -- new_date doesn't exist, just add proposed_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interview_reschedule_requests' 
                   AND column_name = 'proposed_date') THEN
      ALTER TABLE interview_reschedule_requests 
      ADD COLUMN proposed_date DATE;
      RAISE NOTICE 'Added proposed_date column';
    END IF;
  END IF;
END $$;

-- Check and add proposed_time column
DO $$
BEGIN
  -- If new_time exists, rename it to proposed_time
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'interview_reschedule_requests' 
             AND column_name = 'new_time') THEN
    
    -- Check if proposed_time doesn't exist yet
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interview_reschedule_requests' 
                   AND column_name = 'proposed_time') THEN
      ALTER TABLE interview_reschedule_requests 
      RENAME COLUMN new_time TO proposed_time;
      RAISE NOTICE 'Renamed new_time to proposed_time';
    ELSE
      -- Both exist, copy data and drop old column
      UPDATE interview_reschedule_requests 
      SET proposed_time = new_time 
      WHERE proposed_time IS NULL;
      ALTER TABLE interview_reschedule_requests 
      DROP COLUMN IF EXISTS new_time;
      RAISE NOTICE 'Migrated data from new_time to proposed_time and dropped new_time';
    END IF;
  ELSE
    -- new_time doesn't exist, just add proposed_time if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interview_reschedule_requests' 
                   AND column_name = 'proposed_time') THEN
      ALTER TABLE interview_reschedule_requests 
      ADD COLUMN proposed_time TIME;
      RAISE NOTICE 'Added proposed_time column';
    END IF;
  END IF;
END $$;

-- Add original_date if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'interview_reschedule_requests' 
                 AND column_name = 'original_date') THEN
    ALTER TABLE interview_reschedule_requests 
    ADD COLUMN original_date TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added original_date column';
  END IF;
END $$;

-- Make sure proposed_date and proposed_time are nullable (remove NOT NULL constraint if it exists)
DO $$
BEGIN
  -- Allow proposed_date to be nullable
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'interview_reschedule_requests' 
             AND column_name = 'proposed_date'
             AND is_nullable = 'NO') THEN
    ALTER TABLE interview_reschedule_requests 
    ALTER COLUMN proposed_date DROP NOT NULL;
    RAISE NOTICE 'Made proposed_date nullable';
  END IF;
  
  -- Allow proposed_time to be nullable
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'interview_reschedule_requests' 
             AND column_name = 'proposed_time'
             AND is_nullable = 'NO') THEN
    ALTER TABLE interview_reschedule_requests 
    ALTER COLUMN proposed_time DROP NOT NULL;
    RAISE NOTICE 'Made proposed_time nullable';
  END IF;
END $$;

-- Display current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'interview_reschedule_requests'
ORDER BY ordinal_position;

