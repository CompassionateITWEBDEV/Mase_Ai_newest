import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get staff's cost per mile
    const { data: staff, error } = await supabase
      .from('staff')
      .select('cost_per_mile')
      .eq('id', staffId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching staff cost per mile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Use staff's custom rate, or default to IRS standard $0.67
    const costPerMile = parseFloat(staff?.cost_per_mile?.toString() || '0.67')

    return NextResponse.json({
      success: true,
      costPerMile: costPerMile
    })
  } catch (error: any) {
    console.error("Error fetching cost per mile:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch cost per mile" }, { status: 500 })
  }
}

