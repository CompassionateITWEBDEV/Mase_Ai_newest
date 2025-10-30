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

    // Get the most recent job application
    const { data: recentApp, error: appError } = await supabase
      .from('job_applications')
      .select('id, applied_date, status')
      .order('applied_date', { ascending: false })
      .limit(1)
      .single()

    if (appError) {
      return NextResponse.json({
        success: false,
        error: appError.message
      }, { status: 500 })
    }

    // Get the application form for this job application
    const { data: form, error: formError } = await supabase
      .from('application_forms')
      .select('*')
      .eq('job_application_id', recentApp.id)
      .single()

    return NextResponse.json({
      success: true,
      recentJobApplication: recentApp,
      applicationForm: form,
      formError: formError?.message || null,
      testUrl: `/api/applications/form/${recentApp.id}`
    })

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}


