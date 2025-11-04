import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { staffId, latitude, longitude, address } = await request.json()

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check if there's an active trip for this staff
    const { data: activeTrip } = await supabase
      .from('staff_trips')
      .select('id')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .single()

    if (activeTrip) {
      return NextResponse.json({ 
        success: false, 
        error: "You already have an active trip. Please end it before starting a new one.",
        tripId: activeTrip.id
      }, { status: 400 })
    }

    // Create new trip
    const startLocation = latitude && longitude 
      ? { lat: parseFloat(latitude), lng: parseFloat(longitude), address: address || null }
      : null

    const { data: trip, error } = await supabase
      .from('staff_trips')
      .insert({
        staff_id: staffId,
        start_location: startLocation,
        status: 'active',
        route_points: startLocation ? [startLocation] : []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating trip:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Trip started successfully",
      trip: {
        id: trip.id,
        staffId: trip.staff_id,
        startTime: trip.start_time,
        status: trip.status
      }
    })
  } catch (error: any) {
    console.error("Error starting trip:", error)
    return NextResponse.json({ error: error.message || "Failed to start trip" }, { status: 500 })
  }
}
