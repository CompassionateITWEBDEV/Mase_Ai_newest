import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employerId = searchParams.get('employer_id')
    const jobId = searchParams.get('job_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Fetching applications for employer...', { employerId, jobId, status })

    if (!employerId) {
      return NextResponse.json(
        { error: 'Employer ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('applications')
      .select(`
        *,
        applicant:applicants(
          id,
          first_name,
          last_name,
          email,
          phone,
          profession,
          experience_level,
          education_level,
          certifications,
          city,
          state
        ),
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
          employer_id,
          employer:employees(
            company_name
          )
        )
      `)
      .eq('job_posting.employer_id', employerId)
      .order('applied_at', { ascending: false })
      .limit(limit)

    // Filter by specific job if specified
    if (jobId) {
      query = query.eq('job_posting_id', jobId)
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching employer applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${applications?.length || 0} applications for employer`)

    // Transform the data to include company name in job_posting
    const transformedApplications = applications?.map(app => ({
      ...app,
      job_posting: app.job_posting ? {
        ...app.job_posting,
        company_name: app.job_posting.employer?.company_name || 'Unknown Company',
        location: `${app.job_posting.city}, ${app.job_posting.state}`
      } : null,
      applicant: app.applicant ? {
        ...app.applicant,
        full_name: `${app.applicant.first_name} ${app.applicant.last_name}`,
        location: `${app.applicant.city}, ${app.applicant.state}`
      } : null
    }))

    return NextResponse.json({
      success: true,
      applications: transformedApplications,
      count: transformedApplications?.length || 0,
    })
    
  } catch (error: any) {
    console.error('Employer applications fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

