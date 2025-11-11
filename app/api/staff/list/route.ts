import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Configure runtime for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[API] Supabase credentials not configured')
      return NextResponse.json(
        { 
          success: false,
          error: 'Supabase credentials not configured',
          staff: [],
          count: 0
        },
        { status: 500 }
      )
    }

    // Create a fresh client for each request to avoid connection issues
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('Fetching all staff members from database...')

    // Fetch all staff from database
    const { data: staffList, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[API] Database error fetching staff:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch staff: ' + error.message,
          staff: [],
          count: 0
        },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${staffList?.length || 0} staff members`)

    const response = NextResponse.json({
      success: true,
      staff: staffList || [],
      count: staffList?.length || 0,
      timestamp: new Date().toISOString(),
    })

    // Disable caching for fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('CDN-Cache-Control', 'no-store')
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store')

    return response
    
  } catch (error: any) {
    console.error('[API] Unexpected error in staff/list:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    })
    
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // Return a response that matches the expected format even on error
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        details: isDevelopment ? error.stack : undefined,
        staff: [],
        count: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

