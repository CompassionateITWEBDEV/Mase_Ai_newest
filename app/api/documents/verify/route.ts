import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { documentId, action, verifiedBy, notes } = await request.json()

    if (!documentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId and action' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Update document status
    const updateData: any = {
      status: action, // 'verified', 'rejected', or 'pending'
      updated_at: new Date().toISOString()
    }

    if (action === 'verified' || action === 'rejected') {
      updateData.verified_date = new Date().toISOString()
      updateData.verified_by = verifiedBy || null
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabase
      .from('applicant_documents')
      .update(updateData)
      .eq('id', documentId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating document status:', error)
      return NextResponse.json(
        { error: 'Failed to update document status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      document: data,
      message: `Document ${action} successfully`
    })

  } catch (error: any) {
    console.error('Document verification API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch document verification details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing document_id' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: document, error } = await supabase
      .from('applicant_documents')
      .select(`
        *,
        applicant:applicants(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', documentId)
      .single()

    if (error) {
      console.error('Error fetching document:', error)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      document 
    })

  } catch (error: any) {
    console.error('Document fetch API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
