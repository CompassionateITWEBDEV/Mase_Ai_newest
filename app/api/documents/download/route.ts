import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')
    const applicantId = searchParams.get('applicant_id')

    if (!documentId && !applicantId) {
      return NextResponse.json(
        { error: 'Missing document_id or applicant_id' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('applicant_documents')
      .select(`
        *,
        applicant:applicants(
          first_name,
          last_name,
          email
        )
      `)

    if (documentId) {
      query = query.eq('id', documentId)
    } else if (applicantId) {
      query = query.eq('applicant_id', applicantId)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found' },
        { status: 404 }
      )
    }

    // If single document requested, return it directly
    if (documentId && documents.length === 1) {
      const document = documents[0]
      
      // Check if file_url is a base64 data URL
      if (document.file_url && document.file_url.startsWith('data:')) {
        // Extract base64 content
        const matches = document.file_url.match(/^data:([^;]+);base64,(.+)$/)
        if (matches) {
          const mimeType = matches[1]
          const base64Data = matches[2]
          const buffer = Buffer.from(base64Data, 'base64')
          
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': mimeType,
              'Content-Disposition': `attachment; filename="${document.file_name}"`,
              'Cache-Control': 'no-cache',
            },
          })
        }
      }
      
      // Check if file_url is a Supabase Storage URL
      if (document.file_url && document.file_url.includes('supabase')) {
        try {
          // Fetch the file from Supabase Storage
          const response = await fetch(document.file_url)
          if (response.ok) {
            const blob = await response.blob()
            const buffer = await blob.arrayBuffer()
            
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': blob.type || getMimeType(getFileExtension(document.file_name)),
                'Content-Disposition': `attachment; filename="${document.file_name}"`,
                'Cache-Control': 'no-cache',
              },
            })
          }
        } catch (fetchError) {
          console.error('Error fetching file from storage:', fetchError)
        }
      }
      
      // Fallback to placeholder if no real file is available
      const fileExtension = getFileExtension(document.file_name)
      const mimeType = getMimeType(fileExtension)
      const content = generatePlaceholderContent(document, fileExtension)
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${document.file_name}"`,
          'Cache-Control': 'no-cache',
        },
      })
    }

    // If multiple documents or applicant ID provided, return ZIP
    return await createZipResponse(documents)

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

function generatePlaceholderContent(document: any, extension: string): string {
  const applicantName = document.applicant ? 
    `${document.applicant.first_name} ${document.applicant.last_name}` : 
    'Unknown Applicant'

  if (extension === 'pdf') {
    return generatePDFContent(document, applicantName)
  } else if (['doc', 'docx'].includes(extension)) {
    return generateWordContent(document, applicantName)
  } else if (['jpg', 'jpeg', 'png'].includes(extension)) {
    return generateImageContent(document, applicantName)
  } else {
    return generateTextContent(document, applicantName)
  }
}

function generatePDFContent(document: any, applicantName: string): string {
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 500
>>
stream
BT
/F1 14 Tf
50 750 Td
(DOCUMENT: ${document.document_type.toUpperCase()}) Tj
0 -30 Td
(Applicant: ${applicantName}) Tj
0 -20 Td
(File: ${document.file_name}) Tj
0 -20 Td
(Uploaded: ${new Date(document.uploaded_date).toLocaleDateString()}) Tj
0 -20 Td
(Status: ${document.status.toUpperCase()}) Tj
0 -40 Td
(Generated by M.A.S.E AI Intelligence System) Tj
0 -20 Td
(This is a placeholder document for demonstration purposes) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
756
%%EOF`
}

function generateWordContent(document: any, applicantName: string): string {
  return `DOCUMENT INFORMATION
====================

Document Type: ${document.document_type}
Applicant: ${applicantName}
File Name: ${document.file_name}
Upload Date: ${new Date(document.uploaded_date).toLocaleDateString()}
Status: ${document.status}
File Size: ${document.file_size} bytes

NOTES:
${document.notes || 'No additional notes provided'}

This is a placeholder document generated by the M.A.S.E AI Intelligence System.
In a production environment, this would be the actual uploaded document file.

Generated on: ${new Date().toLocaleString()}`
}

function generateImageContent(document: any, applicantName: string): string {
  // For images, we'll return a simple text representation
  return `IMAGE DOCUMENT PLACEHOLDER
============================

Document Type: ${document.document_type}
Applicant: ${applicantName}
File Name: ${document.file_name}
Upload Date: ${new Date(document.uploaded_date).toLocaleDateString()}
Status: ${document.status}
File Size: ${document.file_size} bytes

This is a placeholder for an image document.
In production, this would be the actual image file.

Generated by M.A.S.E AI Intelligence System`
}

function generateTextContent(document: any, applicantName: string): string {
  return `DOCUMENT: ${document.document_type.toUpperCase()}
Applicant: ${applicantName}
File: ${document.file_name}
Uploaded: ${new Date(document.uploaded_date).toLocaleDateString()}
Status: ${document.status}
Size: ${document.file_size} bytes

${document.notes ? `Notes: ${document.notes}` : ''}

This is a placeholder document generated by M.A.S.E AI Intelligence System.
Generated on: ${new Date().toLocaleString()}`
}

async function createZipResponse(documents: any[]): Promise<NextResponse> {
  // In a real implementation, you would use a library like 'archiver' or 'jszip'
  // to create a ZIP file containing all documents
  // For now, we'll return a simple text file with document information
  
  const zipContent = documents.map(doc => {
    const applicantName = doc.applicant ? 
      `${doc.applicant.first_name} ${doc.applicant.last_name}` : 
      'Unknown Applicant'
    
    return `=== ${doc.file_name} ===
Type: ${doc.document_type}
Applicant: ${applicantName}
Uploaded: ${new Date(doc.uploaded_date).toLocaleDateString()}
Status: ${doc.status}
Size: ${doc.file_size} bytes
${doc.notes ? `Notes: ${doc.notes}` : ''}

`
  }).join('\n')

  return new NextResponse(zipContent, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="applicant-documents.zip"',
      'Cache-Control': 'no-cache',
    },
  })
}
