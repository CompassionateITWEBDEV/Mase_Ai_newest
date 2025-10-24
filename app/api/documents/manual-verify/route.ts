import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { documentId, action = 'verified', notes = 'Manually verified for testing' } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing required field: documentId' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Update document status
    const updateData = {
      status: action,
      verified_date: new Date().toISOString(),
      verified_by: 'system',
      notes: notes,
      updated_at: new Date().toISOString()
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
    console.error('Manual verification API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
