# QUICK SETUP - Job Portal Tables

## ⚠️ ERROR FIX: "Database error saving new user"

This error happens because the tables don't exist yet in Supabase. Follow these steps:

## 📋 STEP 1: Open Supabase SQL Editor

Click this link to open your Supabase SQL Editor:
👉 **https://supabase.com/dashboard/project/twaupwloddlyahjtfvfy/sql/new**

## 📋 STEP 2: Copy & Paste This SQL

Copy ALL the SQL below and paste it into the SQL Editor:

```sql
-- Job Portal Tables Migration
-- Creates tables for applicants, employers, and job applications

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create applicants table (healthcare professionals)
CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    profession TEXT,
    experience_level TEXT,
    education_level TEXT,
    certifications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    marketing_opt_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create employers table (healthcare facilities)
CREATE TABLE IF NOT EXISTS public.employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    company_name TEXT NOT NULL,
    company_type TEXT,
    facility_size TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    marketing_opt_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id UUID REFERENCES public.applicants(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES public.employers(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    job_type TEXT,
    status TEXT DEFAULT 'pending',
    cover_letter TEXT,
    resume_url TEXT,
    notes TEXT,
    applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_applicants_email ON public.applicants(email);
CREATE INDEX IF NOT EXISTS idx_applicants_auth_user_id ON public.applicants(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_applicants_is_active ON public.applicants(is_active);

CREATE INDEX IF NOT EXISTS idx_employers_email ON public.employers(email);
CREATE INDEX IF NOT EXISTS idx_employers_auth_user_id ON public.employers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employers_is_active ON public.employers(is_active);

CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_employer_id ON public.job_applications(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- Add triggers (reuse existing update_timestamp function)
CREATE TRIGGER set_timestamp_applicants
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_employers
    BEFORE UPDATE ON public.employers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_job_applications
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Enable RLS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Applicants
CREATE POLICY "Applicants can view own data" ON public.applicants
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Applicants can update own data" ON public.applicants
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can insert applicants" ON public.applicants
    FOR INSERT WITH CHECK (true);

-- RLS Policies for Employers
CREATE POLICY "Employers can view own data" ON public.employers
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Employers can update own data" ON public.employers
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can insert employers" ON public.employers
    FOR INSERT WITH CHECK (true);

-- RLS Policies for Job Applications
CREATE POLICY "Applicants can view own applications" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.applicants
            WHERE applicants.id = job_applications.applicant_id
            AND applicants.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Employers can view applications to their jobs" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.employers
            WHERE employers.id = job_applications.employer_id
            AND employers.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Applicants can insert own applications" ON public.job_applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.applicants
            WHERE applicants.id = job_applications.applicant_id
            AND applicants.auth_user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.applicants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.job_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.applicants TO anon;
GRANT SELECT, INSERT, UPDATE ON public.employers TO anon;
```

## 📋 STEP 3: Click "RUN" Button

Click the green "RUN" button in the SQL Editor (or press Ctrl+Enter)

## 📋 STEP 4: Verify Tables Created

Go to Table Editor and check if you see these new tables:
- ✅ applicants
- ✅ employers  
- ✅ job_applications

## 📋 STEP 5: Test Registration Again!

Now go back to your app and try to register:
👉 **http://localhost:3001/register**

The registration should work now! 🎉

---

## ✅ Success Indicators

After registration works, you should see:
1. Success message in the browser
2. New user in Supabase Auth (Authentication → Users)
3. New profile in applicants or employers table (Table Editor)
4. Redirect to dashboard

## ❌ Still Having Issues?

If you still get errors, check:
1. Browser console for errors (F12)
2. Network tab to see API response
3. Supabase logs for database errors

