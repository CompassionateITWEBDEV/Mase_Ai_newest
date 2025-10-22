import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { applicant_id } = await request.json()

    if (!applicant_id) {
      return NextResponse.json(
        { error: 'Applicant ID is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Check for required documents
    const { data: documents, error } = await supabase
      .from('applicant_documents')
      .select('document_type, status, file_name, uploaded_date')
      .eq('applicant_id', applicant_id)
      .in('document_type', ['resume', 'license', 'certification'])
      .eq('status', 'verified')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to check documents' },
        { status: 500 }
      )
    }

    // Define required document types
    const requiredDocuments = [
      { type: 'resume', name: 'Resume' },
      { type: 'license', name: 'Professional License' },
      { type: 'certification', name: 'CPR Certification' }
    ]

    // Check which documents are missing
    const uploadedTypes = documents?.map(doc => doc.document_type) || []
    const missingDocuments = requiredDocuments.filter(
      req => !uploadedTypes.includes(req.type)
    )

    // Check if all required documents are present
    const hasAllDocuments = missingDocuments.length === 0

    return NextResponse.json({
      success: true,
      hasAllDocuments,
      missingDocuments,
      uploadedDocuments: documents || [],
      requiredDocuments
    })

  } catch (error: any) {
    console.error('Document validation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
