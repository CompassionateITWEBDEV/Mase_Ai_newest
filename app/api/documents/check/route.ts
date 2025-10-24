import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')
    const applicantId = searchParams.get('applicant_id')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('=== DOCUMENT CHECK DEBUG ===')

    // Check if specific document exists
    if (documentId) {
      const { data, error } = await supabase
        .from('applicant_documents')
        .select('*')
        .eq('id', documentId)

      console.log('Document check for ID:', documentId)
      console.log('Result:', { found: data?.length || 0, data, error })

      return NextResponse.json({
        documentId,
        exists: (data?.length || 0) > 0,
        document: data?.[0] || null,
        error: error?.message || null
      })
    }

    // Check all documents for applicant
    if (applicantId) {
      const { data, error } = await supabase
        .from('applicant_documents')
        .select('*')
        .eq('applicant_id', applicantId)

      console.log('All documents for applicant:', applicantId)
      console.log('Result:', { count: data?.length || 0, documents: data, error })

      return NextResponse.json({
        applicantId,
        count: data?.length || 0,
        documents: data || [],
        error: error?.message || null
      })
    }

    return NextResponse.json({ error: 'Missing document_id or applicant_id' }, { status: 400 })

  } catch (error: any) {
    console.error('Check error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

