import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch applications first
    const { data: applications, error: applicationsError } = await supabase
      .from('job_applications')
      .select(`
        id,
        applicant_id,
        employer_id,
        job_title,
        job_type,
        status,
        cover_letter,
        resume_url,
        notes,
        applied_date,
        updated_at,
        interview_date,
        interview_time,
        interview_location,
        interviewer,
        interview_notes,
        offer_deadline,
        offer_details,
        offer_salary_min,
        offer_salary_max,
        offer_salary_type,
        job_posting_id
      `)
      .order('applied_date', { ascending: false })

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError)
      return NextResponse.json(
        { error: 'Failed to fetch applications: ' + applicationsError.message },
        { status: 500 }
      )
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ applications: [] })
    }

    // Fetch applicants data separately
    const applicantIds = [...new Set(applications.map(app => app.applicant_id).filter(Boolean))]
    let applicantsData: any = {}
    if (applicantIds.length > 0) {
      const { data: applicants, error: applicantsError } = await supabase
        .from('applicants')
        .select('id, first_name, last_name, email, phone, address, city, state, zip_code')
        .in('id', applicantIds)

      if (!applicantsError && applicants) {
        applicants.forEach(applicant => {
          applicantsData[applicant.id] = applicant
        })
      }
    }

    // Fetch application forms data separately
    const applicationIds = applications.map(app => app.id)
    let formsData: any = {}
    if (applicationIds.length > 0) {
      const { data: forms, error: formsError } = await supabase
        .from('application_forms')
        .select(`
          id,
          job_application_id,
          first_name,
          middle_initial,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code,
          date_of_birth,
          ssn,
          desired_position,
          employment_type,
          availability,
          years_experience,
          work_history,
          specialties,
          high_school,
          hs_grad_year,
          college,
          degree,
          major,
          college_grad_year,
          license,
          license_state,
          license_expiry,
          cpr,
          other_certs,
          hipaa_training,
          hipaa_details,
          conflict_interest,
          conflict_details,
          relationship_conflict,
          relationship_details,
          conviction_history,
          conviction_details,
          registry_history,
          background_consent,
          tb_test_status,
          tb_test_date,
          tb_history_details,
          infection_training,
          infection_details,
          physical_accommodation,
          physical_details,
          hep_b_vaccination,
          flu_vaccination,
          immunization_details,
          reference_1_name,
          reference_1_relationship,
          reference_1_company,
          reference_1_phone,
          reference_1_email,
          reference_2_name,
          reference_2_relationship,
          reference_2_company,
          reference_2_phone,
          reference_2_email,
          reference_3_name,
          reference_3_relationship,
          reference_3_company,
          reference_3_phone,
          reference_3_email,
          emergency_name,
          emergency_relationship,
          emergency_phone,
          emergency_email,
          emergency_address,
          terms_agreed,
          employment_at_will,
          drug_testing_consent,
          submitted_at
        `)
        .in('job_application_id', applicationIds)

      if (!formsError && forms) {
        forms.forEach(form => {
          if (!formsData[form.job_application_id]) {
            formsData[form.job_application_id] = []
          }
          formsData[form.job_application_id].push(form)
        })
      }
    }

    // Fetch application form documents separately
    let documentsData: any = {}
    if (applicationIds.length > 0) {
      const { data: documents, error: documentsError } = await supabase
        .from('application_form_documents')
        .select(`
          id,
          application_form_id,
          job_application_id,
          applicant_id,
          document_type,
          file_name,
          file_size,
          file_url,
          uploaded_date,
          status,
          verified_date,
          notes
        `)
        .in('job_application_id', applicationIds)
        .order('uploaded_date', { ascending: false })

      if (!documentsError && documents) {
        documents.forEach(doc => {
          if (!documentsData[doc.job_application_id]) {
            documentsData[doc.job_application_id] = []
          }
          documentsData[doc.job_application_id].push(doc)
        })
      }
    }

    // Transform the data to match the expected format
    const transformedApplications = applications.map(app => {
      const form = formsData[app.id]?.[0] // Get the first (and should be only) form
      const applicant = applicantsData[app.applicant_id]
      const documents = documentsData[app.id] || []
      
      // Build documents status object from actual uploaded documents
      const documentsStatus: any = {
        resume: 'pending',
        license: 'pending',
        certifications: 'pending',
        background: form?.background_consent ? 'completed' : 'pending',
        tb_test: form?.tb_test_status ? 'completed' : 'pending',
        immunization: form?.hep_b_vaccination || form?.flu_vaccination ? 'completed' : 'pending',
        cpr: 'pending',
        drivers_license: 'pending',
        degree_diploma: 'pending',
        social_security_card: 'pending',
        car_insurance: 'pending'
      }
      
      // Update document statuses based on uploaded files
      documents.forEach((doc: any) => {
        if (doc.document_type === 'resume') {
          documentsStatus.resume = doc.status === 'verified' ? 'verified' : 'uploaded'
        } else if (doc.document_type === 'license') {
          documentsStatus.license = doc.status === 'verified' ? 'verified' : 'uploaded'
        } else if (doc.document_type === 'certification') {
          // Check if it's CPR or other certification based on file name
          if (doc.file_name?.toLowerCase().includes('cpr')) {
            documentsStatus.cpr = doc.status === 'verified' ? 'verified' : 'uploaded'
          } else {
            documentsStatus.certifications = doc.status === 'verified' ? 'verified' : 'uploaded'
          }
        } else if (doc.document_type === 'other') {
          if (doc.file_name?.toLowerCase().includes('driver') || doc.file_name?.toLowerCase().includes('license')) {
            documentsStatus.drivers_license = doc.status === 'verified' ? 'verified' : 'uploaded'
          } else if (doc.file_name?.toLowerCase().includes('social') || doc.file_name?.toLowerCase().includes('ssn')) {
            documentsStatus.social_security_card = doc.status === 'verified' ? 'verified' : 'uploaded'
          } else if (doc.file_name?.toLowerCase().includes('insurance') || doc.file_name?.toLowerCase().includes('car')) {
            documentsStatus.car_insurance = doc.status === 'verified' ? 'verified' : 'uploaded'
          } else if (doc.file_name?.toLowerCase().includes('degree') || doc.file_name?.toLowerCase().includes('diploma')) {
            documentsStatus.degree_diploma = doc.status === 'verified' ? 'verified' : 'uploaded'
          }
        }
      })
      
      return {
        id: app.id,
        name: form ? `${form.first_name} ${form.last_name}` : (applicant ? `${(applicant as any).first_name} ${(applicant as any).last_name}` : 'Unknown'),
        email: form?.email || (applicant ? (applicant as any).email : ''),
        phone: form?.phone || (applicant ? (applicant as any).phone : ''),
        position: app.job_title,
        status: app.status,
        appliedDate: new Date(app.applied_date).toLocaleDateString(),
        experience: form?.years_experience || 'Not specified',
        education: form?.degree || 'Not specified',
        documents: documentsStatus,
        uploadedDocuments: documents, // Include full document list
        timeline: [
          {
            action: 'Application submitted',
            date: new Date(app.applied_date).toLocaleDateString(),
            user: 'System'
          }
        ],
        notes: app.notes || '',
        // Include all form data for detailed view
        formData: form,
        // Include basic application data
        applicationData: {
          id: app.id,
          job_title: app.job_title,
          status: app.status,
          applied_date: app.applied_date,
          interview_date: app.interview_date,
          interview_time: app.interview_time,
          interview_location: app.interview_location,
          interviewer: app.interviewer,
          interview_notes: app.interview_notes,
          offer_deadline: app.offer_deadline,
          offer_details: app.offer_details,
          offer_salary_min: app.offer_salary_min,
          offer_salary_max: app.offer_salary_max,
          offer_salary_type: app.offer_salary_type
        }
      }
    })

    return NextResponse.json({
      success: true,
      applications: transformedApplications
    })

  } catch (error: any) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Extract form data
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const desiredPosition = formData.get('desiredPosition') as string
    const providedApplicantId = formData.get('applicant_id') as string | null

    if (!firstName || !lastName || !email || !phone || !desiredPosition) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: firstName, lastName, email, phone, desiredPosition' },
        { status: 400 }
      )
    }

    // Use provided applicant_id if available (from logged-in user), otherwise find or create
    let applicantId: string | null = null
    let useProvidedId = false
    
    if (providedApplicantId) {
      // Verify the applicant exists
      const { data: verifiedApplicant, error: verifyError } = await supabase
        .from('applicants')
        .select('id, email')
        .eq('id', providedApplicantId)
        .single()

      if (verifyError || !verifiedApplicant) {
        console.warn('Provided applicant ID is invalid, falling back to email lookup:', verifyError?.message || 'Not found')
        // Don't return error - fall through to email lookup/create logic
        useProvidedId = false
      } else {
        // Verify email matches (security check) - but allow if emails match
        if (verifiedApplicant.email !== email) {
          console.warn(`Email mismatch: provided ${email}, applicant record has ${verifiedApplicant.email}. Falling back to email lookup.`)
          useProvidedId = false
        } else {
          applicantId = providedApplicantId
          useProvidedId = true
          console.log('Using provided applicant_id from logged-in user:', applicantId)
        }
      }
    }
    
    if (!useProvidedId) {
      // Check if applicant already exists by email
      const { data: existingApplicant, error: applicantCheckError } = await supabase
        .from('applicants')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (applicantCheckError && applicantCheckError.code !== 'PGRST116') {
        console.error('Error checking for existing applicant:', applicantCheckError)
        return NextResponse.json(
          { success: false, error: 'Failed to check applicant: ' + applicantCheckError.message },
          { status: 500 }
        )
      }

      if (existingApplicant) {
        applicantId = existingApplicant.id
        console.log('Found existing applicant by email:', applicantId)
      } else {
        // Create new applicant
        const { data: newApplicant, error: applicantError } = await supabase
          .from('applicants')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            address: formData.get('address') as string || null,
            city: formData.get('city') as string || null,
            state: formData.get('state') as string || null,
            zip_code: formData.get('zipCode') as string || null,
          })
          .select('id')
          .single()

        if (applicantError) {
          console.error('Error creating applicant:', applicantError)
          return NextResponse.json(
            { success: false, error: 'Failed to create applicant: ' + applicantError.message },
            { status: 500 }
          )
        }

        if (!newApplicant) {
          return NextResponse.json(
            { success: false, error: 'Failed to create applicant: No ID returned' },
            { status: 500 }
          )
        }

        applicantId = newApplicant.id
        console.log('Created new applicant:', applicantId)
      }
    }

    // Ensure applicantId is set
    if (!applicantId) {
      return NextResponse.json(
        { success: false, error: 'Failed to get or create applicant ID' },
        { status: 500 }
      )
    }

    // Get job_posting_id from formData if provided (from jobId query parameter)
    const jobPostingId = formData.get('jobId') as string || formData.get('job_posting_id') as string || null
    
    // Get employer_id from job_posting if job_posting_id is provided
    let employerId: string | null = null
    if (jobPostingId) {
      const { data: jobPosting, error: jobPostingError } = await supabase
        .from('job_postings')
        .select('employer_id')
        .eq('id', jobPostingId)
        .maybeSingle()
      
      if (!jobPostingError && jobPosting?.employer_id) {
        employerId = jobPosting.employer_id
        console.log('Found employer_id from job posting:', employerId)
      } else {
        console.warn('Could not find employer_id for job_posting_id:', jobPostingId, jobPostingError)
      }
    }

    // Create the job application record
    const { data: application, error: applicationError } = await supabase
      .from('job_applications')
      .insert({
        applicant_id: applicantId,
        employer_id: employerId,
        job_title: desiredPosition,
        job_type: formData.get('employmentType') as string || 'full-time',
        status: 'pending',
        job_posting_id: jobPostingId || null,
        cover_letter: formData.get('workHistory') as string || null,
        applied_date: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (applicationError) {
      console.error('Error creating job application:', applicationError)
      return NextResponse.json(
        { success: false, error: 'Failed to create job application: ' + applicationError.message },
        { status: 500 }
      )
    }

    if (!application || !application.id) {
      return NextResponse.json(
        { success: false, error: 'Failed to create job application: No ID returned' },
        { status: 500 }
      )
    }

    // Note: Detailed application form data will be saved via /api/applications/form endpoint
    // This prevents duplicate inserts since the form endpoint uses upsert
    console.log('Basic application created successfully:', {
      applicationId: application.id,
      applicantId: applicantId
    })

    // Send notification to HR team
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/notifications/new-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: `${firstName} ${lastName}`,
          position: desiredPosition,
          email: email,
          applicationId: application.id,
          submittedAt: new Date().toISOString()
        })
      })
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Don't fail the application submission if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application.id,
      applicantId: applicantId, // Include applicant ID for document uploads
      confirmationNumber: `CONF-${Date.now()}`
    }, { status: 200 })

  } catch (error: any) {
    console.error('Application submission error:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to submit application. Please try again.',
      message: 'Failed to submit application. Please try again.'
    }, { status: 500 })
  }
}