import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      interview_id,
      interview_date,
      interview_type,
      interview_location,
      meeting_link,
      interview_notes,
      duration_minutes,
      interviewer_name,
      interviewer_email,
      status
    } = body

    if (!interview_id) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Updating interview schedule:', { interview_id, status })

    // Build update data object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (interview_date) updateData.interview_date = new Date(interview_date).toISOString()
    if (interview_type) updateData.interview_type = interview_type
    if (interview_location !== undefined) updateData.interview_location = interview_location
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link
    if (interview_notes !== undefined) updateData.interview_notes = interview_notes
    if (duration_minutes) updateData.duration_minutes = duration_minutes
    if (interviewer_name !== undefined) updateData.interviewer_name = interviewer_name
    if (interviewer_email !== undefined) updateData.interviewer_email = interviewer_email
    if (status) updateData.status = status

    const { data: updatedInterview, error: updateError } = await supabase
      .from('interview_schedules')
      .update(updateData)
      .eq('id', interview_id)
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
        updated_at,
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

    if (updateError) {
      console.error('Error updating interview schedule:', updateError)
      return NextResponse.json(
        { error: 'Failed to update interview schedule' },
        { status: 500 }
      )
    }

    if (!updatedInterview) {
      return NextResponse.json(
        { error: 'Interview schedule not found' },
        { status: 404 }
      )
    }

    console.log('✅ Interview schedule updated successfully:', updatedInterview.id)

    return NextResponse.json({
      success: true,
      interview: updatedInterview,
      message: 'Interview schedule updated successfully!'
    })

  } catch (error: any) {
    console.error('Interview update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
