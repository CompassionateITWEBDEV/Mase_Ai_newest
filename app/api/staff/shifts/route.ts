import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('staff_shifts')
      .select('id, staff_id, day_of_week, start_time, end_time, shift_type, location, notes, created_at')
      .order('day_of_week')

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, shifts: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load shifts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staff_id, day_of_week, start_time, end_time, shift_type, location, notes } = body

    if (!staff_id || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role for inserts to avoid RLS issues
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data, error } = await supabase
      .from('staff_shifts')
      .insert({ staff_id, day_of_week, start_time, end_time, shift_type: shift_type || 'field', location: location || null, notes: notes || null })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, shift: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create shift' }, { status: 500 })
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, day_of_week, start_time, end_time, shift_type, location, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing shift id' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data, error } = await supabase
      .from('staff_shifts')
      .update({ day_of_week, start_time, end_time, shift_type, location, notes })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, shift: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update shift' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing shift id' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { error } = await supabase
      .from('staff_shifts')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete shift' }, { status: 500 })
  }
}


