import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const applicantId = formData.get('applicant_id') as string
    const documentType = formData.get('document_type') as string

    if (!file || !applicantId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${applicantId}/${documentType}_${Date.now()}.${fileExt}`
    
    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer()
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // If storage fails, still save metadata with file content as base64
      const base64 = Buffer.from(fileBuffer).toString('base64')
      const fileUrl = `data:${file.type};base64,${base64}`
      
      const { data, error } = await supabase
        .from('applicant_documents')
        .insert({
          applicant_id: applicantId,
          document_type: documentType,
          file_name: file.name,
          file_size: file.size,
          file_url: fileUrl,
          uploaded_date: new Date().toISOString(),
          status: 'verified',
          verified_date: new Date().toISOString(),
          notes: 'Document uploaded and verified automatically (stored as base64)'
        })
        .select()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to save document: ' + error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Document uploaded successfully (base64)',
        document: data[0]
      })
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // Store the metadata in the database with storage URL
    const { data, error } = await supabase
      .from('applicant_documents')
      .insert({
        applicant_id: applicantId,
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        file_url: publicUrlData.publicUrl,
        uploaded_date: new Date().toISOString(),
        status: 'verified', // Auto-verify immediately
        verified_date: new Date().toISOString(),
        notes: 'Document uploaded and verified automatically'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save document metadata: ' + error.message },
        { status: 500 }
      )
    }


    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document: data[0]
    })
    
  } catch (error: any) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}