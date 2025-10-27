import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobIds = searchParams.get('job_ids') // Comma-separated list of job IDs
    
    console.log('Fetching job ratings...', { jobIds })

    if (!jobIds) {
      return NextResponse.json(
        { error: 'Job IDs are required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const jobIdArray = jobIds.split(',').filter(id => id.trim())

    // Get saved jobs count for each job
    const { data: savedJobsData, error: savedJobsError } = await supabase
      .from('saved_jobs')
      .select('job_posting_id')
      .in('job_posting_id', jobIdArray)

    if (savedJobsError) {
      console.error('Error fetching saved jobs:', savedJobsError)
      // If table doesn't exist, return default ratings
      if (savedJobsError.message.includes('relation "saved_jobs" does not exist') || 
          savedJobsError.message.includes('does not exist')) {
        console.log('Saved jobs table does not exist, returning default ratings')
        const defaultRatings: Record<string, number> = {}
        jobIdArray.forEach(jobId => {
          defaultRatings[jobId] = 4.0 // Default rating when no data available
        })
        return NextResponse.json({
          success: true,
          ratings: defaultRatings
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch saved jobs: ' + savedJobsError.message },
        { status: 500 }
      )
    }

    // Count saved jobs per job posting
    const savedCounts: Record<string, number> = {}
    savedJobsData?.forEach(savedJob => {
      const jobId = savedJob.job_posting_id
      savedCounts[jobId] = (savedCounts[jobId] || 0) + 1
    })

    // Get applications count for each job to calculate popularity
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('job_applications')
      .select('job_posting_id')
      .in('job_posting_id', jobIdArray)

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError)
    }

    // Count applications per job posting
    const applicationCounts: Record<string, number> = {}
    applicationsData?.forEach(application => {
      const jobId = application.job_posting_id
      applicationCounts[jobId] = (applicationCounts[jobId] || 0) + 1
    })

    // Calculate ratings based on saved jobs and applications
    const ratings: Record<string, number> = {}
    
    jobIdArray.forEach(jobId => {
      const savedCount = savedCounts[jobId] || 0
      const applicationCount = applicationCounts[jobId] || 0
      
      // Base rating starts at 3.0
      let rating = 3.0
      
      // Add points for saved jobs (popularity indicator)
      if (savedCount > 0) {
        rating += Math.min(savedCount * 0.2, 1.0) // Max 1.0 points for saves
      }
      
      // Add points for applications (demand indicator)
      if (applicationCount > 0) {
        rating += Math.min(applicationCount * 0.1, 1.0) // Max 1.0 points for applications
      }
      
      // Add points for high application-to-save ratio (quality indicator)
      if (savedCount > 0 && applicationCount > 0) {
        const ratio = applicationCount / savedCount
        if (ratio > 2) {
          rating += 0.5 // High demand relative to saves
        } else if (ratio > 1) {
          rating += 0.3 // Good demand relative to saves
        }
      }
      
      // Cap rating at 5.0
      rating = Math.min(rating, 5.0)
      
      // Round to 1 decimal place
      ratings[jobId] = Math.round(rating * 10) / 10
    })

    console.log('Calculated ratings:', ratings)

    return NextResponse.json({
      success: true,
      ratings: ratings
    })
    
  } catch (error: any) {
    console.error('Job ratings fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

