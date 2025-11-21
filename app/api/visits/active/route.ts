import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')
    const tripId = searchParams.get('trip_id')

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Build query
    let query = supabase
      .from('staff_visits')
      .select('*')
      .eq('staff_id', staffId)
      .eq('status', 'in_progress')
      .order('start_time', { ascending: false })
      .limit(1)

    if (tripId) {
      query = query.eq('trip_id', tripId)
    }

    const { data: activeVisit, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active visit:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (activeVisit) {
      return NextResponse.json({
        success: true,
        visit: {
          id: activeVisit.id,
          patient_id: activeVisit.patient_id,
          patient_name: activeVisit.patient_name,
          patientName: activeVisit.patient_name,
          patientAddress: activeVisit.patient_address,
          visitType: activeVisit.visit_type,
          startTime: activeVisit.start_time
        }
      })
    }

    return NextResponse.json({
      success: true,
      visit: null
    })
  } catch (error: any) {
    console.error("Error checking active visit:", error)
    return NextResponse.json({ error: error.message || "Failed to check active visit" }, { status: 500 })
  }
}

