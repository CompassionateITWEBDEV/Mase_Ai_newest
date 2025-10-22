import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { job_posting_id, user_type, user_id } = await request.json()

    if (!job_posting_id) {
      return NextResponse.json(
        { error: 'Job posting ID is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get client IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1'
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Prepare the view data
    const viewData: any = {
      job_posting_id,
      viewed_at: new Date().toISOString(),
      ip_address: ip,
      user_agent: userAgent
    }

    // Add user-specific ID based on user type
    if (user_type === 'applicant' && user_id) {
      viewData.applicant_id = user_id
    } else if (user_type === 'employer' && user_id) {
      viewData.employer_id = user_id
    } else if (user_type === 'staff' && user_id) {
      viewData.staff_id = user_id
    }

    // Check if this user has already viewed this job
    let existingView = null
    if (user_id) {
      const { data: existing } = await supabase
        .from('job_views')
        .select('id')
        .eq('job_posting_id', job_posting_id)
        .or(`${user_type}_id.eq.${user_id}`)
        .single()

      existingView = existing
    }

    // If user has already viewed this job, return success without incrementing
    if (existingView) {
      return NextResponse.json({
        success: true,
        message: 'Job view already recorded',
        already_viewed: true
      })
    }

    // Insert the new view
    const { data: newView, error: insertError } = await supabase
      .from('job_views')
      .insert(viewData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting job view:', insertError)
      return NextResponse.json(
        { error: 'Failed to record job view: ' + insertError.message },
        { status: 500 }
      )
    }

    // Only increment the view count in job_postings if this is a new view
    try {
      // Get current view count
      const { data: currentData, error: fetchError } = await supabase
        .from('job_postings')
        .select('views_count')
        .eq('id', job_posting_id)
        .single()

      if (!fetchError && currentData) {
        const currentCount = currentData.views_count || 0
        
        // Increment the view count
        await supabase
          .from('job_postings')
          .update({ 
            views_count: currentCount + 1
          })
          .eq('id', job_posting_id)
      }
    } catch (incrementError) {
      console.error('Error incrementing view count:', incrementError)
      // Don't fail the view recording if count increment fails
    }

    // Get updated view count for this job
    const { data: viewCount, error: countError } = await supabase
      .from('job_views')
      .select('id')
      .eq('job_posting_id', job_posting_id)

    if (countError) {
      console.error('Error getting view count:', countError)
    }

    return NextResponse.json({
      success: true,
      message: 'Job view recorded successfully',
      view_count: viewCount?.length || 0,
      already_viewed: false
    })

  } catch (error: any) {
    console.error('Job view tracking error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if a user has viewed a job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const job_posting_id = searchParams.get('job_posting_id')
    const user_type = searchParams.get('user_type')
    const user_id = searchParams.get('user_id')

    if (!job_posting_id || !user_type || !user_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Check if user has viewed this job
    const { data: existingView, error } = await supabase
      .from('job_views')
      .select('id, viewed_at')
      .eq('job_posting_id', job_posting_id)
      .or(`${user_type}_id.eq.${user_id}`)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking job view:', error)
      return NextResponse.json(
        { error: 'Failed to check job view: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      has_viewed: !!existingView,
      viewed_at: existingView?.viewed_at || null
    })

  } catch (error: any) {
    console.error('Job view check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
