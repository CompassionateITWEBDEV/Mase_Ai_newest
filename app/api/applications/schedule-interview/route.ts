import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { applicationId, interviewDate, interviewTime, location, notes, interviewer } = await request.json()

    if (!applicationId || !interviewDate || !interviewTime) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, interviewDate, interviewTime' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Update application status to interview_scheduled
    const { data: updatedApplication, error: updateError } = await supabase
      .from('job_applications')
      .update({
        status: 'interview_scheduled',
        interview_date: interviewDate,
        interview_time: interviewTime,
        interview_location: location,
        interview_notes: notes,
        interviewer: interviewer,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        *,
        applicant:applicants(
          first_name,
          last_name,
          email,
          phone
        ),
        job_posting:job_postings(
          title,
          company_name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error scheduling interview:', updateError)
      return NextResponse.json(
        { error: 'Failed to schedule interview: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: 'Interview scheduled successfully'
    })

  } catch (error: any) {
    console.error('Schedule interview API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
