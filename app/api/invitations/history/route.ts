import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const templateType = searchParams.get('template_type')
    const search = searchParams.get('search')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('invitations')
      .select('*')
      .order('sent_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    if (search) {
      query = query.or(`recipient_name.ilike.%${search}%,recipient_email.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: invitations, error } = await query

    if (error) {
      console.error('Error fetching invitation history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitation history' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      invitations: invitations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('Invitation history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
