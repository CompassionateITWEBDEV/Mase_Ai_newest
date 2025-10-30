import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids') || ''
    const ids = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    if (ids.length === 0) {
      return NextResponse.json({ success: true, staff: [] })
    }

    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role_id, email')
      .in('id', ids)

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, staff: data || [] })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to load staff' }, { status: 500 })
  }
}


