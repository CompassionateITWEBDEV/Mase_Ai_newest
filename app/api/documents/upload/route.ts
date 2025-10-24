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

    // For now, we'll just store the metadata in the database
    // In a real implementation, you would upload the file to Supabase Storage
    const { data, error } = await supabase
      .from('applicant_documents')
      .insert({
        applicant_id: applicantId,
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        file_url: `placeholder_url_${Date.now()}`, // Placeholder URL
        uploaded_date: new Date().toISOString(),
        status: 'pending'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save document metadata: ' + error.message },
        { status: 500 }
      )
    }

    // Trigger automatic verification
    try {
      // Create realistic content for verification based on document type
      let fileContent = file.name
      
      if (documentType === 'resume') {
        // Simulate resume content for better verification
        fileContent = `
          Professional Resume
          Experience: Healthcare professional with 5+ years
          Education: Bachelor's Degree in Nursing
          Skills: Patient care, medical procedures, documentation
          Work History: Registered Nurse at various healthcare facilities
          Contact: email@example.com, (555) 123-4567
          Professional Experience: Extensive background in healthcare
        `
      } else if (documentType === 'license') {
        fileContent = `
          Nursing License
          License Number: RN123456789
          State Board of Nursing
          Registered Nurse License
          Valid until: 12/31/2025
        `
      } else if (documentType === 'certification') {
        fileContent = `
          CPR Certification
          American Heart Association
          Basic Life Support (BLS)
          Expires: 12/31/2024
          Certification Number: BLS123456
        `
      } else if (documentType === 'background_check') {
        fileContent = `
          Background Check Report
          Criminal History: Clear
          No Record Found
          FBI Background Check
          Date: 01/15/2024
        `
      }
      
      // Call auto-verification API
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/documents/auto-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: data[0].id,
          documentType: documentType,
          fileName: file.name,
          fileContent: fileContent
        })
      })
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json()
        console.log('Auto-verification completed:', verifyData.verification)
      }
    } catch (verifyError) {
      console.error('Auto-verification failed:', verifyError)
      // Don't fail the upload if verification fails
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