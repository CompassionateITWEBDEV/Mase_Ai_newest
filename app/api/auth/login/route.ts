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

    // Check based on account type
    if (accountType === 'applicant') {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !data) {
        console.error('Applicant not found:', error)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // NOTE: In real app, you should hash/verify password
      // For now, we're just checking if user exists
      
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
      const { data, error } = await supabase
        .from('employers')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !data) {
        console.error('Employer not found:', error)
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
        .eq('email', email)
        .single()

      if (error || !data) {
        console.error('Staff not found:', error)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
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

