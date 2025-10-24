import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, accountType } = body

    // Validate required fields
    if (!email || !password || !accountType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Login attempt:', { email, accountType })

    // First, try to authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    let userId: string | null = null
    let useFallbackAuth = false

    if (authError || !authData.user) {
      console.log('Supabase Auth failed, trying fallback authentication...')
      useFallbackAuth = true
    } else {
      userId = authData.user.id
    }

    // Now check the specific account type and get user data
    if (accountType === 'applicant') {
      let query = supabase.from('applicants').select('*')
      
      if (useFallbackAuth) {
        // Use fallback authentication - check email and password directly
        query = query.eq('email', email).eq('password_hash', password)
      } else {
        // Use Supabase Auth - check by auth_user_id
        query = query.eq('auth_user_id', userId)
      }

      const { data, error } = await query.single()

      if (error || !data) {
        console.error('Applicant profile not found:', error)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Update last login
      await supabase
        .from('applicants')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)

      return NextResponse.json({
        success: true,
        message: 'Login successful!',
        user: {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zip_code,
          profession: data.profession,
          experience: data.experience_level,
          education: data.education_level,
          certifications: data.certifications,
          accountType: 'applicant',
        },
        redirectTo: '/applicant-dashboard',
      })
      
    } else if (accountType === 'employer') {
      let query = supabase.from('employers').select('*')
      
      if (useFallbackAuth) {
        // Use fallback authentication - check email and password directly
        query = query.eq('email', email).eq('password_hash', password)
      } else {
        // Use Supabase Auth - check by auth_user_id
        query = query.eq('auth_user_id', userId)
      }

      const { data, error } = await query.single()

      if (error || !data) {
        console.error('Employer profile not found:', error)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Update last login
      await supabase
        .from('employers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)

      return NextResponse.json({
        success: true,
        message: 'Login successful!',
        user: {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          companyName: data.company_name,
          companyType: data.company_type,
          facilitySize: data.facility_size,
          city: data.city,
          state: data.state,
          phone: data.phone,
          accountType: 'employer',
        },
        redirectTo: '/employer-dashboard',
      })
      
    } else if (accountType === 'staff') {
      // Check staff table
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        console.error('Staff profile not found:', error)
        return NextResponse.json(
          { error: 'Account not found. Please contact support.' },
          { status: 404 }
        )
      }

      // Update last login
      await supabase
        .from('staff')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)

      return NextResponse.json({
        success: true,
        message: 'Login successful!',
        user: {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role_id,
          accountType: 'staff',
        },
        redirectTo: '/staff-dashboard',
      })
    }

    return NextResponse.json(
      { error: 'Invalid account type' },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

