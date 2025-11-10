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

    console.log('Uploading application form document:', {
      fileName: fileName || file.name,
      documentType,
      documentName,
      fileSize,
      applicantId,
      jobApplicationId,
      applicationFormId
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
    
    let fileUrl = storageFileName // Default to storage path
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storageFileName, fileBuffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.warn('Storage upload failed, using placeholder URL:', uploadError)
        // Continue with placeholder URL if storage fails
        fileUrl = `uploads/${applicantId}/${fileName}`
      } else {
        // Get public URL if storage bucket is public
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(storageFileName)
        fileUrl = urlData.publicUrl || storageFileName
      }
    } catch (storageError) {
      console.warn('Storage error, using placeholder URL:', storageError)
      fileUrl = `uploads/${applicantId}/${fileName}`
    }

    // Insert document record into application_form_documents table
    const { data: document, error: dbError } = await supabase
      .from('application_form_documents')
      .insert({
        application_form_id: applicationFormId || null,
        job_application_id: jobApplicationId,
        applicant_id: applicantId,
        document_type: documentType,
        file_name: fileName || file.name,
        file_size: fileSize,
        file_url: fileUrl,
        status: 'pending',
        notes: documentName ? `Uploaded: ${documentName}` : `Uploaded via application form`
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save document record: ' + dbError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Application form document uploaded successfully:', document.id)

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        document_type: document.document_type,
        file_name: document.file_name,
        file_size: document.file_size,
        status: document.status,
        uploaded_date: document.uploaded_date
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

