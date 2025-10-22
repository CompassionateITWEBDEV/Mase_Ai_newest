import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicantId = searchParams.get('applicant_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Fetching applications...', { applicantId, status })

    let query = supabase
      .from('job_applications')
      .select(`
        *,
        job_posting:job_postings(
          id,
          title,
          description,
          job_type,
          salary_min,
          salary_max,
          salary_type,
          city,
          state,
          employer:employers(
            company_name
          )
        )
      `)
      .order('applied_date', { ascending: false })
      .limit(limit)

    // Filter by applicant if specified
    if (applicantId) {
      query = query.eq('applicant_id', applicantId)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${applications?.length || 0} applications`)

    // Transform the data to include company name in job_posting
    const transformedApplications = applications?.map(app => ({
      ...app,
      job_posting: app.job_posting ? {
        ...app.job_posting,
        company_name: app.job_posting.employer?.company_name || 'Unknown Company',
        location: `${app.job_posting.city}, ${app.job_posting.state}`
      } : null
    })) || []

    return NextResponse.json({
      success: true,
      applications: transformedApplications,
      count: transformedApplications.length,
    })
    
  } catch (error: any) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
