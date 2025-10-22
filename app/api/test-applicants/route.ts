import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get all applicants
    const { data: applicants, error } = await supabase
      .from('applicants')
      .select('id, first_name, last_name, email')
      .limit(10)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Database error: ' + error.message,
        code: error.code,
        details: error.details
      })
    }

    return NextResponse.json({
      success: true,
      applicants: applicants,
      count: applicants?.length || 0
    })

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
}
