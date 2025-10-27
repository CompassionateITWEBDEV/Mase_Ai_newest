import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const { applicationId, status, notes, is_accepted } = await request.json()

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

    console.log('Updating application status:', { applicationId, status, notes, is_accepted })

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    if (is_accepted !== undefined) {
      updateData.is_accepted = is_accepted
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

    // Create notifications based on status change
    if (updatedApplication.applicant_id) {
      try {
        const jobTitle = updatedApplication.job_posting?.title || 'the position'
        const companyName = updatedApplication.job_posting?.employer?.company_name || 'the company'
        
        // Notify applicant when hired (status: accepted)
        if (status === 'accepted') {
          await supabase
            .from('notifications')
            .insert({
              applicant_id: updatedApplication.applicant_id,
              type: 'offer',
              title: 'Congratulations! You\'re Hired!',
              message: `Congratulations! ${companyName} has hired you for the ${jobTitle} position. Check your email for further details.`,
              action_url: '/applicant-dashboard?tab=applications',
              read: false
            })
          console.log('✅ Hired notification created for applicant:', updatedApplication.applicant_id)
        }
        
        // Notify applicant when rejected
        else if (status === 'rejected') {
          await supabase
            .from('notifications')
            .insert({
              applicant_id: updatedApplication.applicant_id,
              type: 'application',
              title: 'Application Update',
              message: `Your application for ${jobTitle} at ${companyName} has been reviewed. Thank you for your interest.`,
              action_url: '/applicant-dashboard?tab=applications',
              read: false
            })
          console.log('✅ Application update notification created for applicant')
        }
        
        // Notify applicant when application is accepted for review (qualified candidate)
        else if (status === 'reviewing') {
          await supabase
            .from('notifications')
            .insert({
              applicant_id: updatedApplication.applicant_id,
              type: 'application',
              title: 'Application Accepted for Review',
              message: `${companyName} has accepted your application for ${jobTitle}. Your application is being reviewed and you may hear back about next steps soon.`,
              action_url: '/applicant-dashboard?tab=applications',
              read: false
            })
          console.log('✅ Application accepted for review notification created for applicant')
        }
      } catch (notifError) {
        console.error('Error creating status notification:', notifError)
        // Don't fail the request if notification creation fails
      }
    }

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

