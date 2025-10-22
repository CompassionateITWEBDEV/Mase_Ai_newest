import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employerId = searchParams.get('employer_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Fetching job postings...', { employerId, status })

    let query = supabase
      .from('job_postings')
      .select(`
        *,
        employer:employers(
          id,
          company_name,
          company_type,
          city,
          state
        )
      `)
      .order('posted_date', { ascending: false })
      .limit(limit)

    // Filter by employer if specified
    if (employerId) {
      query = query.eq('employer_id', employerId)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error fetching job postings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch job postings: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${jobs?.length || 0} job postings`)

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
      count: jobs?.length || 0,
    })
    
  } catch (error: any) {
    console.error('Job postings fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

