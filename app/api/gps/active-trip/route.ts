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

    // Get active trip for this staff
    const { data: activeTrip, error } = await supabase
      .from('staff_trips')
      .select('*')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is OK
      console.error('Error fetching active trip:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (activeTrip) {
      return NextResponse.json({
        success: true,
        trip: {
          id: activeTrip.id,
          staffId: activeTrip.staff_id,
          startTime: activeTrip.start_time,
          status: activeTrip.status,
          startLocation: activeTrip.start_location
        }
      })
    }

    return NextResponse.json({
      success: true,
      trip: null
    })
  } catch (error: any) {
    console.error("Error checking active trip:", error)
    return NextResponse.json({ error: error.message || "Failed to check active trip" }, { status: 500 })
  }
}

