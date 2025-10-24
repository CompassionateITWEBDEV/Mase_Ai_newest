import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId } = body

    console.log('Delete API called with body:', body)
    console.log('Document ID:', documentId)

    if (!documentId) {
      console.error('Missing documentId in request')
      return NextResponse.json(
        { success: false, error: 'Missing documentId' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(documentId)) {
      console.error('Invalid UUID format:', documentId)
      return NextResponse.json(
        { success: false, error: 'Invalid document ID format' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    // Use service role key for delete operations to bypass RLS
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`Attempting to delete document with ID: ${documentId}`)

    // First, get the document to find the file URL
    const { data: docData, error: fetchError } = await supabase
      .from('applicant_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    console.log('Fetch result:', { docData, fetchError })

    if (fetchError) {
      console.error('Error fetching document:', fetchError)
      return NextResponse.json(
        { success: false, error: `Document not found: ${fetchError.message}` },
        { status: 404 }
      )
    }

    if (!docData) {
      console.error('Document not found in database')
      return NextResponse.json(
        { success: false, error: 'Document does not exist' },
        { status: 404 }
      )
    }

    console.log('Document found:', docData.file_name)

    // Try to delete file from Supabase Storage if it's stored there
    if (docData.file_url && docData.file_url.includes('supabase')) {
      try {
        // Extract file path from URL
        const urlParts = docData.file_url.split('/documents/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0] // Remove query params
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([filePath])
          
          if (storageError) {
            console.log('Storage deletion error (non-critical):', storageError)
          } else {
            console.log('File deleted from storage:', filePath)
          }
        }
      } catch (storageError) {
        console.log('Storage deletion failed (non-critical):', storageError)
      }
    }

    // Delete the document from the database
    console.log('Attempting to delete document from database...')
    
    // Method 1: Try direct delete with service role key (should work with proper RLS policies)
    const { data: deleteData, error: deleteError, status: deleteStatus } = await supabase
      .from('applicant_documents')
      .delete()
      .eq('id', documentId)

    console.log('Delete attempt 1 (direct delete):', { 
      deleteData, 
      deleteError, 
      deleteStatus 
    })

    // Method 2: If direct delete fails, try using RPC function as fallback
    if (deleteError && deleteStatus !== 204) {
      console.log('Direct delete failed, trying RPC function...')
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_document', {
        doc_id: documentId
      })
      
      console.log('Delete attempt 2 (RPC):', { rpcResult, rpcError })
      
      // If RPC also fails, return error
      if (rpcError) {
        console.error('Both delete methods failed:', { deleteError, rpcError })
        return NextResponse.json({
          success: false,
          error: 'Failed to delete document. Please ensure delete policies are enabled.',
          details: deleteError?.message || rpcError?.message
        }, { status: 500 })
      }
    }

    // Verify if document was actually deleted by checking if it still exists
    const { data: checkData, error: checkError } = await supabase
      .from('applicant_documents')
      .select('id')
      .eq('id', documentId)
      .maybeSingle()

    console.log('Verification check after delete:', { 
      stillExists: !!checkData,
      checkData,
      checkError
    })

    // If document still exists, the delete actually failed
    if (checkData) {
      console.error('❌ Document still exists after delete! RLS policy may be blocking deletion.')
      return NextResponse.json({
        success: false,
        error: 'Unable to delete document. Please run the database migration script: scripts/035-add-document-delete-policy.sql',
        hint: 'The database needs DELETE policies to be enabled for applicant_documents table.'
      }, { status: 403 })
    }

    // Document successfully deleted
    console.log(`✅ Document successfully deleted and verified: ${docData.file_name}`)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletedDocument: {
        id: docData.id,
        file_name: docData.file_name,
        document_type: docData.document_type
      }
    })

  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
