import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Table: staff_shift_cancel_requests
// Columns: id, shift_id, staff_id, reason, status('pending'|'approved'|'declined'), created_at, resolved_at

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')
    const status = searchParams.get('status')

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('staff_shift_cancel_requests')
      .select('id, shift_id, staff_id, reason, status, created_at, resolved_at')
      .order('created_at', { ascending: false })

    if (staffId) query = query.eq('staff_id', staffId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, requests: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shift_id, staff_id, reason } = body
    if (!shift_id || !staff_id) return NextResponse.json({ error: 'Missing shift_id or staff_id' }, { status: 400 })

    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data, error } = await supabase
      .from('staff_shift_cancel_requests')
      .insert({ shift_id, staff_id, reason: reason || null, status: 'pending' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, request: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create request' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body // action: 'approve' | 'decline'
    if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })

    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    // Load request to get shift_id
    const { data: req, error: loadErr } = await supabase
      .from('staff_shift_cancel_requests')
      .select('id, shift_id, status')
      .eq('id', id)
      .single()
    if (loadErr || !req) return NextResponse.json({ error: loadErr?.message || 'Request not found' }, { status: 404 })

    if (action === 'approve') {
      // Delete the shift then mark request approved
      const { error: delErr } = await supabase.from('staff_shifts').delete().eq('id', req.shift_id)
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
      const { data, error } = await supabase
        .from('staff_shift_cancel_requests')
        .update({ status: 'approved', resolved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, request: data })
    } else if (action === 'decline') {
      const { data, error } = await supabase
        .from('staff_shift_cancel_requests')
        .update({ status: 'declined', resolved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, request: data })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update request' }, { status: 500 })
  }
}


