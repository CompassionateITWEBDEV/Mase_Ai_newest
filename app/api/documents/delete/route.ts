import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log(`Deleting document: ${documentId}`)

    // First, get the document to find the file URL
    const { data: docData, error: fetchError } = await supabase
      .from('applicant_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (fetchError || !docData) {
      console.error('Error fetching document:', fetchError)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

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
    const { data, error } = await supabase
      .from('applicant_documents')
      .delete()
      .eq('id', documentId)
      .select('*')

    if (error) {
      console.error('Error deleting document from database:', error)
      return NextResponse.json(
        { error: 'Failed to delete document: ' + error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Document not found in database' },
        { status: 404 }
      )
    }

    console.log(`Successfully deleted document: ${data[0].file_name}`)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletedDocument: data[0]
    })

  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
