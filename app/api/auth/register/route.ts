import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      accountType,
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      zipCode,
      // Applicant-specific
      profession,
      experience,
      education,
      certifications,
      // Employer-specific
      companyName,
      companyType,
      facilitySize,
      // Settings
      marketingOptIn,
    } = body

    // Validate required fields
    if (!accountType || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (accountType !== 'applicant' && accountType !== 'employer') {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // BYPASS AUTH - Direct insert into database without Supabase Auth
    console.log('Bypassing auth, inserting directly into database...')

    // Check if email already exists
    if (accountType === 'applicant') {
      const { data: existing } = await supabase
        .from('applicants')
        .select('email')
        .eq('email', email)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Email already registered as applicant' },
          { status: 400 }
        )
      }

      // Insert into applicants table
      const { data: newApplicant, error: insertError } = await supabase
        .from('applicants')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          address,
          city,
          state,
          zip_code: zipCode,
          profession,
          experience_level: experience,
          education_level: education,
          certifications,
          marketing_opt_in: marketingOptIn || false,
          is_active: true,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error (applicant):', insertError)
        return NextResponse.json(
          { error: 'Failed to create applicant profile: ' + insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Applicant account created successfully!',
        user: {
          id: newApplicant?.id || 'unknown',
          email: email,
          accountType: 'applicant',
        },
      })
      
    } else if (accountType === 'employer') {
      const { data: existing } = await supabase
        .from('employers')
        .select('email')
        .eq('email', email)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Email already registered as employer' },
          { status: 400 }
        )
      }

      // Insert into employers table
      const { data: newEmployer, error: insertError } = await supabase
        .from('employers')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          address,
          city,
          state,
          zip_code: zipCode,
          company_name: companyName,
          company_type: companyType,
          facility_size: facilitySize,
          marketing_opt_in: marketingOptIn || false,
          is_active: true,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error (employer):', insertError)
        return NextResponse.json(
          { error: 'Failed to create employer profile: ' + insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Employer account created successfully!',
        user: {
          id: newEmployer?.id || 'unknown',
          email: email,
          accountType: 'employer',
        },
      })
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    )
    
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
