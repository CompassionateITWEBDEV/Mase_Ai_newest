import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// PUT - Update notification read status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_id, read, employer_id, applicant_id } = body

    if (!notification_id || read === undefined || (!employer_id && !applicant_id)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Build query based on user type
    let query = supabase
      .from('notifications')
      .update({ 
        read: read,
        updated_at: new Date().toISOString()
      })
      .eq('id', notification_id)

    if (employer_id) {
      query = query.eq('employer_id', employer_id)
    } else if (applicant_id) {
      query = query.eq('applicant_id', applicant_id)
    }

    const { data: notification, error } = await query
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Mark all notifications as read for an employer or applicant
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { employer_id, applicant_id } = body

    if (!employer_id && !applicant_id) {
      return NextResponse.json(
        { error: 'Employer ID or Applicant ID is required' },
        { status: 400 }
      )
    }

    // Build query based on user type
    let query = supabase
      .from('notifications')
      .update({ 
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('read', false)

    if (employer_id) {
      query = query.eq('employer_id', employer_id)
    } else if (applicant_id) {
      query = query.eq('applicant_id', applicant_id)
    }

    const { data: notifications, error } = await query.select()

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated_count: notifications?.length || 0
    })

  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
