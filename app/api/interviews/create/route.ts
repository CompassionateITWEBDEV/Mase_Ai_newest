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

    console.log('📝 Creating interview with data:', interviewData)
    
    // First, check if the table exists by trying to query it
    const { error: tableCheckError } = await supabase
      .from('interview_schedules')
      .select('id')
      .limit(0)
    
    if (tableCheckError) {
      console.error('❌ Table check failed:', tableCheckError)
      return NextResponse.json(
        { 
          error: 'Interview schedules table not found or not accessible',
          hint: 'Please run the migration script to create the interview_schedules table',
          details: tableCheckError.message
        },
        { status: 500 }
      )
    }
    
    // First, insert the interview schedule
    const { data: newInterview, error: insertError } = await supabase
      .from('interview_schedules')
      .insert(interviewData)
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ Error creating interview schedule:', insertError)
      console.error('❌ Full error object:', JSON.stringify(insertError, null, 2))
      console.error('❌ Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      console.error('❌ Data being inserted:', JSON.stringify(interviewData, null, 2))
      
      // Return a more detailed error
      return NextResponse.json(
        { 
          error: `Failed to create interview schedule: ${insertError.message || 'Unknown error'}`,
          hint: insertError.hint,
          details: insertError.details,
          errorCode: insertError.code,
          fullError: JSON.stringify(insertError)
        },
        { status: 500 }
      )
    }

    console.log('✅ Interview schedule created successfully:', newInterview.id)

    // Update application status to 'interview_scheduled'
    const { data: applicationData } = await supabase
      .from('job_applications')
      .select('id, job_posting_id')
      .eq('job_posting_id', job_posting_id)
      .eq('applicant_id', applicant_id)
      .single()

    if (applicationData) {
      await supabase
        .from('job_applications')
        .update({ status: 'interview_scheduled', updated_at: new Date().toISOString() })
        .eq('id', applicationData.id)
      console.log('✅ Updated application status to interview_scheduled')
    }

    // Fetch related data separately since we can't use joins
    const [jobData, applicantData, employerData] = await Promise.all([
      supabase.from('job_postings').select('id, title, department').eq('id', job_posting_id).single(),
      supabase.from('applicants').select('id, first_name, last_name, email').eq('id', applicant_id).single(),
      supabase.from('employers').select('id, company_name').eq('id', employer_id).single()
    ])

    // Build the response with related data
    const interviewWithRelations = {
      ...newInterview,
      job_posting: jobData.data || null,
      applicant: applicantData.data || null,
      employer: employerData.data || null
    }

    return NextResponse.json({
      success: true,
      interview: interviewWithRelations,
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

