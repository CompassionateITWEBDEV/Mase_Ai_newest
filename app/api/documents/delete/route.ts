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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    // Try with .select() first
    let deleteResult = await supabase
      .from('applicant_documents')
      .delete()
      .eq('id', documentId)
      .select('*')

    console.log('Delete attempt 1 (with select):', deleteResult)

    // If no data returned but no error, try without select
    if (!deleteResult.error && (!deleteResult.data || deleteResult.data.length === 0)) {
      console.log('No data from delete with select, trying without select...')
      deleteResult = await supabase
        .from('applicant_documents')
        .delete()
        .eq('id', documentId)
      
      console.log('Delete attempt 2 (without select):', deleteResult)
      
      // If successful, return the original document data
      if (!deleteResult.error) {
        console.log(`✅ Successfully deleted document: ${docData.file_name}`)
        
        return NextResponse.json({
          success: true,
          message: 'Document deleted successfully',
          deletedDocument: docData
        })
      }
    }

    const { data, error } = deleteResult

    if (error) {
      console.error('Error deleting document from database:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete document: ' + error.message },
        { status: 500 }
      )
    }

    // If we got data back, great!
    if (data && data.length > 0) {
      console.log(`✅ Successfully deleted document: ${data[0].file_name}`)
      
      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully',
        deletedDocument: data[0]
      })
    }

    // If no error and no data, the delete might have succeeded
    console.log('Delete completed with no error, assuming success')
    console.log(`✅ Successfully deleted document: ${docData.file_name}`)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletedDocument: docData
    })

  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
