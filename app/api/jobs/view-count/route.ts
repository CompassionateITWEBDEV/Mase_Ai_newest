import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get unique view count (one per user)
    const { data: views, error } = await supabase
      .from('job_views')
      .select('id, applicant_id, employer_id, staff_id, viewed_at')
      .eq('job_posting_id', jobId)

    if (error) {
      console.error('Error fetching view count:', error)
      return NextResponse.json(
        { error: 'Failed to fetch view count' },
        { status: 500 }
      )
    }

    // Count unique users who viewed this job
    const uniqueUsers = new Set()
    views?.forEach(view => {
      if (view.applicant_id) uniqueUsers.add(`applicant_${view.applicant_id}`)
      if (view.employer_id) uniqueUsers.add(`employer_${view.employer_id}`)
      if (view.staff_id) uniqueUsers.add(`staff_${view.staff_id}`)
    })

    const uniqueViewCount = uniqueUsers.size

    return NextResponse.json({
      success: true,
      view_count: uniqueViewCount,
      total_views: views?.length || 0,
      unique_users: uniqueViewCount
    })

  } catch (error: any) {
    console.error('View count API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
