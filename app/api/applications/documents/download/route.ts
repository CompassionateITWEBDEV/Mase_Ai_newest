import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')
    const jobApplicationId = searchParams.get('job_application_id')
    const view = searchParams.get('view') === 'true' // If view=true, open in browser instead of download

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing document_id parameter' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch document from application_form_documents table
    const { data: document, error } = await supabase
      .from('application_form_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error || !document) {
      console.error('Error fetching document:', error)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    console.log('Downloading document:', {
      id: document.id,
      file_name: document.file_name,
      file_url_type: document.file_url ? (document.file_url.substring(0, 50) + '...') : 'null',
      file_url_length: document.file_url?.length || 0
    })

    // If file_url is a base64 data URL, decode and return it
    if (document.file_url && document.file_url.startsWith('data:')) {
      try {
        console.log('Processing base64 data URL')
        // Extract base64 content from data URL
        const matches = document.file_url.match(/^data:([^;]+);base64,(.+)$/)
        if (matches && matches.length >= 3) {
          const mimeType = matches[1]
          const base64Data = matches[2]
          
          // Check if base64 data is not empty
          if (!base64Data || base64Data.trim().length === 0) {
            console.error('Base64 data is empty')
            return NextResponse.json(
              { error: 'File content is empty' },
              { status: 404 }
            )
          }
          
          const buffer = Buffer.from(base64Data, 'base64')
          
          console.log('Successfully decoded base64 file, size:', buffer.length, 'bytes')
          
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': mimeType || getMimeType(getFileExtension(document.file_name)),
              'Content-Disposition': view ? `inline; filename="${encodeURIComponent(document.file_name)}"` : `attachment; filename="${encodeURIComponent(document.file_name)}"`,
              'Cache-Control': 'no-cache',
              'Content-Length': buffer.length.toString(),
            },
          })
        } else {
          console.error('Invalid base64 data URL format')
          return NextResponse.json(
            { error: 'Invalid file format in database' },
            { status: 500 }
          )
        }
      } catch (base64Error: any) {
        console.error('Error decoding base64 file:', base64Error)
        return NextResponse.json(
          { error: `Failed to decode file: ${base64Error.message}` },
          { status: 500 }
        )
      }
    }

    // If file_url is a Supabase Storage URL, get signed URL or public URL
    if (document.file_url) {
      // Check if it's a Supabase storage path (not a full URL)
      if (document.file_url.includes('supabase.co') || document.file_url.startsWith('http://') || document.file_url.startsWith('https://')) {
        // It's already a full URL, fetch it
        console.log('Fetching file from URL:', document.file_url.substring(0, 100))
        try {
          const response = await fetch(document.file_url, {
            method: 'GET',
            headers: {
              'Accept': '*/*',
            },
          })
          
          if (response.ok) {
            const blob = await response.blob()
            const buffer = await blob.arrayBuffer()
            
            console.log('Successfully fetched file from URL, size:', buffer.byteLength, 'bytes')
            
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': blob.type || getMimeType(getFileExtension(document.file_name)),
                'Content-Disposition': view ? `inline; filename="${encodeURIComponent(document.file_name)}"` : `attachment; filename="${encodeURIComponent(document.file_name)}"`,
                'Cache-Control': 'no-cache',
                'Content-Length': buffer.byteLength.toString(),
              },
            })
          } else {
            console.error('Failed to fetch file from URL, status:', response.status, response.statusText)
          }
        } catch (fetchError: any) {
          console.error('Error fetching file from URL:', fetchError.message)
        }
      } else if (!document.file_url.startsWith('data:')) {
        // Check if it's an old placeholder path first
        if (document.file_url.startsWith('uploads/')) {
          // Old format: uploads/applicantId/fileName - these files don't have actual content
          console.warn('Old placeholder path detected - file was uploaded before fix:', document.file_url)
          return NextResponse.json(
            { 
              error: 'File was uploaded with old format and is not available. Please re-upload the file.',
              details: 'This file was uploaded before the storage fix was applied. The file content was not saved to the database.',
              file_name: document.file_name,
              document_id: document.id
            },
            { status: 404 }
          )
        }
        
        // It's a storage path, try to get it from Supabase Storage
        console.log('Downloading file from Supabase Storage:', document.file_url)
        try {
          const { data: fileData, error: storageError } = await supabase.storage
            .from('documents')
            .download(document.file_url)

          if (!storageError && fileData) {
            const arrayBuffer = await fileData.arrayBuffer()
            
            console.log('Successfully downloaded file from storage, size:', arrayBuffer.byteLength, 'bytes')
            
            return new NextResponse(arrayBuffer, {
              headers: {
                'Content-Type': getMimeType(getFileExtension(document.file_name)),
                'Content-Disposition': view ? `inline; filename="${encodeURIComponent(document.file_name)}"` : `attachment; filename="${encodeURIComponent(document.file_name)}"`,
                'Cache-Control': 'no-cache',
                'Content-Length': arrayBuffer.byteLength.toString(),
              },
            })
          } else {
            console.error('Storage download failed:', storageError)
          }
        } catch (storageError: any) {
          console.error('Error downloading from storage:', storageError.message)
        }
      }
    } else {
      console.error('Document has no file_url')
    }

    // Fallback: return error if file not found
    console.error('File not available for download. Document:', {
      id: document.id,
      file_name: document.file_name,
      has_file_url: !!document.file_url,
      file_url_preview: document.file_url ? document.file_url.substring(0, 100) : 'null'
    })
    
    return NextResponse.json(
      { 
        error: 'File not available for download',
        details: document.file_url ? 'File URL exists but could not be retrieved' : 'No file URL found in database'
      },
      { status: 404 }
    )

  } catch (error: any) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || 'pdf'
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'txt': 'text/plain'
  }
  return mimeTypes[extension] || 'application/octet-stream'
}

