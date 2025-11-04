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
    weekStats.cost_per_mile = 0.67

    // Get today's visits
    const { data: todayVisits } = await supabase
      .from('staff_visits')
      .select('id, patient_name, patient_address, start_time, end_time, duration, drive_time_to_visit, distance_to_visit, visit_type')
      .eq('staff_id', staffId)
      .gte('start_time', `${today}T00:00:00`)
      .lt('start_time', `${today}T23:59:59`)
      .order('start_time', { ascending: false })

    // Get current trip status
    const { data: activeTrip } = await supabase
      .from('staff_trips')
      .select('id, status, start_time')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .single()

    // Get staff info
    const { data: staff } = await supabase
      .from('staff')
      .select('id, name, department')
      .eq('id', staffId)
      .single()

    const todayStatsFormatted = todayStats ? {
      totalDriveTime: todayStats.total_drive_time || 0,
      totalVisits: todayStats.total_visits || 0,
      totalMiles: parseFloat(todayStats.total_miles?.toString() || '0'),
      totalVisitTime: todayStats.total_visit_time || 0,
      avgVisitDuration: parseFloat(todayStats.avg_visit_duration?.toString() || '0'),
      efficiencyScore: todayStats.efficiency_score || 0,
      costPerMile: parseFloat(todayStats.cost_per_mile?.toString() || '0.67'),
      totalCost: parseFloat(todayStats.total_cost?.toString() || '0')
    } : {
      totalDriveTime: 0,
      totalVisits: 0,
      totalMiles: 0,
      totalVisitTime: 0,
      avgVisitDuration: 0,
      efficiencyScore: 0,
      costPerMile: 0.67,
      totalCost: 0
    }

    const weekStatsFormatted = {
      totalDriveTime: weekStats.total_drive_time || 0,
      totalVisits: weekStats.total_visits || 0,
      totalMiles: parseFloat(weekStats.total_miles?.toString() || '0'),
      totalVisitTime: weekStats.total_visit_time || 0,
      avgVisitDuration: weekStats.avg_visit_duration || 0,
      efficiencyScore: weekStats.efficiency_score || 0,
      costPerMile: weekStats.cost_per_mile || 0.67,
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
      visits: (todayVisits || []).map(v => ({
        id: v.id,
        patientName: v.patient_name,
        address: v.patient_address,
        startTime: new Date(v.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        endTime: v.end_time ? new Date(v.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
        duration: v.duration || 0,
        driveTime: v.drive_time_to_visit || 0,
        distance: parseFloat(v.distance_to_visit?.toString() || '0'),
        visitType: v.visit_type
      }))
    })
  } catch (error: any) {
    console.error("Error fetching performance stats:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch performance stats" }, { status: 500 })
  }
}

