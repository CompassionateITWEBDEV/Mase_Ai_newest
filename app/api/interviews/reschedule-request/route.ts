import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      interviewId, 
      applicationId, 
      applicantId, 
      employerId, 
      currentDate, 
      newDate, 
      newTime, 
      reason 
    } = await request.json()

    if (!interviewId || !applicationId || !applicantId || !employerId || !newDate || !newTime || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

    console.log('Creating reschedule request:', { interviewId, newDate, newTime })

    // Create reschedule request record
    const { data: rescheduleRequest, error: requestError } = await supabase
      .from('interview_reschedule_requests')
      .insert({
        interview_id: interviewId,
        application_id: applicationId,
        applicant_id: applicantId,
        employer_id: employerId,
        original_date: currentDate,
        proposed_date: newDate,
        proposed_time: newTime,
        reason: reason,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating reschedule request:', requestError)
      
      // If table doesn't exist, we need to create it
      if (requestError.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Reschedule requests table not found',
            hint: 'Please create the interview_reschedule_requests table first'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create reschedule request: ' + requestError.message },
        { status: 500 }
      )
    }

    // Get job posting details for notification
    const { data: jobPosting } = await supabase
      .from('job_postings')
      .select('title')
      .eq('id', applicationId)
      .single()

    // Get applicant details for notification
    const { data: applicant } = await supabase
      .from('applicants')
      .select('first_name, last_name')
      .eq('id', applicantId)
      .single()

    const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}` : 'An applicant'
    const jobTitle = jobPosting?.title || 'the position'

    // Create notification for employer
    await supabase
      .from('notifications')
      .insert({
        employer_id: employerId,
        type: 'interview',
        title: 'Interview Reschedule Request',
        message: `${applicantName} has requested to reschedule the interview for ${jobTitle}. Reason: ${reason}`,
        action_url: '/employer-dashboard?tab=applications',
        read: false,
        metadata: {
          reschedule_request_id: rescheduleRequest.id,
          interview_id: interviewId
        }
      })

    console.log('✅ Reschedule request created:', rescheduleRequest.id)

    return NextResponse.json({
      success: true,
      message: 'Reschedule request submitted successfully',
      rescheduleRequest
    })

  } catch (error: any) {
    console.error('Reschedule request error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

