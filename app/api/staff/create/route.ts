import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      name,
      role_id,
      department,
      organization,
      is_active = true,
    } = body

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email and name' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Creating staff member:', { email, name, role_id })

    // Check if email already exists
    const { data: existing } = await supabase
      .from('staff')
      .select('email')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists in staff database' },
        { status: 400 }
      )
    }

    // Insert into staff table
    const { data: newStaff, error: insertError } = await supabase
      .from('staff')
      .insert({
        email,
        name,
        role_id: role_id || null,
        department: department || null,
        organization: organization || null,
        is_active,
        last_login: null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error (staff):', insertError)
      return NextResponse.json(
        { error: 'Failed to create staff member: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member created successfully!',
      staff: {
        id: newStaff?.id || 'unknown',
        email: newStaff?.email,
        name: newStaff?.name,
        role_id: newStaff?.role_id,
        department: newStaff?.department,
      },
    })
    
  } catch (error: any) {
    console.error('Staff creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

