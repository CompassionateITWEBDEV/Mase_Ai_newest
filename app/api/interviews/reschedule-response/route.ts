import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { requestId, action, employerId } = await request.json()

    if (!requestId || !action || !employerId) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, action, employerId' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approved or rejected' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Processing reschedule response:', { requestId, action })

    // Get the reschedule request
    const { data: rescheduleRequest, error: fetchError } = await supabase
      .from('interview_reschedule_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !rescheduleRequest) {
      return NextResponse.json(
        { error: 'Reschedule request not found' },
        { status: 404 }
      )
    }

    if (rescheduleRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This reschedule request has already been processed' },
        { status: 400 }
      )
    }

    // Update the reschedule request status
    const { error: updateError } = await supabase
      .from('interview_reschedule_requests')
      .update({
        status: action,
        review_date: new Date().toISOString(),
        review_by: employerId
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating reschedule request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update reschedule request' },
        { status: 500 }
      )
    }

    // If approved, update the actual interview schedule
    if (action === 'approved') {
      // Update interview schedule
      const { error: interviewUpdateError } = await supabase
        .from('interview_schedules')
        .update({
          interview_date: rescheduleRequest.proposed_date,
          interview_time: rescheduleRequest.proposed_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', rescheduleRequest.interview_id)

      if (interviewUpdateError) {
        console.error('Error updating interview schedule:', interviewUpdateError)
        // Continue despite error - reschedule request is already marked as approved
      }

      // Also update job_applications table if needed
      await supabase
        .from('job_applications')
        .update({
          interview_date: rescheduleRequest.proposed_date,
          interview_time: rescheduleRequest.proposed_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', rescheduleRequest.application_id)
    }

    // Get applicant details for notification
    const { data: applicant } = await supabase
      .from('applicants')
      .select('first_name, last_name')
      .eq('id', rescheduleRequest.applicant_id)
      .single()

    const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}` : 'Applicant'

    // Create notification for applicant
    await supabase
      .from('notifications')
      .insert({
        applicant_id: rescheduleRequest.applicant_id,
        type: 'interview',
        title: action === 'approved' ? 'Interview Rescheduled' : 'Reschedule Request Declined',
        message: action === 'approved' 
          ? `Your interview reschedule request has been approved. New date: ${new Date(rescheduleRequest.proposed_date).toLocaleDateString()} at ${rescheduleRequest.proposed_time}`
          : `Your interview reschedule request has been declined. The interview will proceed as originally scheduled.`,
        action_url: '/applicant-dashboard?tab=interviews',
        read: false
      })

    console.log(`✅ Reschedule request ${action}:`, requestId)

    return NextResponse.json({
      success: true,
      message: action === 'approved' 
        ? 'Reschedule request approved and interview updated'
        : 'Reschedule request rejected',
      rescheduleRequest: { ...rescheduleRequest, status: action }
    })

  } catch (error: any) {
    console.error('Reschedule response error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

