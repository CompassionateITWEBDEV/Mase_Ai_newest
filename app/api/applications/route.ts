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
        background: form?.background_consent === true ? 'completed' : 'pending',
        tb_test: form?.tb_test_status ? 'completed' : 'pending',
        immunization: form?.hep_b_vaccination || form?.flu_vaccination ? 'completed' : 'pending',
        cpr: 'pending',
        drivers_license: 'pending',
        degree_diploma: 'pending',
        social_security_card: 'pending',
        car_insurance: 'pending'
      }
      
      // Check if application is in background check stage (background_check, offer_received, or offer_accepted)
      const isBackgroundStage = app.status === 'background_check' || app.status === 'offer_received' || app.status === 'offer_accepted'
      
      // Update document statuses based on uploaded files
      // Process documents and match them to the correct status field
      documents.forEach((doc: any) => {
        // Determine document status: verified > uploaded > pending
        // If document is verified, show as verified; if uploaded but not verified, show as uploaded; otherwise pending
        let docStatus: string
        if (doc.status === 'verified') {
          docStatus = 'verified'
        } else if (doc.status === 'rejected') {
          docStatus = 'rejected'
        } else if (doc.file_url) {
          docStatus = 'uploaded'
        } else {
          docStatus = 'pending'
        }
        const fileName = (doc.file_name || '').toLowerCase()
        const notes = (doc.notes || '').toLowerCase()
        // Extract document name from notes (format: "Uploaded: {document_name}")
        let docNameFromNotes = notes.includes('uploaded:') 
          ? notes.split('uploaded:')[1]?.trim() || '' 
          : notes
        // Normalize the document name - remove apostrophes and normalize spaces
        docNameFromNotes = docNameFromNotes.replace(/'/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
        const combinedText = `${fileName} ${notes} ${docNameFromNotes}`.toLowerCase()
        
        // Check document_type first, then match by name patterns
        if (doc.document_type === 'resume') {
          documentsStatus.resume = docStatus
        } else if (doc.document_type === 'license') {
          // Check if it's a driver's license or professional license based on notes
          // Normalized docNameFromNotes already has apostrophes removed
          if (combinedText.includes('driver') && combinedText.includes('license')) {
            documentsStatus.drivers_license = docStatus
          } else if (docNameFromNotes.includes('driver') && docNameFromNotes.includes('license')) {
            documentsStatus.drivers_license = docStatus
          } else {
            // Professional license
            documentsStatus.license = docStatus
          }
        } else if (doc.document_type === 'background_check') {
          // Background check documents - if verified or in background stage, show as complete
          if (doc.status === 'verified' || (isBackgroundStage && doc.file_url)) {
            documentsStatus.background = 'completed'
          } else if (doc.file_url) {
            documentsStatus.background = 'uploaded'
          }
        } else if (doc.document_type === 'certification') {
          // Check notes and file name to determine specific certification type
          // Notes format: "Uploaded: resume cv", "Uploaded: degree diploma", etc.
          if (combinedText.includes('cpr') || docNameFromNotes.includes('cpr certification') || docNameFromNotes.includes('cpr_certification') || docNameFromNotes.includes('cpr')) {
            documentsStatus.cpr = docStatus
            // Also update certifications status - use the higher status (verified > uploaded > pending)
            if (documentsStatus.certifications === 'pending' || 
                (docStatus === 'verified' && documentsStatus.certifications !== 'verified') ||
                (docStatus === 'uploaded' && documentsStatus.certifications === 'pending')) {
              documentsStatus.certifications = docStatus
            }
          } else if ((combinedText.includes('degree') && combinedText.includes('diploma')) || 
                     docNameFromNotes.includes('degree diploma') || 
                     docNameFromNotes.includes('degree_diploma') ||
                     docNameFromNotes.includes('degree') ||
                     docNameFromNotes.includes('diploma')) {
            documentsStatus.degree_diploma = docStatus
          } else if (combinedText.includes('tb') || combinedText.includes('tuberculosis') || 
                     docNameFromNotes.includes('tb test') || 
                     docNameFromNotes.includes('tb_test_results') ||
                     docNameFromNotes.includes('tb test results') ||
                     docNameFromNotes.includes('tb')) {
            documentsStatus.tb_test = docStatus
          } else {
            // Generic certification - set certifications status
            documentsStatus.certifications = docStatus
            // Also check if it matches any other specific type
            if (combinedText.includes('degree') || combinedText.includes('diploma')) {
              documentsStatus.degree_diploma = docStatus
            }
          }
        } else if (doc.document_type === 'other') {
          // Check notes and file name to determine specific document type
          if ((combinedText.includes('driver') && combinedText.includes('license')) || 
              docNameFromNotes.includes('drivers license') || 
              docNameFromNotes.includes('drivers_license') ||
              docNameFromNotes.includes('driver\'s license') ||
              docNameFromNotes.includes('driver license')) {
            documentsStatus.drivers_license = docStatus
          } else if ((combinedText.includes('social') && combinedText.includes('security')) || 
                     combinedText.includes('ssn') || 
                     (docNameFromNotes.includes('social') && docNameFromNotes.includes('security'))) {
            documentsStatus.social_security_card = docStatus
          } else if ((combinedText.includes('insurance') && combinedText.includes('car')) || 
                     combinedText.includes('auto insurance') || 
                     (docNameFromNotes.includes('car') && docNameFromNotes.includes('insurance')) ||
                     (combinedText.includes('insurance') && !combinedText.includes('health') && !combinedText.includes('life') && !combinedText.includes('medical'))) {
            documentsStatus.car_insurance = docStatus
          } else if (combinedText.includes('degree') || combinedText.includes('diploma')) {
            documentsStatus.degree_diploma = docStatus
          }
        }
      })
      
      // Helper function to update status if new status has higher priority
      function updateStatusIfHigher(key: string, newStatus: string, statusMap: { [key: string]: string }, priorityMap: { [key: string]: number }) {
        const currentStatus = statusMap[key] || 'pending'
        const currentPriority = priorityMap[currentStatus] || 0
        const newPriority = priorityMap[newStatus] || 0
        if (newPriority > currentPriority) {
          statusMap[key] = newStatus
        }
      }
      
      // Post-process: Ensure status prioritization (verified > uploaded > pending)
      // If any document of a type is verified, the status should be verified
      const documentStatusPriority: { [key: string]: number } = {
        'verified': 3,
        'uploaded': 2,
        'completed': 3,
        'pending': 1,
        'rejected': 0
      }
      
      // Check all documents again to find the highest status for each category
      const statusByCategory: { [key: string]: string } = {}
      documents.forEach((doc: any) => {
        const fileName = (doc.file_name || '').toLowerCase()
        const notes = (doc.notes || '').toLowerCase()
        let docNameFromNotes = notes.includes('uploaded:') 
          ? notes.split('uploaded:')[1]?.trim() || '' 
          : notes
        docNameFromNotes = docNameFromNotes.replace(/'/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
        const combinedText = `${fileName} ${notes} ${docNameFromNotes}`.toLowerCase()
        
        let docStatus: string
        if (doc.status === 'verified') {
          docStatus = 'verified'
        } else if (doc.status === 'rejected') {
          docStatus = 'rejected'
        } else if (doc.file_url) {
          docStatus = 'uploaded'
        } else {
          docStatus = 'pending'
        }
        
        // Map document to status categories
        // Note: isBackgroundStage is checked here for background_check documents
        if (doc.document_type === 'resume') {
          updateStatusIfHigher('resume', docStatus, statusByCategory, documentStatusPriority)
        } else if (doc.document_type === 'license') {
          if (combinedText.includes('driver') && combinedText.includes('license') || 
              docNameFromNotes.includes('driver') && docNameFromNotes.includes('license')) {
            updateStatusIfHigher('drivers_license', docStatus, statusByCategory, documentStatusPriority)
          } else {
            updateStatusIfHigher('license', docStatus, statusByCategory, documentStatusPriority)
          }
        } else if (doc.document_type === 'background_check') {
          // Background check documents - update background status
          // If verified or in background stage, show as completed
          if (doc.status === 'verified' || (isBackgroundStage && doc.file_url)) {
            updateStatusIfHigher('background', 'completed', statusByCategory, documentStatusPriority)
          } else {
            updateStatusIfHigher('background', docStatus, statusByCategory, documentStatusPriority)
          }
        } else if (doc.document_type === 'certification') {
          if (combinedText.includes('cpr') || docNameFromNotes.includes('cpr')) {
            updateStatusIfHigher('cpr', docStatus, statusByCategory, documentStatusPriority)
            updateStatusIfHigher('certifications', docStatus, statusByCategory, documentStatusPriority)
          } else if (combinedText.includes('degree') || combinedText.includes('diploma') || 
                     docNameFromNotes.includes('degree') || docNameFromNotes.includes('diploma')) {
            updateStatusIfHigher('degree_diploma', docStatus, statusByCategory, documentStatusPriority)
            updateStatusIfHigher('certifications', docStatus, statusByCategory, documentStatusPriority)
          } else if (combinedText.includes('tb') || docNameFromNotes.includes('tb')) {
            updateStatusIfHigher('tb_test', docStatus, statusByCategory, documentStatusPriority)
          } else {
            updateStatusIfHigher('certifications', docStatus, statusByCategory, documentStatusPriority)
          }
        } else if (doc.document_type === 'other') {
          if (combinedText.includes('driver') && combinedText.includes('license') || 
              docNameFromNotes.includes('driver') && docNameFromNotes.includes('license')) {
            updateStatusIfHigher('drivers_license', docStatus, statusByCategory, documentStatusPriority)
          } else if (combinedText.includes('social') && combinedText.includes('security') || 
                     combinedText.includes('ssn') || 
                     (docNameFromNotes.includes('social') && docNameFromNotes.includes('security'))) {
            updateStatusIfHigher('social_security_card', docStatus, statusByCategory, documentStatusPriority)
          } else if (combinedText.includes('insurance') && combinedText.includes('car') || 
                     combinedText.includes('auto insurance') || 
                     (docNameFromNotes.includes('car') && docNameFromNotes.includes('insurance'))) {
            updateStatusIfHigher('car_insurance', docStatus, statusByCategory, documentStatusPriority)
          }
        }
      })
      
      // Update documentsStatus with highest priority statuses
      Object.keys(statusByCategory).forEach(key => {
        if (documentsStatus.hasOwnProperty(key)) {
          documentsStatus[key] = statusByCategory[key]
        }
      })
      
      // If in background stage and background_consent is true, ensure background shows as completed
      if (isBackgroundStage && form?.background_consent === true) {
        // Check if there are any verified background_check documents
        const hasVerifiedBackgroundDoc = documents.some((doc: any) => 
          doc.document_type === 'background_check' && doc.status === 'verified'
        )
        if (hasVerifiedBackgroundDoc || documentsStatus.background === 'uploaded') {
          documentsStatus.background = 'completed'
        }
      }
      
      // Debug logging with detailed matching information
      console.log('Document matching results:', {
        totalDocuments: documents.length,
        documentsStatus,
        isBackgroundStage,
        documents: documents.map((d: any) => {
          const fileName = (d.file_name || '').toLowerCase()
          const notes = (d.notes || '').toLowerCase()
          const docNameFromNotes = notes.includes('uploaded:') 
            ? notes.split('uploaded:')[1]?.trim() || '' 
            : notes
          const combinedText = `${fileName} ${notes} ${docNameFromNotes}`.toLowerCase()
          
          return {
            id: d.id,
            type: d.document_type,
            name: d.file_name,
            notes: d.notes,
            status: d.status,
            docNameFromNotes: docNameFromNotes,
            combinedText: combinedText.substring(0, 100), // First 100 chars for debugging
            matchedStatus: (() => {
              if (d.document_type === 'resume') return 'resume'
              if (d.document_type === 'license') {
                if ((combinedText.includes('driver') && combinedText.includes('license')) || 
                    docNameFromNotes.includes('drivers license') || 
                    docNameFromNotes.includes('drivers_license') ||
                    docNameFromNotes.includes('driver\'s license') ||
                    docNameFromNotes.includes('driver license')) {
                  return 'drivers_license'
                }
                return 'license'
              }
              if (d.document_type === 'certification') {
                if (combinedText.includes('cpr') || docNameFromNotes.includes('cpr')) return 'cpr'
                if (combinedText.includes('degree') || combinedText.includes('diploma')) return 'degree_diploma'
                if (combinedText.includes('tb')) return 'tb_test'
                return 'certifications'
              }
              if (d.document_type === 'other') {
                if ((combinedText.includes('driver') && combinedText.includes('license'))) return 'drivers_license'
                if (combinedText.includes('social') && combinedText.includes('security')) return 'social_security_card'
                if (combinedText.includes('insurance') && combinedText.includes('car')) return 'car_insurance'
                return 'other'
              }
              return 'unknown'
            })()
          }
        })
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