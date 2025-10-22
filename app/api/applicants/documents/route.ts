import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicantId = searchParams.get('applicant_id')

    if (!applicantId) {
      return NextResponse.json(
        { error: 'Applicant ID is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get applicant documents
    const { data: documents, error } = await supabase
      .from('applicant_documents')
      .select(`
        id,
        document_type,
        file_name,
        file_size,
        file_url,
        uploaded_date,
        status,
        verified_date,
        notes,
        applicant:applicants(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('applicant_id', applicantId)
      .order('uploaded_date', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    // Transform the data to include applicant name
    const transformedDocuments = documents?.map(doc => ({
      ...doc,
      applicant_name: doc.applicant ? 
        `${doc.applicant.first_name} ${doc.applicant.last_name}` : 
        'Unknown Applicant',
      file_size_mb: doc.file_size ? (doc.file_size / (1024 * 1024)).toFixed(2) : '0',
      uploaded_date_formatted: new Date(doc.uploaded_date).toLocaleDateString(),
      status_badge: getStatusBadge(doc.status)
    })) || []

    return NextResponse.json({
      success: true,
      documents: transformedDocuments
    })

  } catch (error: any) {
    console.error('Document fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'verified':
      return { text: 'Verified', variant: 'success' }
    case 'pending':
      return { text: 'Pending', variant: 'warning' }
    case 'rejected':
      return { text: 'Rejected', variant: 'destructive' }
    default:
      return { text: 'Unknown', variant: 'secondary' }
  }
}
