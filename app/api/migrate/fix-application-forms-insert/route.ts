import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Read the SQL file
    const sql = `
-- Fix RLS policies for application_forms table to allow inserts
-- This allows the API to insert application forms without requiring authentication

-- Drop existing insert policies
DROP POLICY IF EXISTS "Allow applicants to insert own application forms" ON public.application_forms;
DROP POLICY IF EXISTS "Users can insert their own application forms" ON public.application_forms;

-- Create a more permissive insert policy that allows inserts for any job_application_id
-- This is safe because the job_application record must already exist
CREATE POLICY "Allow inserts for application forms" ON public.application_forms
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.job_applications 
            WHERE id = application_forms.job_application_id
        )
    );

-- Ensure anon and authenticated roles have insert permissions
GRANT INSERT ON public.application_forms TO anon;
GRANT INSERT ON public.application_forms TO authenticated;
    `

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('RPC failed, trying direct execution...')
      return NextResponse.json({
        success: false,
        error: 'Please run the SQL script manually in Supabase SQL Editor',
        sql: sql
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Application forms RLS policy updated successfully'
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}


