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
          employer:employers(
            company_name
          )
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

    // Transform the data to include company_name properly
    const transformedApplication = {
      ...updatedApplication,
      job_posting: updatedApplication.job_posting ? {
        ...updatedApplication.job_posting,
        company_name: updatedApplication.job_posting.employer?.company_name || 'Unknown Company',
        location: `${updatedApplication.job_posting.city || ''}, ${updatedApplication.job_posting.state || ''}`.trim()
      } : null
    }

    // Create notification for applicant
    try {
      const jobTitle = updatedApplication.job_posting?.title || 'Position'
      const companyName = updatedApplication.job_posting?.employer?.company_name || 'the company'
      const formattedDate = new Date(interviewDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      const formattedTime = new Date(`2000-01-01T${interviewTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      await supabase
        .from('notifications')
        .insert({
          applicant_id: updatedApplication.applicant_id,
          type: 'interview',
          title: 'Interview Scheduled',
          message: `Your interview for ${jobTitle} at ${companyName} has been scheduled for ${formattedDate} at ${formattedTime}${location ? ` at ${location}` : ''}.`,
          action_url: '/applicant-dashboard?tab=applications',
          read: false
        })

      console.log('✅ Interview notification created for applicant:', updatedApplication.applicant_id)
    } catch (notifError) {
      console.error('Error creating interview notification:', notifError)
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({
      success: true,
      application: transformedApplication,
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
