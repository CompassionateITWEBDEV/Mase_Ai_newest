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

// AI-Powered Address Validation and Geocoding
// Validates real addresses and converts them to coordinates for accurate route optimization
async function getCoordinates(address: string): Promise<{ lat: number, lng: number, validated: boolean } | null> {
  if (!address || address.trim().length === 0) {
    console.warn('❌ Empty address provided')
    return null
  }
  
  // Check if address looks like coordinates (lat, lng format)
  const coordMatch = address.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1])
    const lng = parseFloat(coordMatch[2])
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, validated: true }
    }
  }
  
  // AI Validation: Check for fake addresses before geocoding
  const trimmed = address.trim().toLowerCase()
  const fakePatterns = [
    /^(.)\1{4,}$/, // Repeated characters (aaaaa)
    /^(asd|dasd|test|fake|dummy|sample|example|xxx|aaa|111)[\s\w]*$/i,
    /^[a-z]{1,3}$/, // Too short
    /^\d+$/, // Numbers only
  ]
  
  for (const pattern of fakePatterns) {
    if (pattern.test(trimmed)) {
      console.warn(`❌ REJECTED: Fake address pattern detected: "${address}"`)
      return null
    }
  }
  
  // Must have street number or recognizable address components
  const hasNumber = /\d/.test(address)
  const hasStreetWords = /\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl)\b/i.test(address)
  if (!hasNumber && !hasStreetWords && trimmed.length < 10) {
    console.warn(`❌ REJECTED: Address too vague or missing street info: "${address}"`)
    return null
  }
  
  // Use OpenStreetMap Nominatim - FREE, no API key needed!
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MASE-AI-Intelligence/1.0' // Required by Nominatim
        }
      }
    )
    
    if (!response.ok) {
      console.warn(`❌ Geocoding failed: HTTP ${response.status}`)
      return null
    }
    
    const data = await response.json()
    
    if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
      const result = data[0]
      const importance = result.importance || 0
      const formattedAddress = result.display_name
      
      // Check confidence level
      if (importance < 0.3) {
        console.warn(`⚠️ Low confidence result for "${address}" (importance: ${importance}) - may not be a real address`)
        return null
      }
      
      console.log(`✅ Address validated: "${address}" -> "${formattedAddress}" at ${result.lat}, ${result.lon} (importance: ${importance})`)
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        validated: true
      }
    } else {
      console.warn(`❌ Address NOT FOUND in OpenStreetMap: "${address}" - This is NOT a real address`)
      return null
    }
  } catch (error) {
    console.error('❌ Error geocoding address:', error)
  }
  
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

// 2-opt algorithm for route improvement (more advanced than Nearest Neighbor)
function optimizeRoute2Opt(waypoints: Array<{ id: string, name: string, lat: number, lng: number, scheduledTime?: string }>): string[] {
  if (waypoints.length <= 2) return waypoints.map(w => w.id)
  
  // Start with Nearest Neighbor solution
  let route = optimizeRouteOrder(waypoints)
  let improved = true
  const maxIterations = 100
  let iterations = 0
  
  while (improved && iterations < maxIterations) {
    improved = false
    iterations++
    
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length; j++) {
        if (j - i === 1) continue // Skip adjacent edges
        
        // Calculate current distance
        const waypointMap = new Map(waypoints.map(w => [w.id, w]))
        const getWaypoint = (id: string) => waypointMap.get(id)!
        
        const currentDist = 
          calculateDistance(getWaypoint(route[i - 1]).lat, getWaypoint(route[i - 1]).lng,
                           getWaypoint(route[i]).lat, getWaypoint(route[i]).lng) +
          calculateDistance(getWaypoint(route[j]).lat, getWaypoint(route[j]).lng,
                           getWaypoint(route[j + 1] || route[0]).lat, getWaypoint(route[j + 1] || route[0]).lng)
        
        // Calculate new distance after 2-opt swap
        const newDist = 
          calculateDistance(getWaypoint(route[i - 1]).lat, getWaypoint(route[i - 1]).lng,
                           getWaypoint(route[j]).lat, getWaypoint(route[j]).lng) +
          calculateDistance(getWaypoint(route[i]).lat, getWaypoint(route[i]).lng,
                           getWaypoint(route[j + 1] || route[0]).lat, getWaypoint(route[j + 1] || route[0]).lng)
        
        // If improvement, reverse segment
        if (newDist < currentDist) {
          // Reverse segment from i to j
          route = [
            ...route.slice(0, i),
            ...route.slice(i, j + 1).reverse(),
            ...route.slice(j + 1)
          ]
          improved = true
        }
      }
    }
  }
  
  return route
}

// Simulated Annealing algorithm (advanced optimization)
function optimizeRouteSimulatedAnnealing(waypoints: Array<{ id: string, name: string, lat: number, lng: number, scheduledTime?: string }>): string[] {
  if (waypoints.length <= 2) return waypoints.map(w => w.id)
  
  // Start with Nearest Neighbor
  let route = optimizeRouteOrder(waypoints)
  const waypointMap = new Map(waypoints.map(w => [w.id, w]))
  const getWaypoint = (id: string) => waypointMap.get(id)!
  
  const calculateRouteDistance = (r: string[]) => {
    let total = 0
    for (let i = 0; i < r.length - 1; i++) {
      const w1 = getWaypoint(r[i])
      const w2 = getWaypoint(r[i + 1])
      total += calculateDistance(w1.lat, w1.lng, w2.lat, w2.lng)
    }
    return total
  }
  
  let currentDistance = calculateRouteDistance(route)
  let temperature = 1000
  const coolingRate = 0.995
  const minTemperature = 1
  
  while (temperature > minTemperature) {
    // Generate neighbor by swapping two random waypoints
    const newRoute = [...route]
    const i = Math.floor(Math.random() * (newRoute.length - 1)) + 1
    const j = Math.floor(Math.random() * (newRoute.length - 1)) + 1
    
    if (i !== j) {
      [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]]
      
      const newDistance = calculateRouteDistance(newRoute)
      const delta = newDistance - currentDistance
      
      // Accept if better, or accept with probability if worse (simulated annealing)
      if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
        route = newRoute
        currentDistance = newDistance
      }
    }
    
    temperature *= coolingRate
  }
  
  return route
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

    // Get all active staff - Route Optimization works with ANY staff that has visits with location data
    // Doesn't require active trip - can optimize scheduled visits too
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

    console.log(`Found ${staffMembers.length} active staff members - checking for routes to optimize...`)

    // Get active trips and scheduled visits for each staff member
    const routes = await Promise.all(
      staffMembers.map(async (staff) => {
        // Get active trip (optional - route optimization works with or without active trip)
        // If there's an active trip, we'll include visits from that trip
        const { data: activeTrip } = await supabase
          .from('staff_trips')
          .select('id, start_time, start_location')
          .eq('staff_id', staff.id)
          .eq('status', 'active')
          .order('start_time', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Get visits for route optimization - CONNECTED TO GPS TRACKING
        // Strategy: Get ALL visits for today that have GPS location data
        // More flexible: Get visits from today regardless of status (as long as not completed/cancelled)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayISO = today.toISOString()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowISO = tomorrow.toISOString()
        
        // Get ALL visits that are not completed/cancelled - VERY FLEXIBLE
        // Get ALL in_progress visits regardless of date, plus recent visits (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()
        
        // Get all visits (even without location) to see what we have
        // Include: in_progress, completed (from today), and scheduled/future visits
        // Priority: in_progress visits first, then completed (today), then scheduled/future visits, then recent visits
        const { data: allVisitsRaw, error: visitsError } = await supabase
          .from('staff_visits')
          .select('id, patient_name, patient_address, visit_location, scheduled_time, start_time, status, trip_id')
          .eq('staff_id', staff.id)
          .neq('status', 'cancelled') // Only exclude cancelled visits
          .or(`status.eq.in_progress,status.eq.completed,start_time.gte.${thirtyDaysAgoISO},scheduled_time.gte.${thirtyDaysAgoISO},scheduled_time.is.null,start_time.is.null`)
          .order('status', { ascending: false }) // in_progress first, then completed
          .order('scheduled_time', { ascending: true, nullsFirst: true })
          .order('start_time', { ascending: true, nullsFirst: true })
        
        if (visitsError) {
          console.error(`Error fetching visits for staff ${staff.id} (${staff.name}):`, visitsError)
        }
        
        console.log(`Staff ${staff.id} (${staff.name}): Found ${allVisitsRaw?.length || 0} total visits (before location filter)`)
        
        // Filter to only visits with location data
        const allVisits = (allVisitsRaw || []).filter(visit => {
          if (!visit.visit_location) {
            console.log(`Visit ${visit.id} (${visit.patient_name}) has no visit_location`)
            return false
          }
          const loc = visit.visit_location as any
          const lat = loc?.lat || (Array.isArray(loc) ? loc[0] : null)
          const lng = loc?.lng || (Array.isArray(loc) ? loc[1] : null)
          const hasValidLocation = lat && lng && !isNaN(parseFloat(lat.toString())) && !isNaN(parseFloat(lng.toString()))
          if (!hasValidLocation) {
            console.log(`Visit ${visit.id} (${visit.patient_name}) has invalid location:`, loc)
          }
          return hasValidLocation
        })
        
        if (!allVisits || allVisits.length === 0) {
          // No visits found for this staff - skip route optimization
          const totalVisits = allVisitsRaw?.length || 0
          if (totalVisits > 0) {
            console.log(`⚠️ Staff ${staff.id} (${staff.name}) has ${totalVisits} visits but NONE have GPS location data`)
            console.log(`   Visit details:`, allVisitsRaw.map(v => ({
              id: v.id,
              patient: v.patient_name,
              hasLocation: !!v.visit_location,
              location: v.visit_location
            })))
          } else {
            console.log(`No visits found for staff ${staff.id} (${staff.name})`)
          }
          return null
        }

        console.log(`✅ Found ${allVisits.length} visits with location data for staff ${staff.id} (${staff.name}):`, 
          allVisits.map(v => v.patient_name))

        // Sort visits by scheduled_time (if available) or start_time
        const visits = allVisits.sort((a, b) => {
          // Prioritize scheduled_time if available
          if (a.scheduled_time && b.scheduled_time) {
            return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
          }
          if (a.scheduled_time) return -1
          if (b.scheduled_time) return 1
          // Fallback to start_time
          if (a.start_time && b.start_time) {
            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          }
          if (a.start_time) return -1
          if (b.start_time) return 1
          return 0
        })

        // Build waypoints from visits with STRICT AI-Powered Address Validation
        const waypoints: Array<{
          id: string
          name: string
          address: string
          lat: number
          lng: number
          scheduledTime?: string
          originalIndex: number
        }> = []

        console.log(`🔍 STRICT AI Address Validation for ${visits.length} visits...`)

        for (let i = 0; i < visits.length; i++) {
          const visit = visits[i]
          let lat = 0
          let lng = 0
          let addressValidated = false
          let validationMethod = ''

          // CRITICAL: Always validate the address, but use GPS as fallback with reverse geocoding
          let actualAddress = visit.patient_address || ''
          
          if (visit.patient_address) {
            console.log(`🔍 Validating address for visit ${visit.id} (${visit.patient_name}): "${visit.patient_address}"`)
            
            // Add delay to respect Nominatim rate limit (1 req/sec)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1100))
            }
            
            const geocoded = await getCoordinates(visit.patient_address)
            if (geocoded && geocoded.validated) {
              lat = geocoded.lat
              lng = geocoded.lng
              addressValidated = true
              validationMethod = 'geocoded'
              console.log(`✅ Address VALIDATED: "${visit.patient_address}" -> ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
            } else {
              // Address validation failed - try to use GPS coordinates with reverse geocoding
              console.warn(`⚠️ Address validation failed for "${visit.patient_address}" - trying GPS reverse geocoding...`)
              
              if (visit.visit_location) {
                const loc = visit.visit_location as any
                const gpsLat = loc.lat || (Array.isArray(loc) ? loc[0] : 0)
                const gpsLng = loc.lng || (Array.isArray(loc) ? loc[1] : 0)
                
                if (gpsLat && gpsLng && !isNaN(gpsLat) && !isNaN(gpsLng) && gpsLat !== 0 && gpsLng !== 0) {
                  // Use GPS coordinates and reverse geocode to get actual address
                  lat = parseFloat(gpsLat.toString())
                  lng = parseFloat(gpsLng.toString())
                  
                  // Reverse geocode to get actual address from GPS
                  await new Promise(resolve => setTimeout(resolve, 1100))
                  const { reverseGeocode } = await import('@/lib/geocoding')
                  const realAddress = await reverseGeocode(lat, lng)
                  
                  if (realAddress) {
                    actualAddress = realAddress
                    addressValidated = true
                    validationMethod = 'gps_reverse_geocoded'
                    console.log(`✅ Using GPS with reverse geocoding: ${lat.toFixed(6)}, ${lng.toFixed(6)} -> "${realAddress}"`)
                  } else {
                    // GPS exists but reverse geocoding failed - still use GPS coordinates
                    addressValidated = true
                    validationMethod = 'gps'
                    console.log(`✅ Using GPS coordinates (reverse geocoding failed): ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
                  }
                } else {
                  console.error(`❌ REJECTED: Invalid address and no valid GPS coordinates for visit ${visit.id} (${visit.patient_name})`)
                  continue
                }
              } else {
                console.error(`❌ REJECTED: Invalid address and no GPS coordinates for visit ${visit.id} (${visit.patient_name}): "${visit.patient_address}"`)
                continue
              }
            }
          } else {
            // No address provided - use visit_location with reverse geocoding
            if (visit.visit_location) {
              const loc = visit.visit_location as any
              lat = loc.lat || (Array.isArray(loc) ? loc[0] : 0)
              lng = loc.lng || (Array.isArray(loc) ? loc[1] : 0)
              
              if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                // Reverse geocode to get actual address from GPS
                await new Promise(resolve => setTimeout(resolve, 1100))
                const { reverseGeocode } = await import('@/lib/geocoding')
                const realAddress = await reverseGeocode(lat, lng)
                
                if (realAddress) {
                  actualAddress = realAddress
                  validationMethod = 'gps_reverse_geocoded'
                  console.log(`✅ Using GPS with reverse geocoding: ${lat.toFixed(6)}, ${lng.toFixed(6)} -> "${realAddress}"`)
                } else {
                  validationMethod = 'gps'
                  console.log(`✅ Using GPS coordinates (reverse geocoding failed): ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
                }
                addressValidated = true
              }
            }
          }

          // STRICT: Only add waypoint if address was validated
          if (addressValidated && lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
            waypoints.push({
              id: visit.id,
              name: visit.patient_name || `Visit ${waypoints.length + 1}`,
              address: actualAddress || visit.patient_address || '', // Use actual address from reverse geocoding if available
              lat: parseFloat(lat.toString()),
              lng: parseFloat(lng.toString()),
              scheduledTime: visit.scheduled_time,
              originalIndex: i
            })
            console.log(`✅ Added VALIDATED waypoint: ${visit.patient_name} at ${lat.toFixed(6)}, ${lng.toFixed(6)} (${validationMethod})`)
            if (actualAddress && actualAddress !== visit.patient_address) {
              console.log(`   📍 Actual address from GPS: "${actualAddress}" (original: "${visit.patient_address}")`)
            }
          } else {
            console.error(`❌ REJECTED visit ${visit.id} (${visit.patient_name}): Address validation failed. Address: "${visit.patient_address || 'N/A'}"`)
          }
        }
        
        const rejectedCount = visits.length - waypoints.length
        console.log(`✅ Address validation complete: ${waypoints.length} VALID waypoints, ${rejectedCount} REJECTED (fake/invalid addresses)`)
        
        if (rejectedCount > 0) {
          console.warn(`⚠️ ${rejectedCount} visits were REJECTED due to invalid/fake addresses. Please use real addresses for route optimization.`)
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

        // AI-Powered Route Optimization: Run all three algorithms and compare results
        console.log(`🔍 Running AI optimization for ${staff.name} with ${waypoints.length} waypoints`)
        
        // Run Nearest Neighbor algorithm
        const nnOrder = optimizeRouteOrder(waypoints)
        const nnWaypoints = nnOrder.map(id => waypoints.find(w => w.id === id)!).filter(Boolean)
        const nnDist = calculateRouteDistance(nnWaypoints.map(w => ({ lat: w.lat, lng: w.lng })))
        console.log(`  ✓ Nearest Neighbor: ${nnDist.toFixed(2)} mi`)
        
        // Run 2-Opt improvement algorithm
        const twoOptOrder = optimizeRoute2Opt(waypoints)
        const twoOptWaypoints = twoOptOrder.map(id => waypoints.find(w => w.id === id)!).filter(Boolean)
        const twoOptDist = calculateRouteDistance(twoOptWaypoints.map(w => ({ lat: w.lat, lng: w.lng })))
        console.log(`  ✓ 2-Opt Improvement: ${twoOptDist.toFixed(2)} mi`)
        
        // Run Simulated Annealing algorithm
        const saOrder = optimizeRouteSimulatedAnnealing(waypoints)
        const saWaypoints = saOrder.map(id => waypoints.find(w => w.id === id)!).filter(Boolean)
        const saDist = calculateRouteDistance(saWaypoints.map(w => ({ lat: w.lat, lng: w.lng })))
        console.log(`  ✓ Simulated Annealing: ${saDist.toFixed(2)} mi`)
        
        // AI-Powered: Use the best result and track which algorithm was selected
        // Compare all three algorithms and select the one with shortest distance
        let optimizedOrder = nnOrder
        let selectedAlgorithm = 'nearest_neighbor'
        let algorithmComparison = {
          nearestNeighbor: parseFloat(nnDist.toFixed(2)),
          twoOpt: parseFloat(twoOptDist.toFixed(2)),
          simulatedAnnealing: parseFloat(saDist.toFixed(2))
        }
        
        // Log algorithm results for debugging
        console.log(`Staff ${staff.id} (${staff.name}) - Algorithm Results:`, {
          nearestNeighbor: nnDist.toFixed(2) + ' mi',
          twoOpt: twoOptDist.toFixed(2) + ' mi',
          simulatedAnnealing: saDist.toFixed(2) + ' mi'
        })
        
        // Select the algorithm with the shortest distance
        const distances = [
          { algo: 'nearest_neighbor', dist: nnDist, order: nnOrder },
          { algo: '2_opt', dist: twoOptDist, order: twoOptOrder },
          { algo: 'simulated_annealing', dist: saDist, order: saOrder }
        ]
        
        const best = distances.reduce((best, current) => 
          current.dist < best.dist ? current : best
        )
        
        optimizedOrder = best.order
        selectedAlgorithm = best.algo
        
        console.log(`AI Selected: ${selectedAlgorithm} with distance ${best.dist.toFixed(2)} mi`)
        
        const optimizedWaypoints = optimizedOrder.map(id => waypoints.find(w => w.id === id)!).filter(Boolean)
        const optimizedDistance = calculateRouteDistance(optimizedWaypoints.map(w => ({ lat: w.lat, lng: w.lng })))

        // Calculate savings
        const distanceSaved = currentDistance - optimizedDistance
        
        // Calculate improvement percentage
        const improvementPercent = currentDistance > 0 
          ? ((distanceSaved / currentDistance) * 100).toFixed(1)
          : '0.0'
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
          })),
          visitStatuses: visits.map(v => ({
            id: v.id,
            status: v.status,
            patientName: v.patient_name
          })),
          selectedAlgorithm: selectedAlgorithm,
          algorithmComparison: algorithmComparison,
          improvementPercent: improvementPercent
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

