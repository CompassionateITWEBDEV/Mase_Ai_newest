import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      employer_id,
      title,
      description,
      job_type,
      position_type,
      experience_required,
      education_required,
      certifications_required,
      skills_required,
      salary_min,
      salary_max,
      salary_type,
      benefits,
      location_type,
      city,
      state,
      zip_code,
      status = 'draft',
      is_featured = false,
      is_urgent = false,
    } = body

    // Validate required fields
    if (!employer_id || !title || !description || !job_type) {
      return NextResponse.json(
        { error: 'Missing required fields: employer_id, title, description, job_type' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Creating job posting:', { employer_id, title, status })

    // Insert job posting
    const { data: newJob, error: insertError } = await supabase
      .from('job_postings')
      .insert({
        employer_id,
        title,
        description,
        job_type,
        position_type,
        experience_required,
        education_required,
        certifications_required,
        skills_required,
        salary_min,
        salary_max,
        salary_type,
        benefits,
        location_type,
        city,
        state,
        zip_code,
        status,
        is_featured,
        is_urgent,
        posted_date: status === 'active' ? new Date().toISOString() : null,
      })
      .select(`
        *,
        employer:employers(
          company_name,
          city,
          state
        )
      `)
      .single()

    if (insertError) {
      console.error('Insert error (job posting):', insertError)
      return NextResponse.json(
        { error: 'Failed to create job posting: ' + insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job posting created successfully!',
      job: newJob,
    })
    
  } catch (error: any) {
    console.error('Job creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

