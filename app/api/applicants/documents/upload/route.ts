import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const applicantId = formData.get('applicant_id') as string
    const documentType = formData.get('document_type') as string
    const fileName = formData.get('file_name') as string
    const fileSize = parseInt(formData.get('file_size') as string)

    if (!file || !applicantId || !documentType || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Uploading document:', {
      fileName,
      documentType,
      fileSize,
      applicantId
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
    
    // Upload file to Supabase Storage (if you have storage configured)
    // For now, we'll just store the metadata in the database
    const fileUrl = `uploads/${applicantId}/${fileName}` // Placeholder URL

    // Insert document record into applicant_documents table
    const { data: document, error } = await supabase
      .from('applicant_documents')
      .insert({
        applicant_id: applicantId,
        document_type: documentType,
        file_name: fileName,
        file_size: fileSize,
        file_url: fileUrl,
        status: 'pending',
        notes: `Uploaded via application form`
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save document record: ' + error.message },
        { status: 500 }
      )
    }

    console.log('Document record created:', document.id)

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName,
        documentType,
        fileSize,
        status: 'pending'
      }
    })

  } catch (error: any) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

