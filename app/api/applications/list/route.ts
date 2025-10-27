import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicantId = searchParams.get('applicant_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Fetching applications...', { applicantId, status })

    let query = supabase
      .from('job_applications')
      .select(`
        *,
        job_posting:job_postings(
          id,
          title,
          description,
          job_type,
          salary_min,
          salary_max,
          salary_type,
          city,
          state,
          employer:employers(
            company_name
          )
        )
      `)
      .order('applied_date', { ascending: false })
      .limit(limit)

    // Filter by applicant if specified
    if (applicantId) {
      query = query.eq('applicant_id', applicantId)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${applications?.length || 0} applications`)
    
    // Fetch interview details from interview_schedules for applications with interview_scheduled status
    const transformedApplications = await Promise.all((applications || []).map(async (app: any) => {
      // If application has interview_scheduled status, fetch from interview_schedules table
      if (app.status === 'interview_scheduled' && app.job_posting_id) {
        try {
          const { data: interview, error: interviewError } = await supabase
            .from('interview_schedules')
            .select('*')
            .eq('job_posting_id', app.job_posting_id)
            .eq('applicant_id', app.applicant_id)
            .eq('status', 'scheduled')
            .order('interview_date', { ascending: true })
            .limit(1)
            .single()

          if (!interviewError && interview) {
            console.log('✅ Found interview data for application:', app.id, {
              interview_date: interview.interview_date,
              interview_location: interview.interview_location,
              interviewer_name: interview.interviewer_name
            })
            
            // Merge interview data into application
            app.interview_date = interview.interview_date
            app.interview_time = interview.interview_date ? new Date(interview.interview_date).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : null
            app.interview_location = interview.interview_location || interview.meeting_link
            app.interviewer = interview.interviewer_name
            app.interview_notes = interview.interview_notes
            app.meeting_link = interview.meeting_link
          } else if (interviewError) {
            console.log('⚠️ No interview data found in interview_schedules for application:', app.id)
          }
        } catch (err) {
          console.error('Error fetching interview data:', err)
        }
      }

      return {
        ...app,
        job_posting: app.job_posting ? {
          ...app.job_posting,
          company_name: app.job_posting.employer?.company_name || 'Unknown Company',
          location: `${app.job_posting.city}, ${app.job_posting.state}`
        } : null
      }
    }))

    // Log sample application to check interview fields
    if (transformedApplications && transformedApplications.length > 0) {
      console.log('📋 Transformed application (first one):', {
        id: transformedApplications[0].id,
        status: transformedApplications[0].status,
        interview_date: transformedApplications[0].interview_date,
        interview_time: transformedApplications[0].interview_time,
        interview_location: transformedApplications[0].interview_location,
        interviewer: transformedApplications[0].interviewer
      })
    }

    return NextResponse.json({
      success: true,
      applications: transformedApplications,
      count: transformedApplications.length,
    })
    
  } catch (error: any) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
