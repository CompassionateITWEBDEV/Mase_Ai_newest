import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      email,
      name,
      role_id,
      department,
      organization,
      is_active,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing staff ID' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Updating staff member:', id)

    // Update staff table
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff')
      .update({
        email,
        name,
        role_id: role_id || null,
        department: department || null,
        organization: organization || null,
        is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error (staff):', updateError)
      return NextResponse.json(
        { error: 'Failed to update staff member: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully!',
      staff: updatedStaff,
    })
    
  } catch (error: any) {
    console.error('Staff update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

