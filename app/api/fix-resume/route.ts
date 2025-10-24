import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Fixing pending documents...')

    // Find all pending documents
    const { data: pendingDocs, error: fetchError } = await supabase
      .from('applicant_documents')
      .select('*')
      .eq('status', 'pending')

    if (fetchError) {
      console.error('Error fetching pending documents:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch pending documents: ' + fetchError.message },
        { status: 500 }
      )
    }

    console.log(`Found ${pendingDocs?.length || 0} pending documents`)

    if (!pendingDocs || pendingDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending documents found',
        updated: 0
      })
    }

    // Update all pending documents to verified
    const { data: updatedDocs, error: updateError } = await supabase
      .from('applicant_documents')
      .update({
        status: 'verified',
        verified_date: new Date().toISOString(),
        verified_by: null, // Set to null instead of 'system'
        notes: 'Auto-verified by system fix',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .select('*')

    if (updateError) {
      console.error('Error updating documents:', updateError)
      return NextResponse.json(
        { error: 'Failed to update documents: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log(`Successfully verified ${updatedDocs?.length || 0} documents`)

    return NextResponse.json({
      success: true,
      message: `Successfully verified ${updatedDocs?.length || 0} documents`,
      updated: updatedDocs?.length || 0,
      documents: updatedDocs
    })

  } catch (error: any) {
    console.error('Fix resume error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check status
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: documents, error } = await supabase
      .from('applicant_documents')
      .select('*')
      .order('uploaded_date', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    const pendingCount = documents?.filter(doc => doc.status === 'pending').length || 0
    const verifiedCount = documents?.filter(doc => doc.status === 'verified').length || 0

    return NextResponse.json({
      success: true,
      total: documents?.length || 0,
      pending: pendingCount,
      verified: verifiedCount,
      documents: documents
    })

  } catch (error: any) {
    console.error('Get documents status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
