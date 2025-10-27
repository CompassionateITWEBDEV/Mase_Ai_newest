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
      .select('*')
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
      console.error('❌ Error fetching interviews:', error)
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: 'Failed to fetch interviews: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`📋 Fetched ${interviews?.length || 0} interviews`)

    // Fetch related data separately for each interview
    const transformedInterviews = await Promise.all(
      (interviews || []).map(async (interview: any) => {
        try {
          // Fetch related data in parallel
          const [jobData, applicantData, employerData] = await Promise.all([
            interview.job_posting_id 
              ? supabase.from('job_postings').select('id, title, department, job_type, city, state').eq('id', interview.job_posting_id).single().then(r => r.data)
              : null,
            interview.applicant_id
              ? supabase.from('applicants').select('id, first_name, last_name, email, phone').eq('id', interview.applicant_id).single().then(r => r.data)
              : null,
            interview.employer_id
              ? supabase.from('employers').select('id, company_name, email').eq('id', interview.employer_id).single().then(r => r.data)
              : null
          ])

          return {
            ...interview,
            job_posting: jobData,
            applicant: applicantData,
            employer: employerData,
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
            applicant_name: `${applicantData?.first_name || ''} ${applicantData?.last_name || ''}`.trim(),
            job_title: jobData?.title || 'Unknown Job',
            company_name: employerData?.company_name || 'Unknown Company'
          }
        } catch (err) {
          console.error('❌ Error transforming interview:', err)
          // Return basic interview data if transformation fails
          return {
            ...interview,
            job_posting: null,
            applicant: null,
            employer: null,
            applicant_name: 'Unknown',
            job_title: 'Unknown Job',
            company_name: 'Unknown Company'
          }
        }
      })
    )

    console.log(`✅ Successfully transformed ${transformedInterviews.length} interviews`)

    return NextResponse.json({
      success: true,
      interviews: transformedInterviews,
      count: transformedInterviews.length
    })

  } catch (error: any) {
    console.error('❌ Interview fetch error:', error)
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
