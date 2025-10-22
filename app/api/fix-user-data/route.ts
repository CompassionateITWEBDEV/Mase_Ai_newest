import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Find applicant by email
    const { data: applicant, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !applicant) {
      return NextResponse.json({
        success: false,
        error: 'Applicant not found with email: ' + email
      })
    }

    // Return the correct user data
    const userData = {
      id: applicant.id,
      email: applicant.email,
      firstName: applicant.first_name,
      lastName: applicant.last_name,
      phone: applicant.phone,
      address: applicant.address,
      city: applicant.city,
      state: applicant.state,
      zipCode: applicant.zip_code,
      profession: applicant.profession,
      experience: applicant.experience_level,
      education: applicant.education_level,
      certifications: applicant.certifications,
      accountType: 'applicant',
    }

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'User data retrieved successfully'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
}

