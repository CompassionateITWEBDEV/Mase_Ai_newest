import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobApplicationId = params.id

    if (!jobApplicationId) {
      return NextResponse.json(
        { error: 'Missing required parameter: job_application_id' },
        { status: 400 }
      )
    }

    // Use service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch application form data
    const { data: applicationForm, error } = await supabase
      .from('application_forms')
      .select('*')
      .eq('job_application_id', jobApplicationId)
      .single()

    if (error) {
      console.error('Error fetching application form:', error)
      return NextResponse.json(
        { error: 'Failed to fetch application form: ' + error.message },
        { status: 500 }
      )
    }

    if (!applicationForm) {
      return NextResponse.json(
        { error: 'Application form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      applicationForm
    })

  } catch (error: any) {
    console.error('Application form fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}