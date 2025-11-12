import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d' // 1d, 7d, 30d, 90d
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
    }
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Get all staff performance stats for the date range
    const { data: statsData, error: statsError } = await supabase
      .from('staff_performance_stats')
      .select('*')
      .eq('period', 'day')
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    if (statsError) {
      console.error('Error fetching stats:', statsError)
      return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
    }

    // Aggregate totals
    const totals = (statsData || []).reduce((acc, stat) => ({
      totalMiles: acc.totalMiles + parseFloat(stat.total_miles?.toString() || '0'),
      totalCost: acc.totalCost + parseFloat(stat.total_cost?.toString() || '0'),
      totalDriveTime: acc.totalDriveTime + (stat.total_drive_time || 0),
      totalVisitTime: acc.totalVisitTime + (stat.total_visit_time || 0),
      totalVisits: acc.totalVisits + (stat.total_visits || 0),
    }), {
      totalMiles: 0,
      totalCost: 0,
      totalDriveTime: 0,
      totalVisitTime: 0,
      totalVisits: 0,
    })

    // Calculate average efficiency
    const avgEfficiency = totals.totalVisitTime + totals.totalDriveTime > 0
      ? Math.round((totals.totalVisitTime / (totals.totalVisitTime + totals.totalDriveTime)) * 100)
      : 0

    // Calculate CO2 reduction (lbs) - average car emits 0.404 lbs CO2 per mile
    const co2Reduction = totals.totalMiles * 0.404

    // Get daily mileage for chart (group by date)
    const dailyMileage = (statsData || []).reduce((acc: Record<string, number>, stat) => {
      const date = stat.date
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += parseFloat(stat.total_miles?.toString() || '0')
      return acc
    }, {})

    // Get daily costs for chart
    const dailyCosts = (statsData || []).reduce((acc: Record<string, number>, stat) => {
      const date = stat.date
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += parseFloat(stat.total_cost?.toString() || '0')
      return acc
    }, {})

    // Fill in missing dates in the range for complete timeline
    const fillMissingDates = (dataMap: Record<string, number>, start: Date, end: Date): Array<{ date: string; value: number }> => {
      const result: Array<{ date: string; value: number }> = []
      const current = new Date(start)
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        result.push({
          date: dateStr,
          value: dataMap[dateStr] || 0
        })
        current.setDate(current.getDate() + 1)
      }
      
      return result
    }

    const dailyMileageFilled = fillMissingDates(dailyMileage, startDate, endDate)
    const dailyCostsFilled = fillMissingDates(dailyCosts, startDate, endDate)

    // Get staff performance breakdown
    const { data: allStaff } = await supabase
      .from('staff')
      .select('id, name, department, cost_per_mile')
      .eq('is_active', true)

    const staffPerformance = await Promise.all(
      (allStaff || []).map(async (staff) => {
        const { data: staffStats } = await supabase
          .from('staff_performance_stats')
          .select('*')
          .eq('staff_id', staff.id)
          .eq('period', 'day')
          .gte('date', startDateStr)
          .lte('date', endDateStr)

        const staffTotals = (staffStats || []).reduce((acc, stat) => ({
          miles: acc.miles + parseFloat(stat.total_miles?.toString() || '0'),
          cost: acc.cost + parseFloat(stat.total_cost?.toString() || '0'),
          driveTime: acc.driveTime + (stat.total_drive_time || 0),
          visitTime: acc.visitTime + (stat.total_visit_time || 0),
        }), { miles: 0, cost: 0, driveTime: 0, visitTime: 0 })

        const efficiency = staffTotals.visitTime + staffTotals.driveTime > 0
          ? Math.round((staffTotals.visitTime / (staffTotals.visitTime + staffTotals.driveTime)) * 100)
          : 0

        return {
          id: staff.id,
          name: staff.name,
          role: staff.department || 'Staff',
          miles: parseFloat(staffTotals.miles.toFixed(2)),
          efficiency,
          cost: parseFloat(staffTotals.cost.toFixed(2)),
        }
      })
    )

    // Sort by miles descending and filter out staff with 0 miles
    const activeStaff = staffPerformance
      .filter(s => s.miles > 0)
      .sort((a, b) => b.miles - a.miles)

    // Calculate previous period for comparison
    const prevStartDate = new Date(startDate)
    const prevEndDate = new Date(startDate)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff)
    prevEndDate.setDate(prevEndDate.getDate() - 1)

    const { data: prevStatsData } = await supabase
      .from('staff_performance_stats')
      .select('*')
      .eq('period', 'day')
      .gte('date', prevStartDate.toISOString().split('T')[0])
      .lte('date', prevEndDate.toISOString().split('T')[0])

    const prevTotals = (prevStatsData || []).reduce((acc, stat) => ({
      totalMiles: acc.totalMiles + parseFloat(stat.total_miles?.toString() || '0'),
      totalCost: acc.totalCost + parseFloat(stat.total_cost?.toString() || '0'),
    }), { totalMiles: 0, totalCost: 0 })

    // Calculate percentage changes
    const milesChange = prevTotals.totalMiles > 0
      ? ((totals.totalMiles - prevTotals.totalMiles) / prevTotals.totalMiles) * 100
      : 0
    
    const costChange = prevTotals.totalCost > 0
      ? ((totals.totalCost - prevTotals.totalCost) / prevTotals.totalCost) * 100
      : 0

    return NextResponse.json({
      success: true,
      data: {
        totalMiles: parseFloat(totals.totalMiles.toFixed(2)),
        totalCost: parseFloat(totals.totalCost.toFixed(2)),
        avgEfficiency,
        totalHours: parseFloat((totals.totalDriveTime / 60).toFixed(1)),
        co2Reduction: parseFloat(co2Reduction.toFixed(2)),
        milesChange: parseFloat(milesChange.toFixed(1)),
        costChange: parseFloat(costChange.toFixed(1)),
        dailyMileage: dailyMileageFilled.map(({ date, value }) => ({ 
          date, 
          miles: parseFloat(value.toFixed(2)) 
        })),
        dailyCosts: dailyCostsFilled.map(({ date, value }) => ({ 
          date, 
          cost: parseFloat(value.toFixed(2)) 
        })),
        staffPerformance: activeStaff,
      }
    })
  } catch (error: any) {
    console.error("Error fetching GPS analytics:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message || "Failed to fetch GPS analytics"
    }, { status: 500 })
  }
}
