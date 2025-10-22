# Job Portal Setup Instructions

## Step 1: Run the Database Migration

Before using the job portal registration feature, you need to create the required tables in your Supabase database.

### Option 1: Manual SQL Execution (Recommended)

1. Open your Supabase SQL Editor:
   https://supabase.com/dashboard/project/twaupwloddlyahjtfvfy/sql/new

2. Copy the contents of `scripts/005-create-job-portal-tables.sql`

3. Paste and run the SQL in the editor

4. Verify the tables were created by checking the Table Editor

### Option 2: Using the API Endpoint

1. Start your Next.js development server:
   ```bash
   pnpm dev
   ```

2. Visit: http://localhost:3001/api/setup-tables

3. Copy the SQL from the response and run it manually in Supabase SQL Editor

## Step 2: Verify Tables

After running the migration, you should see these new tables in your Supabase database:

- `applicants` - For healthcare professionals
- `employers` - For healthcare facilities
- `job_applications` - For tracking job applications

## Step 3: Test Registration

1. Go to: http://localhost:3001/register

2. Try creating both types of accounts:
   - Healthcare Professional (Applicant)
   - Healthcare Facility (Employer)

3. Check your Supabase Authentication dashboard to see the created users

4. Check the `applicants` or `employers` table to see the profile data

## Troubleshooting

### Error: "relation does not exist"
- The migration hasn't been run yet. Follow Step 1 above.

### Error: "Failed to create account"
- Check browser console and server logs for details
- Verify your `.env.local` has correct Supabase credentials
- Make sure Supabase Auth is enabled in your project settings

### Error: "Failed to create profile"
- Tables might not have been created correctly
- Check RLS (Row Level Security) policies in Supabase
- Verify the user was created in Auth but profile insert failed

## Database Structure

### Applicants Table
Stores healthcare professional profiles with fields for:
- Personal info (name, email, phone)
- Location (address, city, state, zip)
- Professional info (profession, experience, education, certifications)

### Employers Table
Stores healthcare facility profiles with fields for:
- Personal contact info
- Location
- Company info (name, type, facility size)

### Job Applications Table
Tracks applications with relationships to both applicants and employers.

## Next Steps

After setup, you can:
1. Create job listings (feature to be implemented)
2. Apply for jobs as an applicant
3. Review applications as an employer
4. Build out the applicant and employer dashboards

