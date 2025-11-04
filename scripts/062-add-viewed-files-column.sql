-- Add viewed_files column to in_service_enrollments table
-- This column tracks which files within each module have been viewed by the employee
-- Format: JSONB object mapping moduleId to array of fileIds
-- Example: {"module-1": ["file-0", "file-1"], "module-2": ["file-0"]}

ALTER TABLE public.in_service_enrollments
ADD COLUMN IF NOT EXISTS viewed_files JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.in_service_enrollments.viewed_files IS 'Tracks viewed files per module: {moduleId: [fileId1, fileId2, ...]}';

