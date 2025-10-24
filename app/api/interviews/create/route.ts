import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      job_posting_id,
      applicant_id,
      employer_id,
      interview_date,
      interview_type = 'video',
      interview_location,
      meeting_link,
      interview_notes,
      duration_minutes = 60,
      interviewer_name,
      interviewer_email,
    } = body

    if (!job_posting_id || !applicant_id || !employer_id || !interview_date) {
      return NextResponse.json(
        { error: 'Missing required fields: job_posting_id, applicant_id, employer_id, interview_date' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Creating interview schedule:', { 
      job_posting_id, 
      applicant_id, 
      employer_id, 
      interview_date,
      interview_type 
    })

    // Validate that the job posting belongs to the employer
    const { data: jobPosting, error: jobError } = await supabase
      .from('job_postings')
      .select('id, employer_id, title')
      .eq('id', job_posting_id)
      .eq('employer_id', employer_id)
      .single()

    if (jobError || !jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found or does not belong to employer' },
        { status: 404 }
      )
    }

    // Validate that the applicant exists
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select('id, first_name, last_name, email')
      .eq('id', applicant_id)
      .single()

    if (applicantError || !applicant) {
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      )
    }

    // Check if there's already a scheduled interview for this job and applicant
    const { data: existingInterview, error: existingError } = await supabase
      .from('interview_schedules')
      .select('id, status, interview_date')
      .eq('job_posting_id', job_posting_id)
      .eq('applicant_id', applicant_id)
      .in('status', ['scheduled', 'rescheduled'])
      .single()

    if (existingInterview && !existingError) {
      return NextResponse.json(
        { 
          error: 'Interview already scheduled for this applicant and job',
          existing_interview: {
            id: existingInterview.id,
            date: existingInterview.interview_date,
            status: existingInterview.status
          }
        },
        { status: 409 }
      )
    }

    // Create the interview schedule
    const interviewData = {
      job_posting_id,
      applicant_id,
      employer_id,
      interview_date: new Date(interview_date).toISOString(),
      interview_type,
      interview_location: interview_location || null,
      meeting_link: meeting_link || null,
      interview_notes: interview_notes || null,
      duration_minutes,
      interviewer_name: interviewer_name || null,
      interviewer_email: interviewer_email || null,
      status: 'scheduled'
    }

    const { data: newInterview, error: insertError } = await supabase
      .from('interview_schedules')
      .insert(interviewData)
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
        job_posting:job_postings(
          id,
          title,
          department
        ),
        applicant:applicants(
          id,
          first_name,
          last_name,
          email
        ),
        employer:employers(
          id,
          company_name
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating interview schedule:', insertError)
      return NextResponse.json(
        { error: 'Failed to create interview schedule' },
        { status: 500 }
      )
    }

    console.log('✅ Interview schedule created successfully:', newInterview.id)

    return NextResponse.json({
      success: true,
      interview: newInterview,
      message: 'Interview scheduled successfully!'
    })

  } catch (error: any) {
    console.error('Interview creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
