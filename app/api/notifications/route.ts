import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GET notifications for an employer or applicant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employerId = searchParams.get('employer_id')
    const applicantId = searchParams.get('applicant_id')

    if (!employerId && !applicantId) {
      return NextResponse.json(
        { error: 'Employer ID or Applicant ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by employer or applicant
    if (employerId) {
      query = query.eq('employer_id', employerId)
    } else if (applicantId) {
      query = query.eq('applicant_id', applicantId)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      count: notifications?.length || 0
    })

  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employer_id, applicant_id, type, title, message, action_url } = body

    if ((!employer_id && !applicant_id) || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const notificationData: any = {
      type,
      title,
      message,
      action_url: action_url || null
    }

    // Add the appropriate ID
    if (employer_id) {
      notificationData.employer_id = employer_id
    } else if (applicant_id) {
      notificationData.applicant_id = applicant_id
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
