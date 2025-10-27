import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { 
      applicationId, 
      offerSalary, 
      offerStartDate, 
      offerExpiryDate, 
      offerNotes, 
      benefits,
      workSchedule,
      isCandidatePool = false,
      candidateId,
      employerId,
      jobTitle = 'Direct Offer'
    } = await request.json()

    console.log('Send offer API received:', {
      applicationId,
      isCandidatePool,
      candidateId,
      employerId,
      jobTitle
    })

    if (!applicationId || !offerSalary || !offerStartDate || !offerExpiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, offerSalary, offerStartDate, offerExpiryDate' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let updatedApplication

    if (isCandidatePool) {
      // For candidate pool offers, create a new job application record first
      console.log('Creating job application for candidate pool offer:', { candidateId, employerId, jobTitle })
      
      // First, create a job application record
      const { data: newApplication, error: createError } = await supabase
        .from('job_applications')
        .insert({
          applicant_id: candidateId,
          job_posting_id: null, // No specific job posting for candidate pool offers
          employer_id: employerId,
          status: 'offer_received',
          cover_letter: 'Direct offer from candidate pool',
          applied_date: new Date().toISOString(),
          offer_salary: offerSalary,
          offer_start_date: offerStartDate,
          offer_expiry_date: offerExpiryDate,
          offer_notes: offerNotes,
          offer_benefits: benefits,
          offer_work_schedule: workSchedule,
          offer_sent_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Error creating job application for candidate pool offer:', createError)
        return NextResponse.json(
          { error: 'Failed to create job application: ' + createError.message },
          { status: 500 }
        )
      }

      updatedApplication = newApplication
      
      // Fetch related data for candidate pool offer
      if (updatedApplication) {
        const [applicantData] = await Promise.all([
          updatedApplication.applicant_id
            ? supabase.from('applicants').select('first_name, last_name, email, phone').eq('id', updatedApplication.applicant_id).single().then(r => r.data)
            : null
        ])
        
        updatedApplication.applicant = applicantData
      }
    } else {
      // For regular job applications, update existing record
      const { data: app, error: updateError } = await supabase
        .from('job_applications')
        .update({
          status: 'offer_received',
          offer_salary: offerSalary,
          offer_start_date: offerStartDate,
          offer_expiry_date: offerExpiryDate,
          offer_notes: offerNotes,
          offer_benefits: benefits,
          offer_work_schedule: workSchedule,
          offer_sent_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select('*')
        .single()

      if (updateError) {
        console.error('Error sending offer:', updateError)
        return NextResponse.json(
          { error: 'Failed to send offer: ' + updateError.message },
          { status: 500 }
        )
      }

      updatedApplication = app
      
      // Fetch related data for regular offer
      if (updatedApplication) {
        const [applicantData, jobData, employerData] = await Promise.all([
          updatedApplication.applicant_id
            ? supabase.from('applicants').select('first_name, last_name, email, phone').eq('id', updatedApplication.applicant_id).single().then(r => r.data)
            : null,
          updatedApplication.job_posting_id
            ? supabase.from('job_postings').select('title, employer_id').eq('id', updatedApplication.job_posting_id).single().then(r => r.data)
            : null,
          updatedApplication.employer_id
            ? supabase.from('employers').select('company_name').eq('id', updatedApplication.employer_id).single().then(r => r.data)
            : null
        ])
        
        updatedApplication.applicant = applicantData
        updatedApplication.job_posting = jobData ? { ...jobData, employer: employerData } : null
      }
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: 'Job offer sent successfully'
    })

  } catch (error: any) {
    console.error('Send offer API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
