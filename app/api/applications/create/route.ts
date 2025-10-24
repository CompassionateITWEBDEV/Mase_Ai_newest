import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      job_posting_id,
      applicant_id,
      cover_letter,
      resume_url,
    } = body

    if (!job_posting_id || !applicant_id) {
      return NextResponse.json(
        { error: 'Missing required fields: job_posting_id, applicant_id' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // For testing purposes, only require resume - other documents are optional
    const { data: documents, error: docError } = await supabase
      .from('applicant_documents')
      .select('document_type, status, file_name, uploaded_date')
      .eq('applicant_id', applicant_id)
      .eq('document_type', 'resume')
      .eq('status', 'verified')

    if (docError) {
      console.error('Document validation error:', docError)
      return NextResponse.json(
        { error: 'Failed to validate documents' },
        { status: 500 }
      )
    }

    // For testing: Only require resume, other documents are optional
    const requiredDocuments = [
      { type: 'resume', name: 'Resume' }
    ]

    // Check if resume is present and verified
    const hasResume = documents && documents.length > 0

    if (!hasResume) {
      return NextResponse.json(
        { 
          error: 'Missing required documents',
          missingDocuments: [{ type: 'resume', name: 'Resume' }],
          message: 'Please upload your resume before applying for jobs.'
        },
        { status: 400 }
      )
    }

    console.log('Creating job application:', { job_posting_id, applicant_id })

    // Check if application already exists
    const { data: existingApp } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_posting_id', job_posting_id)
      .eq('applicant_id', applicant_id)
      .single()

    if (existingApp) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 400 }
      )
    }

    // Get job posting details to populate job_title and job_type
    const { data: jobPosting } = await supabase
      .from('job_postings')
      .select('title, job_type, employer_id')
      .eq('id', job_posting_id)
      .single()

    const { data: newApplication, error: insertError } = await supabase
      .from('job_applications')
      .insert({
        job_posting_id,
        applicant_id,
        employer_id: jobPosting?.employer_id || null,
        job_title: jobPosting?.title || 'Unknown Position',
        job_type: jobPosting?.job_type || 'full-time',
        status: 'pending',
        applied_date: new Date().toISOString(),
        cover_letter: cover_letter || null,
        resume_url: resume_url || null,
      })
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
      .single()

    if (insertError) {
      console.error('Insert error (application):', insertError)
      return NextResponse.json(
        { error: 'Failed to create application: ' + insertError.message },
        { status: 500 }
      )
    }

    // Transform the data to include company name
    const transformedApplication = {
      ...newApplication,
      job_posting: newApplication.job_posting ? {
        ...newApplication.job_posting,
        company_name: newApplication.job_posting.employer?.company_name || 'Unknown Company',
        location: `${newApplication.job_posting.city}, ${newApplication.job_posting.state}`
      } : null
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      application: transformedApplication,
    })
    
  } catch (error: any) {
    console.error('Application creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
