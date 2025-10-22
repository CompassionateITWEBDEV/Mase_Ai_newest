import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get recommended jobs (for now, just get recent jobs with some filtering)
    const { data: jobs, error } = await supabase
      .from('job_postings')
      .select(`
        id,
        title,
        description,
        job_type,
        salary_min,
        salary_max,
        salary_type,
        city,
        state,
        posted_date,
        views_count,
        applications_count,
        saved_count,
        employer:employers(
          id,
          company_name
        )
      `)
      .eq('status', 'active')
      .order('posted_date', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recommended jobs' },
        { status: 500 }
      )
    }

    // Transform the data to include company name
    const transformedJobs = jobs?.map(job => ({
      ...job,
      company_name: job.employer?.company_name || 'Healthcare Facility',
      location: `${job.city}, ${job.state}`,
      salary_range: `$${job.salary_min?.toLocaleString()}-${job.salary_max?.toLocaleString()}`,
      posted_ago: getTimeAgo(job.posted_date)
    })) || []

    return NextResponse.json({
      success: true,
      jobs: transformedJobs
    })

  } catch (error: any) {
    console.error('Recommended jobs error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 14) return '1 week ago'
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}
