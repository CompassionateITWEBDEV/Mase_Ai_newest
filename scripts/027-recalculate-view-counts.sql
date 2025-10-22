-- Recalculate accurate view counts for all job postings
-- This script updates the views_count in job_postings table based on unique users

-- First, let's see the current state
SELECT 
    jp.id,
    jp.title,
    jp.views_count as current_views,
    COUNT(DISTINCT 
        CASE 
            WHEN jv.applicant_id IS NOT NULL THEN 'applicant_' || jv.applicant_id::text
            WHEN jv.employer_id IS NOT NULL THEN 'employer_' || jv.employer_id::text
            WHEN jv.staff_id IS NOT NULL THEN 'staff_' || jv.staff_id::text
        END
    ) as actual_unique_views
FROM job_postings jp
LEFT JOIN job_views jv ON jp.id = jv.job_posting_id
GROUP BY jp.id, jp.title, jp.views_count
ORDER BY jp.posted_date DESC
LIMIT 10;

-- Update the views_count for all job postings with accurate counts
UPDATE job_postings 
SET views_count = (
    SELECT COUNT(DISTINCT 
        CASE 
            WHEN jv.applicant_id IS NOT NULL THEN 'applicant_' || jv.applicant_id::text
            WHEN jv.employer_id IS NOT NULL THEN 'employer_' || jv.employer_id::text
            WHEN jv.staff_id IS NOT NULL THEN 'staff_' || jv.staff_id::text
        END
    )
    FROM job_views jv 
    WHERE jv.job_posting_id = job_postings.id
);

-- Verify the update
SELECT 
    jp.id,
    jp.title,
    jp.views_count as updated_views,
    COUNT(DISTINCT 
        CASE 
            WHEN jv.applicant_id IS NOT NULL THEN 'applicant_' || jv.applicant_id::text
            WHEN jv.employer_id IS NOT NULL THEN 'employer_' || jv.employer_id::text
            WHEN jv.staff_id IS NOT NULL THEN 'staff_' || jv.staff_id::text
        END
    ) as actual_unique_views
FROM job_postings jp
LEFT JOIN job_views jv ON jp.id = jv.job_posting_id
GROUP BY jp.id, jp.title, jp.views_count
ORDER BY jp.posted_date DESC
LIMIT 10;

-- Add comment
COMMENT ON COLUMN job_postings.views_count IS 'Number of unique users who have viewed this job posting (one count per user)';
