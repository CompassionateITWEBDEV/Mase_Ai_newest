import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(request: NextRequest) {
  try {
    const { document_id, status, notes } = await request.json()

    if (!document_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: document_id and status' },
        { status: 400 }
      )
    }

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, verified, or rejected' },
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

    // Update document status
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    }

    if (status === 'verified' || status === 'rejected') {
      updateData.verified_date = new Date().toISOString()
    }

    if (notes) {
      updateData.notes = (updateData.notes || '') + (updateData.notes ? '\n' : '') + notes
    }

    const { data, error } = await supabase
      .from('application_form_documents')
      .update(updateData)
      .eq('id', document_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating document status:', error)
      return NextResponse.json(
        { error: 'Failed to update document status', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document: data,
      message: `Document ${status} successfully`
    })

  } catch (error: any) {
    console.error('Document verification API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}






