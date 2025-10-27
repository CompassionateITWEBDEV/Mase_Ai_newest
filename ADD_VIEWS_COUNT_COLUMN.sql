-- Add views_count column to job_postings if it doesn't exist
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Add applications_count column if it doesn't exist
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;

-- Verify the column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'job_postings' 
AND column_name IN ('views_count', 'applications_count');

-- Update comments
COMMENT ON COLUMN job_postings.views_count IS 'Number of unique users who have viewed this job posting';
COMMENT ON COLUMN job_postings.applications_count IS 'Number of applications received for this job posting';

োগ.Status: Job view count display already in UI
- Lines 2815 and 2931 show: `<span>{job.views_count || 0} views</span>`
- Eye icon shows view count in job listings

API enhancements:
- Added logging to inspect returned view counts
- Returns all columns, including `views_count`

Database check — add the column if missing:
```sql
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
```

Quick test:
1. Go to Jobs tab
2. Verify each job shows "X views"
3. Click a job to increment the count and refresh the display

How it works:
- Listings display `<Eye icon> {count} views`
- Clicking to view details increments the count and updates the UI
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
read_lints
