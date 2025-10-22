import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
    } = body

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Creating audit log entry:', { action, resource_type })

    // Get IP from request if not provided
    const clientIp = ip_address || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'

    // Insert audit log
    const { data: logEntry, error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user_id || null,
        action,
        resource_type: resource_type || null,
        resource_id: resource_id || null,
        details: details || {},
        ip_address: clientIp,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error (audit log):', insertError)
      return NextResponse.json(
        { error: 'Failed to create audit log: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Audit log created successfully!',
      log: logEntry,
    })
    
  } catch (error: any) {
    console.error('Audit log creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

