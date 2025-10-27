-- Simple script to add missing columns to interview_reschedule_requests table
-- Run this in your Supabase SQL Editor

ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS proposed_date DATE;

ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS proposed_time TIME;

ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS original_date TIMESTAMP WITH TIME ZONE;

