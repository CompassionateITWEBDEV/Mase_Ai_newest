-- Migration: Add ai_reason column to referrals table
-- This column stores the AI's reasoning for its recommendation

-- Check if column exists before adding it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'ai_reason'
    ) THEN
        -- Add the ai_reason column
        ALTER TABLE public.referrals 
        ADD COLUMN ai_reason TEXT;
        
        -- Add a comment to describe the column
        COMMENT ON COLUMN public.referrals.ai_reason IS 'AI-powered reasoning and explanation for the recommendation';
        
        RAISE NOTICE 'Column ai_reason added successfully to referrals table';
    ELSE
        RAISE NOTICE 'Column ai_reason already exists in referrals table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'referrals' 
  AND column_name = 'ai_reason';

