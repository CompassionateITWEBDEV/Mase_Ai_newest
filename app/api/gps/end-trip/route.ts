import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { tripId, staffId, latitude, longitude, address } = await request.json()

    if (!tripId && !staffId) {
      return NextResponse.json({ error: "Trip ID or Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get trip
    let query = supabase.from('staff_trips').select('*')
    if (tripId) {
      query = query.eq('id', tripId)
    } else {
      query = query.eq('staff_id', staffId).eq('status', 'active').order('start_time', { ascending: false }).limit(1)
    }

    const { data: trip, error: tripError } = await query.single()

    if (tripError || !trip) {
      return NextResponse.json({ error: "Active trip not found" }, { status: 404 })
    }

    if (trip.status !== 'active') {
      return NextResponse.json({ error: "Trip is not active" }, { status: 400 })
    }

    // Calculate total distance and drive time
    const endTime = new Date()
    const startTime = new Date(trip.start_time)
    const driveTimeMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    let totalDistance = 0
    const routePoints = (trip.route_points || []) as any[]
    
    if (routePoints.length > 1) {
      // Calculate total distance from route points
      for (let i = 1; i < routePoints.length; i++) {
        const prev = routePoints[i - 1]
        const curr = routePoints[i]
        
        // Haversine formula (simplified, using database function would be better)
        const R = 3959 // Earth radius in miles
        const dLat = (curr.lat - prev.lat) * Math.PI / 180
        const dLon = (curr.lng - prev.lng) * Math.PI / 180
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        totalDistance += R * c
      }
    } else if (trip.start_location && latitude && longitude) {
      // Calculate distance from start to end
      const startLat = trip.start_location.lat || trip.start_location[0]
      const startLng = trip.start_location.lng || trip.start_location[1]
      const R = 3959
      const dLat = (parseFloat(latitude) - startLat) * Math.PI / 180
      const dLon = (parseFloat(longitude) - startLng) * Math.PI / 180
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(startLat * Math.PI / 180) * Math.cos(parseFloat(latitude) * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      totalDistance = R * c
    }

    const endLocation = latitude && longitude 
      ? { lat: parseFloat(latitude), lng: parseFloat(longitude), address: address || null }
      : null

    // Update trip
    const { data: updatedTrip, error: updateError } = await supabase
      .from('staff_trips')
      .update({
        end_time: endTime.toISOString(),
        end_location: endLocation,
        total_distance: parseFloat(totalDistance.toFixed(2)),
        total_drive_time: driveTimeMinutes,
        status: 'completed'
      })
      .eq('id', trip.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating trip:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Get staff's cost per mile for response
    const { data: staff } = await supabase
      .from('staff')
      .select('cost_per_mile')
      .eq('id', trip.staff_id)
      .single()
    
    const costPerMile = parseFloat(staff?.cost_per_mile?.toString() || '0.67')
    const tripCost = totalDistance * costPerMile

    // Update performance stats
    await updatePerformanceStats(trip.staff_id, driveTimeMinutes, totalDistance)

    return NextResponse.json({
      success: true,
      message: "Trip ended successfully",
      trip: {
        id: updatedTrip.id,
        totalDriveTime: updatedTrip.total_drive_time,
        totalDistance: updatedTrip.total_distance,
        duration: driveTimeMinutes,
        costPerMile: costPerMile,
        totalCost: parseFloat(tripCost.toFixed(2))
      }
    })
  } catch (error: any) {
    console.error("Error ending trip:", error)
    return NextResponse.json({ error: error.message || "Failed to end trip" }, { status: 500 })
  }
}

async function updatePerformanceStats(staffId: string, driveTime: number, distance: number) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Get staff's cost per mile (customizable per staff)
  const { data: staff } = await supabase
    .from('staff')
    .select('cost_per_mile')
    .eq('id', staffId)
    .single()

  // Use staff's custom cost per mile, or default to IRS standard $0.67
  const costPerMile = parseFloat(staff?.cost_per_mile?.toString() || '0.67')

  const today = new Date().toISOString().split('T')[0]
  
  // Get or create today's stats
  const { data: existing } = await supabase
    .from('staff_performance_stats')
    .select('*')
    .eq('staff_id', staffId)
    .eq('date', today)
    .eq('period', 'day')
    .single()

  const newTotalMiles = parseFloat(existing?.total_miles?.toString() || '0') + distance
  const newTotalCost = newTotalMiles * costPerMile

  if (existing) {
    await supabase
      .from('staff_performance_stats')
      .update({
        total_drive_time: (existing.total_drive_time || 0) + driveTime,
        total_miles: newTotalMiles.toFixed(2),
        total_cost: newTotalCost.toFixed(2),
        cost_per_mile: costPerMile, // Update with current rate
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('staff_performance_stats')
      .insert({
        staff_id: staffId,
        date: today,
        period: 'day',
        total_drive_time: driveTime,
        total_miles: distance.toFixed(2),
        total_cost: (distance * costPerMile).toFixed(2),
        cost_per_mile: costPerMile
      })
  }
}

