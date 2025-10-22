import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { applicationId, status, notes } = await request.json()

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      )
    }

    if (!['pending', 'accepted', 'rejected', 'reviewing', 'interview_scheduled', 'offer_received', 'offer_accepted', 'offer_declined'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, accepted, rejected, reviewing, interview_scheduled, offer_received, offer_accepted, or offer_declined' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    // Use service role key if available (bypasses RLS), otherwise use anon key
    const supabase = createClient(
      supabaseUrl, 
      supabaseServiceKey || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Updating application status:', { applicationId, status, notes })

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    // Update the application
    const { data: updatedApplication, error: updateError } = await supabase
      .from('job_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select(`
        *,
        applicant:applicants(
          id,
          first_name,
          last_name,
          email,
          phone,
          profession,
          experience_level,
          education_level,
          certifications,
          city,
          state
        ),
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
      .single()

    if (updateError) {
      console.error('Error updating application status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application status: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('Application status updated successfully:', updatedApplication)

    // Transform the data
    const transformedApplication = {
      ...updatedApplication,
      job_posting: updatedApplication.job_posting ? {
        ...updatedApplication.job_posting,
        company_name: updatedApplication.job_posting.employer?.company_name || 'Unknown Company',
        location: `${updatedApplication.job_posting.city}, ${updatedApplication.job_posting.state}`
      } : null,
      applicant: updatedApplication.applicant ? {
        ...updatedApplication.applicant,
        full_name: `${updatedApplication.applicant.first_name} ${updatedApplication.applicant.last_name}`,
        location: `${updatedApplication.applicant.city}, ${updatedApplication.applicant.state}`
      } : null
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application: transformedApplication,
    })
    
  } catch (error: any) {
    console.error('Application status update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

