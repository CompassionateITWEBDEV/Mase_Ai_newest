import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

// Optimization Settings Interface
interface OptimizationSettings {
  prioritizeTimeSavings: boolean
  considerTrafficPatterns: boolean
  respectAppointmentWindows: boolean
  minimizeFuelCosts: boolean
}

// Default settings
const defaultSettings: OptimizationSettings = {
  prioritizeTimeSavings: true,
  considerTrafficPatterns: true,
  respectAppointmentWindows: true,
  minimizeFuelCosts: false
}

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

// Calculate time between two points (in minutes) - assumes average speed of 25 mph
function calculateTime(lat1: number, lon1: number, lat2: number, lon2: number, settings: OptimizationSettings, currentTime?: Date): number {
  const distance = calculateDistance(lat1, lon1, lat2, lon2)
  let baseSpeed = 25 // mph - average speed
  
  // Traffic pattern simulation based on time of day
  if (settings.considerTrafficPatterns && currentTime) {
    const hour = currentTime.getHours()
    // Rush hours: 7-9 AM and 5-7 PM have slower speeds
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
      baseSpeed = 15 // Rush hour speed
    } else if (hour >= 9 && hour < 17) {
      baseSpeed = 30 // Mid-day speed
    } else {
      baseSpeed = 35 // Off-peak speed
    }
  }
  
  const timeInHours = distance / baseSpeed
  return timeInHours * 60 // Convert to minutes
}

// Calculate cost between two points (in dollars)
function calculateCost(lat1: number, lon1: number, lat2: number, lon2: number, costPerMile: number): number {
  const distance = calculateDistance(lat1, lon1, lat2, lon2)
  return distance * costPerMile
}

// Calculate route cost (weighted by cost per mile)
function calculateRouteCost(waypoints: Array<{ lat: number, lng: number }>, costPerMile: number): number {
  if (waypoints.length < 2) return 0
  let totalCost = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalCost += calculateCost(
      waypoints[i].lat, waypoints[i].lng,
      waypoints[i + 1].lat, waypoints[i + 1].lng,
      costPerMile
    )
  }
  return totalCost
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
function optimizeRouteOrder(
  waypoints: Array<{ id: string, name: string, lat: number, lng: number, scheduledTime?: string }>,
  settings: OptimizationSettings,
  costPerMile: number = 0.67,
  currentTime?: Date
): string[] {
  if (waypoints.length <= 1) return waypoints.map(w => w.id)
  
  // Respect appointment windows: Sort by scheduled_time first
  let sortedWaypoints = [...waypoints]
  if (settings.respectAppointmentWindows) {
    sortedWaypoints = sortedWaypoints.sort((a, b) => {
      if (!a.scheduledTime && !b.scheduledTime) return 0
      if (!a.scheduledTime) return 1
      if (!b.scheduledTime) return -1
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    })
  }
  
  // Start with the first waypoint (or earliest scheduled if respecting windows)
  const optimized: string[] = []
  const remaining = [...sortedWaypoints]
  let current = remaining.shift()!
  optimized.push(current.id)
  
  // Greedy: always go to best unvisited waypoint based on settings
  while (remaining.length > 0) {
    let bestIndex = 0
    let bestScore = Infinity
    
    for (let i = 0; i < remaining.length; i++) {
      let score: number
      
      if (settings.minimizeFuelCosts) {
        // Minimize cost
        score = calculateCost(
          current.lat, current.lng,
          remaining[i].lat, remaining[i].lng,
          costPerMile
        )
      } else if (settings.prioritizeTimeSavings) {
        // Minimize time
        score = calculateTime(
          current.lat, current.lng,
          remaining[i].lat, remaining[i].lng,
          settings,
          currentTime
        )
      } else {
        // Minimize distance (default)
        score = calculateDistance(
          current.lat, current.lng,
          remaining[i].lat, remaining[i].lng
        )
      }
      
      // Penalty for missing appointment windows
      if (settings.respectAppointmentWindows && remaining[i].scheduledTime && currentTime) {
        const scheduledTime = new Date(remaining[i].scheduledTime)
        const estimatedArrival = new Date(currentTime.getTime() + score * 60000) // score is in minutes
        const timeDiff = Math.abs(estimatedArrival.getTime() - scheduledTime.getTime()) / 60000 // minutes
        if (timeDiff > 30) {
          score += timeDiff * 0.1 // Penalty for being far from scheduled time
        }
      }
      
      if (score < bestScore) {
        bestScore = score
        bestIndex = i
      }
    }
    
    current = remaining.splice(bestIndex, 1)[0]
    optimized.push(current.id)
    
    // Update current time for next iteration
    if (settings.prioritizeTimeSavings && currentTime) {
      const timeToNext = calculateTime(
        current.lat, current.lng,
        current.lat, current.lng, // Same point, just get base time
        settings,
        currentTime
      )
      currentTime = new Date(currentTime.getTime() + (bestScore + 15) * 60000) // Add travel time + 15 min visit time
    }
  }
  
  return optimized
}

// 2-opt algorithm for route improvement (more advanced than Nearest Neighbor)
function optimizeRoute2Opt(
  waypoints: Array<{ id: string, name: string, lat: number, lng: number, scheduledTime?: string }>,
  settings: OptimizationSettings,
  costPerMile: number = 0.67,
  currentTime?: Date
): string[] {
  if (waypoints.length <= 2) return waypoints.map(w => w.id)
  
  // Start with Nearest Neighbor solution
  let route = optimizeRouteOrder(waypoints, settings, costPerMile, currentTime)
  let improved = true
  const maxIterations = 100
  let iterations = 0
  
  const waypointMap = new Map(waypoints.map(w => [w.id, w]))
  const getWaypoint = (id: string) => waypointMap.get(id)!
  
  // Calculate route score based on settings
  const calculateRouteScore = (r: string[]): number => {
    let total = 0
    let time = currentTime ? new Date(currentTime) : new Date()
    
    for (let i = 0; i < r.length - 1; i++) {
      const w1 = getWaypoint(r[i])
      const w2 = getWaypoint(r[i + 1])
      
      if (settings.minimizeFuelCosts) {
        total += calculateCost(w1.lat, w1.lng, w2.lat, w2.lng, costPerMile)
      } else if (settings.prioritizeTimeSavings) {
        const timeToNext = calculateTime(w1.lat, w1.lng, w2.lat, w2.lng, settings, time)
        total += timeToNext
        time = new Date(time.getTime() + (timeToNext + 15) * 60000) // Add travel + visit time
      } else {
        total += calculateDistance(w1.lat, w1.lng, w2.lat, w2.lng)
      }
    }
    return total
  }
  
  while (improved && iterations < maxIterations) {
    improved = false
    iterations++
    
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length; j++) {
        if (j - i === 1) continue // Skip adjacent edges
        
        // Calculate current score
        const currentScore = calculateRouteScore(route)
        
        // Create new route with 2-opt swap
        const newRoute = [
          ...route.slice(0, i),
          ...route.slice(i, j + 1).reverse(),
          ...route.slice(j + 1)
        ]
        
        const newScore = calculateRouteScore(newRoute)
        
        // If improvement, reverse segment
        if (newScore < currentScore) {
          route = newRoute
          improved = true
        }
      }
    }
  }
  
  return route
}

// Simulated Annealing algorithm (advanced optimization)
function optimizeRouteSimulatedAnnealing(
  waypoints: Array<{ id: string, name: string, lat: number, lng: number, scheduledTime?: string }>,
  settings: OptimizationSettings,
  costPerMile: number = 0.67,
  currentTime?: Date
): string[] {
  if (waypoints.length <= 2) return waypoints.map(w => w.id)
  
  // Start with Nearest Neighbor
  let route = optimizeRouteOrder(waypoints, settings, costPerMile, currentTime)
  const waypointMap = new Map(waypoints.map(w => [w.id, w]))
  const getWaypoint = (id: string) => waypointMap.get(id)!
  
  // Calculate route score based on settings
  const calculateRouteScore = (r: string[]): number => {
    let total = 0
    let time = currentTime ? new Date(currentTime) : new Date()
    
    for (let i = 0; i < r.length - 1; i++) {
      const w1 = getWaypoint(r[i])
      const w2 = getWaypoint(r[i + 1])
      
      if (settings.minimizeFuelCosts) {
        total += calculateCost(w1.lat, w1.lng, w2.lat, w2.lng, costPerMile)
      } else if (settings.prioritizeTimeSavings) {
        const timeToNext = calculateTime(w1.lat, w1.lng, w2.lat, w2.lng, settings, time)
        total += timeToNext
        time = new Date(time.getTime() + (timeToNext + 15) * 60000) // Add travel + visit time
      } else {
        total += calculateDistance(w1.lat, w1.lng, w2.lat, w2.lng)
      }
    }
    return total
  }
  
  let currentScore = calculateRouteScore(route)
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
      
      const newScore = calculateRouteScore(newRoute)
      const delta = newScore - currentScore
      
      // Accept if better, or accept with probability if worse (simulated annealing)
      if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
        route = newRoute
        currentScore = newScore
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
    
    // Get optimization settings from query params or use defaults
    const settings: OptimizationSettings = {
      prioritizeTimeSavings: searchParams.get('prioritizeTimeSavings') !== 'false',
      considerTrafficPatterns: searchParams.get('considerTrafficPatterns') !== 'false',
      respectAppointmentWindows: searchParams.get('respectAppointmentWindows') !== 'false',
      minimizeFuelCosts: searchParams.get('minimizeFuelCosts') === 'true'
    }
    
    const currentTime = new Date() // Current time for traffic pattern calculations

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
    console.log(`Staff members:`, staffMembers.map(s => ({ id: s.id, name: s.name })))

    // Get active trips and scheduled visits for each staff member
    // Use Promise.allSettled to ensure one failure doesn't break everything
    const routePromises = staffMembers.map(async (staff) => {
      try {
        console.log(`\n📋 Processing staff: ${staff.name} (${staff.id})`)
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

        // Get visits for route optimization - ONLY USE PATIENT SHARED LOCATION
        // Strategy: Only get visits that have been started (in_progress or completed) 
        // AND have patient shared location (source: 'patient_live_location')
        // Route optimization only reflects after the visit has started
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayISO = today.toISOString()
        
        // Only get visits that have started (in_progress or completed) - route optimization after visit
        // Get visits from today and recent past (last 7 days) that have been started
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoISO = sevenDaysAgo.toISOString()
        
        // Get only visits that have been started (in_progress or completed) with patient shared location
        const { data: allVisitsRaw, error: visitsError } = await supabase
          .from('staff_visits')
          .select('id, patient_name, patient_address, visit_location, scheduled_time, start_time, status, trip_id')
          .eq('staff_id', staff.id)
          .in('status', ['in_progress', 'completed']) // Only visits that have started
          .gte('start_time', sevenDaysAgoISO) // Only recent visits (last 7 days)
          .order('status', { ascending: false }) // in_progress first, then completed
          .order('start_time', { ascending: true, nullsFirst: true })
        
        if (visitsError) {
          console.error(`Error fetching visits for staff ${staff.id} (${staff.name}):`, visitsError)
        }
        
        console.log(`Staff ${staff.id} (${staff.name}): Found ${allVisitsRaw?.length || 0} total visits (before location filter)`)
        
        // Filter to only visits with PATIENT SHARED LOCATION (not geocoded addresses)
        // Only use visits where location source is 'patient_live_location'
        const allVisits = (allVisitsRaw || []).filter(visit => {
          if (!visit.visit_location) {
            console.log(`Visit ${visit.id} (${visit.patient_name}) has no visit_location`)
            return false
          }
          const loc = visit.visit_location as any
          
          // CRITICAL: Only use patient shared location, not geocoded addresses
          const isPatientSharedLocation = loc?.source === 'patient_live_location'
          if (!isPatientSharedLocation) {
            console.log(`Visit ${visit.id} (${visit.patient_name}) location is not from patient shared location (source: ${loc?.source || 'unknown'}) - skipping`)
            return false
          }
          
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

        // Build waypoints from visits - OPTIMIZED: Use GPS coordinates directly when available
        const waypoints: Array<{
          id: string
          name: string
          address: string
          lat: number
          lng: number
          scheduledTime?: string
          originalIndex: number
        }> = []

        console.log(`🔍 Processing ${visits.length} visits for waypoints...`)

        for (let i = 0; i < visits.length; i++) {
          const visit = visits[i]
          let lat = 0
          let lng = 0
          let addressValidated = false
          let validationMethod = ''
          let actualAddress = ''

          // ONLY USE PATIENT SHARED LOCATION - Do not use database address or geocode
          if (visit.visit_location) {
            const loc = visit.visit_location as any
            
            // CRITICAL: Only use patient shared location
            if (loc?.source !== 'patient_live_location') {
              console.warn(`⚠️ Visit ${visit.id} (${visit.patient_name}) location is not from patient shared location (source: ${loc?.source || 'unknown'}) - skipping`)
              continue
            }
            
            const gpsLat = loc.lat || (Array.isArray(loc) ? loc[0] : 0)
            const gpsLng = loc.lng || (Array.isArray(loc) ? loc[1] : 0)
            
            if (gpsLat && gpsLng && !isNaN(parseFloat(gpsLat.toString())) && !isNaN(parseFloat(gpsLng.toString())) && 
                parseFloat(gpsLat.toString()) !== 0 && parseFloat(gpsLng.toString()) !== 0) {
              // Use patient shared GPS coordinates directly
              lat = parseFloat(gpsLat.toString())
              lng = parseFloat(gpsLng.toString())
              addressValidated = true
              validationMethod = 'patient_shared_location'
              
              // Try reverse geocode for display address (optional, non-blocking)
              try {
                const { reverseGeocode } = await import('@/lib/geocoding')
                const realAddress = await Promise.race([
                  reverseGeocode(lat, lng),
                  new Promise<string | null>(resolve => setTimeout(() => resolve(null), 2000)) // 2s timeout
                ])
                
                if (realAddress) {
                  actualAddress = realAddress
                  console.log(`✅ Using patient shared location with reverse geocoding: ${lat.toFixed(6)}, ${lng.toFixed(6)} -> "${realAddress}"`)
                } else {
                  // Use coordinates as address if reverse geocoding fails
                  actualAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                  console.log(`✅ Using patient shared location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
                }
              } catch (error) {
                // Reverse geocoding failed - use coordinates as address
                actualAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                console.log(`✅ Using patient shared location (reverse geocoding failed): ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
              }
            } else {
              console.warn(`⚠️ Visit ${visit.id} (${visit.patient_name}) has invalid patient shared location coordinates`)
              continue
            }
          } else {
            console.warn(`⚠️ Visit ${visit.id} (${visit.patient_name}) has no visit_location - skipping (route optimization only uses patient shared location)`)
            continue
          }

          // Add waypoint if we have valid patient shared coordinates
          if (addressValidated && lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
            waypoints.push({
              id: visit.id,
              name: visit.patient_name || `Visit ${waypoints.length + 1}`,
              address: actualAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              lat: parseFloat(lat.toString()),
              lng: parseFloat(lng.toString()),
              scheduledTime: visit.scheduled_time,
              originalIndex: i
            })
            console.log(`✅ Added waypoint from patient shared location: ${visit.patient_name} at ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
          } else {
            console.error(`❌ REJECTED visit ${visit.id} (${visit.patient_name}): No valid patient shared location coordinates`)
          }
        }
        
        const rejectedCount = visits.length - waypoints.length
        console.log(`✅ Patient shared location validation complete: ${waypoints.length} VALID waypoints, ${rejectedCount} REJECTED (no patient shared location)`)
        
        if (rejectedCount > 0) {
          console.warn(`⚠️ ${rejectedCount} visits were REJECTED - route optimization only uses patient shared locations (not database addresses). Patients need to share their location for route optimization.`)
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
        console.log(`   Settings:`, settings)
        
        const costPerMile = parseFloat(staff.cost_per_mile?.toString() || '0.67')
        
        // Run Nearest Neighbor algorithm with settings
        const nnOrder = optimizeRouteOrder(waypoints, settings, costPerMile, currentTime)
        const nnWaypoints = nnOrder.map(id => waypoints.find(w => w.id === id)!).filter(Boolean)
        const nnDist = calculateRouteDistance(nnWaypoints.map(w => ({ lat: w.lat, lng: w.lng })))
        console.log(`  ✓ Nearest Neighbor: ${nnDist.toFixed(2)} mi`)
        
        // Run 2-Opt improvement algorithm with settings
        const twoOptOrder = optimizeRoute2Opt(waypoints, settings, costPerMile, currentTime)
        const twoOptWaypoints = twoOptOrder.map(id => waypoints.find(w => w.id === id)!).filter(Boolean)
        const twoOptDist = calculateRouteDistance(twoOptWaypoints.map(w => ({ lat: w.lat, lng: w.lng })))
        console.log(`  ✓ 2-Opt Improvement: ${twoOptDist.toFixed(2)} mi`)
        
        // Run Simulated Annealing algorithm with settings
        const saOrder = optimizeRouteSimulatedAnnealing(waypoints, settings, costPerMile, currentTime)
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
        const costSaved = distanceSaved * costPerMile
        
        // Calculate time saved based on settings
        let timeSaved: number
        if (settings.prioritizeTimeSavings) {
          // Calculate actual time saved using traffic-aware calculations
          // Sum up time for current route
          let currentTimeTotal = 0
          let time = new Date(currentTime)
          for (let i = 0; i < sortedBySchedule.length - 1; i++) {
            const timeToNext = calculateTime(
              sortedBySchedule[i].lat, sortedBySchedule[i].lng,
              sortedBySchedule[i + 1].lat, sortedBySchedule[i + 1].lng,
              settings,
              time
            )
            currentTimeTotal += timeToNext
            time = new Date(time.getTime() + (timeToNext + 15) * 60000) // Add travel + 15 min visit time
          }
          
          // Sum up time for optimized route
          let optimizedTimeTotal = 0
          time = new Date(currentTime)
          for (let i = 0; i < optimizedWaypoints.length - 1; i++) {
            const timeToNext = calculateTime(
              optimizedWaypoints[i].lat, optimizedWaypoints[i].lng,
              optimizedWaypoints[i + 1].lat, optimizedWaypoints[i + 1].lng,
              settings,
              time
            )
            optimizedTimeTotal += timeToNext
            time = new Date(time.getTime() + (timeToNext + 15) * 60000) // Add travel + 15 min visit time
          }
          
          timeSaved = Math.round(currentTimeTotal - optimizedTimeTotal)
        } else {
          // Fallback to distance-based calculation
          const avgSpeed = settings.considerTrafficPatterns ? 25 : 25
          timeSaved = Math.round((distanceSaved / avgSpeed) * 60)
        }

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
      } catch (error: any) {
        console.error(`❌ Error processing route for staff ${staff.id} (${staff.name}):`, error)
        // Return null so this staff member is skipped, but others continue
        return null
      }
    })

    const routeResults = await Promise.allSettled(routePromises)
    const routes = routeResults.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error('Route processing error:', result.reason)
        return null
      }
    })

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
    const { staffId, optimizedOrder, scheduledTimes } = await request.json()

    if (!staffId || !optimizedOrder || !Array.isArray(optimizedOrder)) {
      return NextResponse.json({ error: "Staff ID and optimized order are required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // If scheduledTimes is provided, use those (from schedule optimization)
    if (scheduledTimes && Array.isArray(scheduledTimes)) {
      for (const item of scheduledTimes) {
        await supabase
          .from('staff_visits')
          .update({
            scheduled_time: item.scheduledTime
          })
          .eq('id', item.visitId)
          .eq('staff_id', staffId)
      }
    } else {
      // Fallback: Update visit order by updating scheduled_time based on optimized order
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

