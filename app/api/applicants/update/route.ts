import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/applicants/update called')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { id, ...updates } = body

    if (!id) {
      console.log('Missing id field')
      return NextResponse.json(
        { error: 'Missing required field: id' },
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

    console.log('Updating applicant:', id, 'with updates:', updates)

    // Map frontend field names to database field names
    const dbUpdates: any = {}
    if (updates.firstName) dbUpdates.first_name = updates.firstName
    if (updates.lastName) dbUpdates.last_name = updates.lastName
    if (updates.email) dbUpdates.email = updates.email
    if (updates.phone) dbUpdates.phone = updates.phone
    if (updates.profession) dbUpdates.profession = updates.profession
    if (updates.experience) dbUpdates.experience_level = updates.experience
    if (updates.education) dbUpdates.education_level = updates.education
    if (updates.certifications) dbUpdates.certifications = updates.certifications
    if (updates.address) dbUpdates.address = updates.address
    if (updates.city) dbUpdates.city = updates.city
    if (updates.state) dbUpdates.state = updates.state
    if (updates.zipCode) dbUpdates.zip_code = updates.zipCode

    console.log('Mapped database updates:', dbUpdates)

    // Check if there are any updates to make
    if (Object.keys(dbUpdates).length === 0) {
      console.log('No updates to make')
      return NextResponse.json({
        success: true,
        message: 'No updates needed',
        applicant: null,
      })
    }

    // First, check if the applicant exists
    const { data: existingApplicant, error: checkError } = await supabase
      .from('applicants')
      .select('id, first_name, last_name')
      .eq('id', id)
      .single()

    if (checkError) {
      console.error('Applicant not found:', checkError)
      return NextResponse.json(
        { error: 'Applicant not found with ID: ' + id },
        { status: 404 }
      )
    }

    console.log('Found existing applicant:', existingApplicant)

    // Now update the applicant
    const { data: updatedApplicant, error: updateError } = await supabase
      .from('applicants')
      .update(dbUpdates)
      .eq('id', id)
      .select()

    if (updateError) {
      console.error('Update error (applicant):', updateError)
      return NextResponse.json(
        { error: 'Failed to update applicant: ' + updateError.message },
        { status: 500 }
      )
    }

    if (!updatedApplicant || updatedApplicant.length === 0) {
      console.error('No applicant was updated - this might be due to RLS policies or the record not existing')
      console.error('Applicant ID:', id)
      console.error('Updates attempted:', dbUpdates)
      
      // Try to fetch the applicant again to see if it exists
      const { data: checkApplicant, error: checkError } = await supabase
        .from('applicants')
        .select('id, first_name, last_name, email')
        .eq('id', id)
        .single()
      
      console.error('Applicant exists check:', { checkApplicant, checkError })
      
      return NextResponse.json(
        { error: 'No applicant was updated. This might be due to Row Level Security policies or the record not existing.' },
        { status: 500 }
      )
    }

    console.log('Successfully updated applicant:', updatedApplicant[0])

    return NextResponse.json({
      success: true,
      message: 'Applicant updated successfully!',
      applicant: updatedApplicant[0],
    })
    
  } catch (error: any) {
    console.error('Applicant update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
