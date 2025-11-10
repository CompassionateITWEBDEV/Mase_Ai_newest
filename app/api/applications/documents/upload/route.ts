import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const applicantId = formData.get('applicant_id') as string
    const jobApplicationId = formData.get('job_application_id') as string
    const applicationFormId = formData.get('application_form_id') as string
    const documentType = formData.get('document_type') as string
    const documentName = formData.get('document_name') as string
    const fileName = formData.get('file_name') as string || file?.name
    const fileSize = parseInt(formData.get('file_size') as string) || file?.size

    if (!file || !applicantId || !jobApplicationId || !documentType) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: file, applicant_id, job_application_id, and document_type are required' 
        },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { 
          success: false,
          error: 'File size must be less than 10MB' 
        },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 
      'image/jpg',
      'image/png'
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.' 
        },
        { status: 400 }
      )
    }

    // Validate document type
    const validDocumentTypes = ['resume', 'license', 'certification', 'background_check', 'reference', 'other']
    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid document type. Must be one of: ${validDocumentTypes.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Warn if document is being saved as 'other' - this should only be for specific cases
    if (documentType === 'other') {
      const allowedOtherTypes = ['social_security_card', 'car_insurance', 'social security card', 'car insurance']
      const isAllowedOther = documentName && allowedOtherTypes.some(type => 
        documentName.toLowerCase().includes(type.toLowerCase())
      )
      if (!isAllowedOther) {
        console.warn(`⚠️ Document "${documentName || fileName}" is being saved as 'other' type. This should only be used for Social Security Card or Car Insurance.`)
        console.warn(`   Document name: "${documentName}", File name: "${fileName}"`)
      }
    }

    console.log('Uploading application form document:', {
      fileName: fileName || file.name,
      documentType,
      documentName,
      fileSize,
      applicantId,
      jobApplicationId,
      applicationFormId,
      warning: documentType === 'other' ? 'Document saved as "other" - verify this is correct' : undefined
    })

    // Use service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Convert file to buffer for storage
    const fileBuffer = await file.arrayBuffer()
    
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const storageFileName = `${applicantId}/${jobApplicationId}/${documentType}_${Date.now()}.${fileExt}`
    
    let fileUrl: string = '' // Initialize with empty string
    let storageSuccess = false
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storageFileName, fileBuffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.warn('Storage upload failed, storing file as base64:', uploadError)
        storageSuccess = false
      } else {
        // Verify the upload was successful by trying to get the public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(storageFileName)
        
        if (!urlData?.publicUrl) {
          console.warn('Could not get public URL, storing file as base64')
          storageSuccess = false
        } else {
          fileUrl = urlData.publicUrl
          storageSuccess = true
          console.log('File uploaded to storage successfully:', fileUrl)
        }
      }
    } catch (storageError: any) {
      console.warn('Storage error, storing file as base64:', storageError?.message || storageError)
      storageSuccess = false
    }
    
    // If storage failed or URL couldn't be retrieved, store as base64
    if (!storageSuccess) {
      console.log('Storing file as base64 in database (storage failed or unavailable)')
      const base64 = Buffer.from(fileBuffer).toString('base64')
      fileUrl = `data:${file.type};base64,${base64}`
      console.log('Base64 data length:', base64.length, 'characters')
    }
    
    // Ensure fileUrl is set (should always be set by now, but TypeScript needs this)
    if (!fileUrl) {
      console.error('ERROR: fileUrl was not set! Falling back to base64')
      const base64 = Buffer.from(fileBuffer).toString('base64')
      fileUrl = `data:${file.type};base64,${base64}`
    }

    // Insert document record into application_form_documents table
    // Set status to 'pending' - valid values are: 'pending', 'verified', 'rejected' (per database constraint)
    // Ensure status is explicitly set to a valid value to avoid constraint violations
    const documentStatus: 'pending' | 'verified' | 'rejected' = 'pending'
    
    // Validate that application_form_id is provided (it's required in the database)
    if (!applicationFormId || applicationFormId.trim() === '') {
      console.warn('⚠️ application_form_id is missing or empty, but it may be required')
      // Continue anyway - the database will reject if it's truly required
    }
    
    // Prepare insert data - ensure all required fields are present
    const insertData: any = {
      job_application_id: jobApplicationId,
      applicant_id: applicantId,
      document_type: documentType,
      file_name: fileName || file.name,
      file_size: fileSize,
      file_url: fileUrl,
      status: documentStatus, // Explicitly set to 'pending' - must be one of: 'pending', 'verified', 'rejected'
      notes: documentName ? `Uploaded: ${documentName}` : `Uploaded via application form`
    }
    
    // Include application_form_id if provided (it's required in the table definition)
    if (applicationFormId && applicationFormId.trim() !== '') {
      insertData.application_form_id = applicationFormId.trim()
    } else {
      // If it's truly required, this will cause an error, but we'll handle it
      console.warn('⚠️ application_form_id not provided - this may cause a database error if the column is NOT NULL')
    }
    
    console.log('Inserting document with data:', {
      ...insertData,
      status: documentStatus,
      hasApplicationFormId: !!applicationFormId
    })
    
    const { data: document, error: dbError } = await supabase
      .from('application_form_documents')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      console.error('Error code:', dbError.code)
      console.error('Error details:', dbError.details)
      console.error('Error hint:', dbError.hint)
      console.error('Attempted insert data:', insertData)
      
      // Log detailed error information for debugging
      if (dbError.code === '23514' && dbError.message.includes('status_check')) {
        console.error('❌ STATUS CONSTRAINT VIOLATION DETECTED')
        console.error('The database constraint is blocking the insert.')
        console.error('The code is trying to insert status:', documentStatus)
        console.error('Please run the SQL script: FIX_APPLICATION_FORM_DOCUMENTS_STATUS_CONSTRAINT.sql')
      }
      
      // Provide more helpful error message for constraint violations
      let errorMessage = dbError.message
      if (dbError.code === '23514' && dbError.message.includes('status_check')) {
        errorMessage = `Database constraint error: The status field only allows 'pending', 'verified', or 'rejected'. Please run the SQL script FIX_APPLICATION_FORM_DOCUMENTS_STATUS_CONSTRAINT.sql in your Supabase SQL editor to fix this.`
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save document record: ' + errorMessage,
          errorCode: dbError.code,
          errorDetails: dbError.details
        },
        { status: 500 }
      )
    }

    console.log('✅ Application form document uploaded successfully:', {
      id: document.id,
      file_name: document.file_name,
      file_size: document.file_size,
      file_url_type: document.file_url ? (document.file_url.startsWith('data:') ? 'base64' : 'url') : 'null',
      file_url_length: document.file_url?.length || 0,
      status: document.status
    })

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        document_type: document.document_type,
        file_name: document.file_name,
        file_size: document.file_size,
        status: document.status,
        uploaded_date: document.uploaded_date,
        file_url_saved: !!document.file_url,
        file_url_type: document.file_url ? (document.file_url.startsWith('data:') ? 'base64' : 'url') : 'none'
      }
    })

  } catch (error: any) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

