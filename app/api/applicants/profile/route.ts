import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
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

    console.log('Fetching applicant profile for email:', email)

    // Get applicant profile data
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        profession,
        experience_level,
        education_level,
        certifications,
        address,
        city,
        state,
        zip_code,
        created_at
      `)
      .eq('email', email)
      .single()

    if (applicantError) {
      console.error('Error fetching applicant:', applicantError)
      return NextResponse.json(
        { error: 'Failed to fetch applicant profile: ' + applicantError.message },
        { status: 500 }
      )
    }

    if (!applicant) {
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      )
    }

    // Get documents for this applicant
    const { data: documents, error: documentsError } = await supabase
      .from('applicant_documents')
      .select(`
        id,
        document_type,
        file_name,
        file_url,
        verification_status,
        uploaded_at
      `)
      .eq('applicant_id', applicant.id)

    if (documentsError) {
      console.error('Error fetching documents:', documentsError)
      // Don't fail the request if documents can't be fetched
    }

    console.log('Found applicant profile:', applicant)
    console.log('Found documents:', documents)

    // Transform the data to match frontend expectations
    const profileData = {
      id: applicant.id,
      firstName: applicant.first_name,
      lastName: applicant.last_name,
      email: applicant.email,
      phone: applicant.phone || '',
      profession: applicant.profession || '',
      experience: applicant.experience_level || '',
      education: applicant.education_level || '',
      certifications: applicant.certifications || '',
      address: applicant.address || '',
      city: applicant.city || '',
      state: applicant.state || '',
      zipCode: applicant.zip_code || '',
      documents: documents || [],
      memberSince: applicant.created_at
    }

    return NextResponse.json({
      success: true,
      profile: profileData
    })

  } catch (error) {
    console.error('Error in applicant profile API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

