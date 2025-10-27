import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employerId = searchParams.get('employer_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!employerId) {
      return NextResponse.json(
        { error: 'Employer ID is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('interview_reschedule_requests')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: rescheduleRequests, error } = await query

    if (error) {
      console.error('❌ Error fetching reschedule requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reschedule requests: ' + error.message },
        { status: 500 }
      )
    }

    // Fetch related data for each request
    const requestsWithDetails = await Promise.all(
      (rescheduleRequests || []).map(async (request) => {
        // Get applicant details
        const { data: applicant } = await supabase
          .from('applicants')
          .select('first_name, last_name, email')
          .eq('id', request.applicant_id)
          .single()

        // Get job posting details
        const { data: jobPosting } = await supabase
          .from('job_postings')
          .select('title')
          .eq('id', request.application_id)
          .single()

        // Get interview details
        const { data: interview } = await supabase
          .from('interview_schedules')
          .select('interview_date, interview_time, status')
          .eq('id', request.interview_id)
          .single()

        return {
          ...request,
          applicant: applicant || {},
          job_posting: jobPosting || {},
          interview: interview || {}
        }
      })
    )

    console.log(`📋 Fetched ${requestsWithDetails.length} reschedule requests for employer ${employerId}`)

    return NextResponse.json({
      success: true,
      rescheduleRequests: requestsWithDetails,
      count: requestsWithDetails.length
    })

  } catch (error: any) {
    console.error('Reschedule list error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

