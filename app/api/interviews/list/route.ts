import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employerId = searchParams.get('employer_id')
    const applicantId = searchParams.get('applicant_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!employerId && !applicantId) {
      return NextResponse.json(
        { error: 'Either employer_id or applicant_id is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('interview_schedules')
      .select(`
        id,
        interview_date,
        interview_type,
        interview_location,
        meeting_link,
        interview_notes,
        duration_minutes,
        interviewer_name,
        interviewer_email,
        status,
        created_at,
        updated_at,
        job_posting:job_postings(
          id,
          title,
          department,
          job_type,
          city,
          state
        ),
        applicant:applicants(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        employer:employers(
          id,
          company_name,
          email
        )
      `)
      .order('interview_date', { ascending: true })
      .limit(limit)

    // Filter by employer or applicant
    if (employerId) {
      query = query.eq('employer_id', employerId)
    }
    if (applicantId) {
      query = query.eq('applicant_id', applicantId)
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: interviews, error } = await query

    if (error) {
      console.error('Error fetching interviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch interviews' },
        { status: 500 }
      )
    }

    // Transform the data for better display
    const transformedInterviews = interviews?.map(interview => ({
      ...interview,
      interview_date_formatted: new Date(interview.interview_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      interview_time: new Date(interview.interview_date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      status_badge: getStatusBadge(interview.status),
      duration_formatted: `${interview.duration_minutes} minutes`,
      applicant_name: `${interview.applicant?.first_name || ''} ${interview.applicant?.last_name || ''}`.trim(),
      job_title: interview.job_posting?.title || 'Unknown Job',
      company_name: interview.employer?.company_name || 'Unknown Company'
    })) || []

    console.log(`✅ Fetched ${transformedInterviews.length} interviews`)

    return NextResponse.json({
      success: true,
      interviews: transformedInterviews,
      count: transformedInterviews.length
    })

  } catch (error: any) {
    console.error('Interview fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getStatusBadge(status: string) {
  const statusConfig = {
    scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    rescheduled: { label: 'Rescheduled', color: 'bg-yellow-100 text-yellow-800' }
  }
  
  return statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800' }
}
