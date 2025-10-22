import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Fetching audit logs from database...')

    // Fetch audit logs with staff info
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        staff:user_id (
          name,
          email
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audit logs: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${logs?.length || 0} audit log entries`)

    return NextResponse.json({
      success: true,
      logs: logs || [],
      count: logs?.length || 0,
    })
    
  } catch (error: any) {
    console.error('Audit log fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

