import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicantId = searchParams.get('applicant_id')
    
    console.log('Fetching saved jobs...', { applicantId })

    if (!applicantId) {
      return NextResponse.json(
        { error: 'Applicant ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: savedJobs, error } = await supabase
      .from('saved_jobs')
      .select(`
        job_posting_id,
        saved_date,
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
      .eq('applicant_id', applicantId)
      .order('saved_date', { ascending: false })

    if (error) {
      console.error('Error fetching saved jobs:', error)
      // If table doesn't exist, return empty array
      if (error.message.includes('relation "saved_jobs" does not exist') || 
          error.message.includes('does not exist')) {
        console.log('Saved jobs table does not exist, returning empty array')
        return NextResponse.json({
          success: true,
          savedJobs: [],
          count: 0,
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch saved jobs: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${savedJobs?.length || 0} saved jobs`)

    return NextResponse.json({
      success: true,
      savedJobs: savedJobs || [],
      count: savedJobs?.length || 0,
    })
    
  } catch (error: any) {
    console.error('Saved jobs fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
