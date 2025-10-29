import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Use service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if application_forms table exists and has data
    const { data: forms, error } = await supabase
      .from('application_forms')
      .select('*')
      .limit(5)

    if (error) {
      console.error('Error checking application forms:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        message: 'Error accessing application_forms table'
      }, { status: 500 })
    }

    // Also check job_applications to see what applications exist
    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select('id, applied_date, status')
      .limit(5)

    return NextResponse.json({
      success: true,
      applicationForms: forms || [],
      jobApplications: applications || [],
      message: `Found ${forms?.length || 0} application forms and ${applications?.length || 0} job applications`
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

