import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicantId = searchParams.get('applicant_id')
    const type = searchParams.get('type')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Fetching documents...', { applicantId, type })

    let query = supabase
      .from('applicant_documents')
      .select('*')
      .order('uploaded_date', { ascending: false })

    // Filter by applicant if specified
    if (applicantId) {
      query = query.eq('applicant_id', applicantId)
    }

    // Filter by type if specified
    if (type) {
      query = query.eq('document_type', type)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      // If table doesn't exist or other error, return empty array instead of 500
      if (error.message.includes('relation "applicant_documents" does not exist') || 
          error.message.includes('does not exist')) {
        console.log('Documents table does not exist, returning empty array')
        return NextResponse.json({
          success: true,
          documents: [],
          count: 0,
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch documents: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${documents?.length || 0} documents`)

    return NextResponse.json({
      success: true,
      documents: documents || [],
      count: documents?.length || 0,
    })
    
  } catch (error: any) {
    console.error('Documents fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
