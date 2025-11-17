import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Singleton Supabase client for service role operations
let supabaseClient: ReturnType<typeof createClient> | null = null

function getServiceClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  }
  return supabaseClient
}

// =====================================================
// POST: Upload documents for a referral
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const formData = await request.formData()
    
    // Extract metadata
    const referralId = formData.get('referralId') as string
    const documentType = formData.get('documentType') as string || 'other'
    const uploadedByName = formData.get('uploadedByName') as string || 'Facility User'
    const notes = formData.get('notes') as string || ''
    
    if (!referralId) {
      return NextResponse.json(
        { error: 'Referral ID is required' },
        { status: 400 }
      )
    }

    // Get all uploaded files
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      )
    }

    const uploadedDocuments = []
    const errors = []

    // Process each file
    for (const file of files) {
      try {
        // Validate file
        if (!file.name) {
          errors.push({ file: 'unknown', error: 'Invalid file' })
          continue
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          errors.push({ 
            file: file.name, 
            error: `File too large (max 10MB). Size: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
          })
          continue
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'text/plain'
        ]
        
        if (!allowedTypes.includes(file.type)) {
          errors.push({ 
            file: file.name, 
            error: `Invalid file type: ${file.type}. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF, TXT` 
          })
          continue
        }

        // Generate unique file path
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const fileExt = file.name.split('.').pop()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `referrals/${referralId}/${timestamp}_${randomStr}_${sanitizedName}`

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('referral-documents')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          console.error('Supabase upload error:', uploadError)
          errors.push({ file: file.name, error: uploadError.message })
          continue
        }

        // Get public URL
        const { data: urlData } = supabase
          .storage
          .from('referral-documents')
          .getPublicUrl(filePath)

        // Save document metadata to database
        const { data: documentRecord, error: dbError } = await supabase
          .from('referral_documents')
          .insert({
            referral_id: referralId,
            document_name: file.name,
            document_type: documentType,
            file_url: urlData.publicUrl,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by_name: uploadedByName,
            notes: notes
          })
          .select()
          .single()

        if (dbError) {
          console.error('Database insert error:', dbError)
          // Try to clean up uploaded file
          await supabase.storage.from('referral-documents').remove([filePath])
          errors.push({ file: file.name, error: dbError.message })
          continue
        }

        uploadedDocuments.push({
          id: documentRecord.id,
          name: file.name,
          type: documentType,
          url: urlData.publicUrl,
          size: file.size,
          uploadedAt: documentRecord.uploaded_at
        })

      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError)
        errors.push({ 
          file: file.name, 
          error: fileError instanceof Error ? fileError.message : 'Unknown error' 
        })
      }
    }

    // Return results
    return NextResponse.json({
      success: uploadedDocuments.length > 0,
      uploaded: uploadedDocuments,
      errors: errors,
      message: uploadedDocuments.length > 0 
        ? `Successfully uploaded ${uploadedDocuments.length} document(s)` 
        : 'No documents uploaded',
      total: files.length,
      successful: uploadedDocuments.length,
      failed: errors.length
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload documents: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// GET: Fetch documents for a referral
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const referralId = searchParams.get('referralId')

    if (!referralId) {
      return NextResponse.json(
        { error: 'Referral ID is required' },
        { status: 400 }
      )
    }

    // Fetch documents from database
    const { data: documents, error } = await supabase
      .from('referral_documents')
      .select('*')
      .eq('referral_id', referralId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      documents: documents || [],
      count: documents?.length || 0
    })

  } catch (error) {
    console.error('Error in documents GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE: Delete a document
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Get document info first
    const { data: document, error: fetchError } = await supabase
      .from('referral_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete from storage
    const { error: storageError } = await supabase
      .storage
      .from('referral-documents')
      .remove([document.file_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue anyway to delete database record
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('referral_documents')
      .delete()
      .eq('id', documentId)

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to delete document: ' + dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

