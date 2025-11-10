import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

// Haversine formula to calculate distance between two coordinates (in miles)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Get coordinates from address using geocoding service
// Note: For now, we'll rely on visit_location from the database
// If visit_location is not available, we'll skip geocoding to avoid external API calls
async function getCoordinates(address: string): Promise<{ lat: number, lng: number } | null> {
  if (!address) return null
  
  // For now, return null - we'll rely on visit_location from database
  // If geocoding is needed in the future, implement a geocoding service here
  // (e.g., Google Maps Geocoding API, OpenStreetMap Nominatim, etc.)
  return null
}

// Nearest Neighbor algorithm for route optimization (simple TSP approximation)
function optimizeRouteOrder(waypoints: Array<{ id: string, name: string, lat: number, lng: number, scheduledTime?: string }>): string[] {
  if (waypoints.length <= 1) return waypoints.map(w => w.id)
  
  // Start with the first waypoint
  const optimized: string[] = []
  const remaining = [...waypoints]
  let current = remaining.shift()!
  optimized.push(current.id)
  
  // Greedy: always go to nearest unvisited waypoint
  while (remaining.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Infinity
    
    for (let i = 0; i < remaining.length; i++) {
      const distance = calculateDistance(
        current.lat, current.lng,
        remaining[i].lat, remaining[i].lng
      )
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }
    
    current = remaining.splice(nearestIndex, 1)[0]
    optimized.push(current.id)
  }
  
  return optimized
}

// Calculate total distance for a route
function calculateRouteDistance(waypoints: Array<{ lat: number, lng: number }>): number {
  if (waypoints.length < 2) return 0
  
  let totalDistance = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(
      waypoints[i].lat, waypoints[i].lng,
      waypoints[i + 1].lat, waypoints[i + 1].lng
    )
  }
  return totalDistance
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const staffId = searchParams.get('staff_id')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get all staff with active trips or scheduled visits for today
    let staffQuery = supabase
      .from('staff')
      .select('id, name, email, department, cost_per_mile')
      .eq('is_active', true)

    if (staffId) {
      staffQuery = staffQuery.eq('id', staffId)
    }

    const { data: staffMembers, error: staffError } = await staffQuery

    if (staffError) {
      console.error('Error fetching staff:', staffError)
      return NextResponse.json({ success: false, error: "Failed to fetch staff members" }, { status: 500 })
    }

    if (!staffMembers || staffMembers.length === 0) {
      console.log('No active staff members found')
      return NextResponse.json({ success: true, routes: [], summary: {
        totalSavings: 0,
        totalTimeSaved: 0,
        totalDistanceSaved: 0,
        avgEfficiencyGain: 0,
        routesOptimized: 0
      }})
    }

    console.log(`Found ${staffMembers.length} active staff members`)

    // Get active trips and scheduled visits for each staff member
    const routes = await Promise.all(
      staffMembers.map(async (staff) => {
        // Get active trip
        const { data: activeTrip } = await supabase
          .from('staff_trips')
          .select('id, start_time, start_location')
          .eq('staff_id', staff.id)
          .eq('status', 'active')
          .order('start_time', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Get visits for route optimization:
        // 1. in_progress visits (already started)
        // 2. scheduled visits (scheduled_time set, not completed/cancelled) with location data
        // Must have visit_location data for route optimization
        const { data: visits, error: visitsError } = await supabase
          .from('staff_visits')
          .select('id, patient_name, patient_address, visit_location, scheduled_time, start_time, status')
          .eq('staff_id', staff.id)
          .in('status', ['in_progress']) // Only in_progress visits (started visits)
          .not('visit_location', 'is', null) // Only visits with location data
          .order('scheduled_time', { ascending: true, nullsFirst: true })
          .order('start_time', { ascending: true, nullsFirst: true })

        if (visitsError) {
          console.error(`Error fetching visits for staff ${staff.id}:`, visitsError)
        }

        if (!visits || visits.length === 0) {
          return null
        }

        // Build waypoints from visits (only those with valid location data)
        const waypoints: Array<{
          id: string
          name: string
          address: string
          lat: number
          lng: number
          scheduledTime?: string
          originalIndex: number
        }> = []
        
        for (let i = 0; i < visits.length; i++) {
          const visit = visits[i]
          let lat = 0
          let lng = 0

          // Get coordinates from visit_location (required - we filtered for this)
          if (visit.visit_location) {
            const loc = visit.visit_location as any
            lat = loc.lat || (Array.isArray(loc) ? loc[0] : 0)
            lng = loc.lng || (Array.isArray(loc) ? loc[1] : 0)
          }

          // Only add waypoint if we have valid coordinates
          if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
            waypoints.push({
              id: visit.id,
              name: visit.patient_name || `Visit ${waypoints.length + 1}`,
              address: visit.patient_address || '',
              lat: parseFloat(lat.toString()),
              lng: parseFloat(lng.toString()),
              scheduledTime: visit.scheduled_time,
              originalIndex: i
            })
          }
        }

        if (waypoints.length < 2) {
          return null // Need at least 2 waypoints to optimize
        }

        // Calculate current route distance (in order of scheduled_time)
        // Sort waypoints by scheduled_time to get current order
        const sortedBySchedule = [...waypoints].sort((a, b) => {
          if (!a.scheduledTime && !b.scheduledTime) return 0
          if (!a.scheduledTime) return 1
          if (!b.scheduledTime) return -1
          return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
        })
        const currentOrder = sortedBySchedule.map(w => w.id)
        const currentDistance = calculateRouteDistance(sortedBySchedule.map(w => ({ lat: w.lat, lng: w.lng })))

        // Optimize route
        const optimizedOrder = optimizeRouteOrder(waypoints)
        const optimizedWaypoints = optimizedOrder.map(id => waypoints.find(w => w.id === id)!).filter(Boolean)
        const optimizedDistance = calculateRouteDistance(optimizedWaypoints.map(w => ({ lat: w.lat, lng: w.lng })))

        // Calculate savings
        const distanceSaved = currentDistance - optimizedDistance
        const costPerMile = parseFloat(staff.cost_per_mile?.toString() || '0.67')
        const costSaved = distanceSaved * costPerMile
        const timeSaved = Math.round((distanceSaved / 25) * 60) // Assuming 25 mph average

        return {
          staffId: staff.id,
          staffName: staff.name,
          staffDepartment: staff.department,
          costPerMile,
          currentRoute: waypoints.map(w => w.name),
          optimizedRoute: optimizedWaypoints.map(w => w.name),
          currentOrder,
          optimizedOrder,
          currentDistance: parseFloat(currentDistance.toFixed(2)),
          optimizedDistance: parseFloat(optimizedDistance.toFixed(2)),
          distanceSaved: parseFloat(distanceSaved.toFixed(2)),
          timeSaved,
          costSaved: parseFloat(costSaved.toFixed(2)),
          waypoints: waypoints.map(w => ({
            id: w.id,
            name: w.name,
            address: w.address,
            lat: w.lat,
            lng: w.lng
          }))
        }
      })
    )

    const validRoutes = routes.filter((r): r is NonNullable<typeof r> => r !== null)

    console.log(`Found ${validRoutes.length} valid routes to optimize`)

    // Calculate totals
    const totalSavings = validRoutes.reduce((sum, r) => sum + (r.costSaved || 0), 0)
    const totalTimeSaved = validRoutes.reduce((sum, r) => sum + (r.timeSaved || 0), 0)
    const totalDistanceSaved = validRoutes.reduce((sum, r) => sum + (r.distanceSaved || 0), 0)
    const avgEfficiencyGain = validRoutes.length > 0
      ? validRoutes.reduce((sum, r) => {
          const gain = r.currentDistance > 0
            ? ((r.distanceSaved / r.currentDistance) * 100)
            : 0
          return sum + gain
        }, 0) / validRoutes.length
      : 0

    return NextResponse.json({
      success: true,
      routes: validRoutes,
      summary: {
        totalSavings: parseFloat(totalSavings.toFixed(2)),
        totalTimeSaved,
        totalDistanceSaved: parseFloat(totalDistanceSaved.toFixed(2)),
        avgEfficiencyGain: parseFloat(avgEfficiencyGain.toFixed(1)),
        routesOptimized: validRoutes.length
      }
    })
  } catch (error: any) {
    console.error("Error fetching routes:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message || "Failed to fetch routes",
      routes: [],
      summary: {
        totalSavings: 0,
        totalTimeSaved: 0,
        totalDistanceSaved: 0,
        avgEfficiencyGain: 0,
        routesOptimized: 0
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { staffId, optimizedOrder } = await request.json()

    if (!staffId || !optimizedOrder || !Array.isArray(optimizedOrder)) {
      return NextResponse.json({ error: "Staff ID and optimized order are required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Update visit order by updating scheduled_time based on optimized order
    // We'll set scheduled_time to sequential times based on the new order
    const today = new Date()
    today.setHours(8, 0, 0, 0) // Start at 8 AM

    for (let i = 0; i < optimizedOrder.length; i++) {
      const visitId = optimizedOrder[i]
      const scheduledTime = new Date(today)
      scheduledTime.setMinutes(scheduledTime.getMinutes() + (i * 30)) // 30 minutes between visits

      await supabase
        .from('staff_visits')
        .update({
          scheduled_time: scheduledTime.toISOString()
        })
        .eq('id', visitId)
        .eq('staff_id', staffId)
    }

    return NextResponse.json({
      success: true,
      message: "Route optimized and applied successfully"
    })
  } catch (error: any) {
    console.error("Error applying optimized route:", error)
    return NextResponse.json({ error: error.message || "Failed to apply optimized route" }, { status: 500 })
  }
}

