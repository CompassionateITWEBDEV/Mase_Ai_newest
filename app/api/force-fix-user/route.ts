import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the first available applicant from the database
    const { data: applicants, error } = await supabase
      .from('applicants')
      .select('*')
      .limit(1)

    if (error || !applicants || applicants.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No applicants found in database'
      })
    }

    const applicant = applicants[0]

    // Return the correct user data that can be used to fix localStorage
    const userData = {
      id: applicant.id,
      email: applicant.email,
      firstName: applicant.first_name,
      lastName: applicant.last_name,
      phone: applicant.phone || '',
      address: applicant.address || '',
      city: applicant.city || '',
      state: applicant.state || '',
      zipCode: applicant.zip_code || '',
      profession: applicant.profession || '',
      experience: applicant.experience_level || '',
      education: applicant.education_level || '',
      certifications: applicant.certifications || '',
      accountType: 'applicant',
    }

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Use this data to fix your localStorage',
      instructions: [
        '1. Open browser console (F12)',
        '2. Run: localStorage.setItem("currentUser", JSON.stringify(USER_DATA_FROM_THIS_RESPONSE))',
        '3. Refresh the applicant dashboard page'
      ]
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
}
