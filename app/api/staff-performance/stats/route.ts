import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')
    const period = searchParams.get('period') || 'day' // 'day' or 'week'
    
    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const today = new Date().toISOString().split('T')[0]
    
    // Get today's stats
    const { data: todayStats } = await supabase
      .from('staff_performance_stats')
      .select('*')
      .eq('staff_id', staffId)
      .eq('date', today)
      .eq('period', 'day')
      .single()

    // Get week stats (sum of last 7 days)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    
    const { data: weekStatsData } = await supabase
      .from('staff_performance_stats')
      .select('*')
      .eq('staff_id', staffId)
      .eq('period', 'day')
      .gte('date', weekStart.toISOString().split('T')[0])

    // Aggregate week stats
    const weekStats = weekStatsData?.reduce((acc, stat) => ({
      total_drive_time: (acc.total_drive_time || 0) + (stat.total_drive_time || 0),
      total_visits: (acc.total_visits || 0) + (stat.total_visits || 0),
      total_miles: parseFloat(acc.total_miles?.toString() || '0') + parseFloat(stat.total_miles?.toString() || '0'),
      total_visit_time: (acc.total_visit_time || 0) + (stat.total_visit_time || 0),
      total_cost: parseFloat(acc.total_cost?.toString() || '0') + parseFloat(stat.total_cost?.toString() || '0')
    }), {
      total_drive_time: 0,
      total_visits: 0,
      total_miles: 0,
      total_visit_time: 0,
      total_cost: 0
    }) || {
      total_drive_time: 0,
      total_visits: 0,
      total_miles: 0,
      total_visit_time: 0,
      avg_visit_duration: 0,
      efficiency_score: 0,
      cost_per_mile: 0.67,
      total_cost: 0
    }

    if (weekStats.total_visits > 0) {
      weekStats.avg_visit_duration = parseFloat((weekStats.total_visit_time / weekStats.total_visits).toFixed(2))
    }
    if (weekStats.total_visit_time > 0 && weekStats.total_drive_time > 0) {
      weekStats.efficiency_score = Math.round((weekStats.total_visit_time / (weekStats.total_visit_time + weekStats.total_drive_time)) * 100)
    }
    // Note: cost_per_mile will be set from staff table below

    // Get today's visits (both completed and in_progress) - ordered by start_time ascending to calculate drive time between visits
    const { data: todayVisits } = await supabase
      .from('staff_visits')
      .select('id, patient_name, patient_address, start_time, end_time, duration, drive_time_to_visit, distance_to_visit, visit_type, status, visit_location, scheduled_time, cancel_reason')
      .eq('staff_id', staffId)
      .gte('start_time', `${today}T00:00:00`)
      .lt('start_time', `${today}T23:59:59`)
      .order('start_time', { ascending: true }) // Order ascending to calculate drive time between visits

    // Get current trip status
    const { data: activeTrip } = await supabase
      .from('staff_trips')
      .select('id, status, start_time')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .single()

    // Get staff info with cost per mile
    const { data: staff } = await supabase
      .from('staff')
      .select('id, name, department, cost_per_mile')
      .eq('id', staffId)
      .single()

    // Get staff's cost per mile (customizable), or use stats value, or default to 0.67
    const staffCostPerMile = parseFloat(staff?.cost_per_mile?.toString() || '0')
    const statsCostPerMile = todayStats ? parseFloat(todayStats.cost_per_mile?.toString() || '0') : 0
    const defaultCostPerMile = staffCostPerMile > 0 ? staffCostPerMile : (statsCostPerMile > 0 ? statsCostPerMile : 0.67)

    const todayStatsFormatted = todayStats ? {
      totalDriveTime: todayStats.total_drive_time || 0,
      totalVisits: todayStats.total_visits || 0,
      totalMiles: parseFloat(todayStats.total_miles?.toString() || '0'),
      totalVisitTime: todayStats.total_visit_time || 0,
      avgVisitDuration: parseFloat(todayStats.avg_visit_duration?.toString() || '0'),
      efficiencyScore: todayStats.efficiency_score || 0,
      costPerMile: defaultCostPerMile,
      totalCost: parseFloat(todayStats.total_cost?.toString() || '0')
    } : {
      totalDriveTime: 0,
      totalVisits: 0,
      totalMiles: 0,
      totalVisitTime: 0,
      avgVisitDuration: 0,
      efficiencyScore: 0,
      costPerMile: defaultCostPerMile,
      totalCost: 0
    }

    const weekStatsFormatted = {
      totalDriveTime: weekStats.total_drive_time || 0,
      totalVisits: weekStats.total_visits || 0,
      totalMiles: parseFloat(weekStats.total_miles?.toString() || '0'),
      totalVisitTime: weekStats.total_visit_time || 0,
      avgVisitDuration: weekStats.avg_visit_duration || 0,
      efficiencyScore: weekStats.efficiency_score || 0,
      costPerMile: defaultCostPerMile, // Use same cost per mile for consistency
      totalCost: parseFloat(weekStats.total_cost?.toString() || '0')
    }

    return NextResponse.json({
      success: true,
      staff: staff ? {
        id: staff.id,
        name: staff.name,
        role: staff.department || 'Staff'
      } : null,
      status: activeTrip ? 'on_visit' : 'active',
      todayStats: todayStatsFormatted,
      weekStats: weekStatsFormatted,
      visits: (todayVisits || []).map((v, index) => {
        // Calculate duration if visit is still in progress
        let visitDuration = v.duration || 0
        if (v.status === 'in_progress' && !v.duration) {
          const startTime = new Date(v.start_time)
          const now = new Date()
          visitDuration = Math.round((now.getTime() - startTime.getTime()) / 60000)
        }
        
        // Use the saved drive_time_to_visit value (calculated when Start Visit button was clicked)
        // This is the accurate drive time from trip end location to visit location
        // DO NOT use time difference calculation as it's inaccurate (includes visit duration, breaks, etc.)
        let driveTime = v.drive_time_to_visit || 0
        
        // Only calculate from previous visit location if drive_time_to_visit is 0 AND we have location data
        // This is a fallback only, but the saved value should always be used when available
        if (driveTime === 0 && index > 0) {
          const previousVisit = todayVisits[index - 1]
          if (previousVisit?.visit_location && v.visit_location) {
            const prevLoc = previousVisit.visit_location as any
            const currLoc = v.visit_location as any
            const prevLat = prevLoc.lat || 0
            const prevLng = prevLoc.lng || 0
            const currLat = currLoc.lat || 0
            const currLng = currLoc.lng || 0
            
            if (prevLat && prevLng && currLat && currLng) {
              // Calculate distance using Haversine formula
              const R = 3959 // Earth radius in miles
              const dLat = (currLat - prevLat) * Math.PI / 180
              const dLon = (currLng - prevLng) * Math.PI / 180
              const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(prevLat * Math.PI / 180) * Math.cos(currLat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
              const distance = R * c
              
              // Estimate drive time (assuming average speed of 25 mph for city driving)
              driveTime = Math.round((distance / 25) * 60)
            }
          }
        }
        
        // DO NOT use time difference - it's inaccurate because it includes:
        // - Visit duration at previous location
        // - Breaks between visits
        // - Other activities
        // Only use the saved drive_time_to_visit value which is calculated accurately
        
        return {
          id: v.id,
          patientName: v.patient_name,
          address: v.patient_address,
          startTime: new Date(v.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          endTime: v.end_time ? new Date(v.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
          start_time: v.start_time ? new Date(v.start_time).toISOString() : null, // Include raw start_time for real-time calculation
          end_time: v.end_time ? new Date(v.end_time).toISOString() : null, // Include raw end_time
          duration: visitDuration,
          driveTime: driveTime, // Use saved drive_time_to_visit (calculated when Start Visit was clicked)
          distance: parseFloat(v.distance_to_visit?.toString() || '0'),
          visitType: v.visit_type,
          status: v.status,
          visit_location: v.visit_location, // Include visit location for ETA calculation
          scheduled_time: v.scheduled_time ? new Date(v.scheduled_time).toISOString() : null,
          cancelReason: v.cancel_reason || null // Include cancel reason for cancelled visits
        }
      }).reverse() // Reverse to show most recent first
    })
  } catch (error: any) {
    console.error("Error fetching performance stats:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch performance stats" }, { status: 500 })
  }
}

