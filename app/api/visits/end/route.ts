import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { visitId, notes } = await request.json()

    if (!visitId) {
      return NextResponse.json({ error: "Visit ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get visit
    const { data: visit, error: visitError } = await supabase
      .from('staff_visits')
      .select('*')
      .eq('id', visitId)
      .single()

    if (visitError || !visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 })
    }

    if (visit.status !== 'in_progress') {
      return NextResponse.json({ error: "Visit is not in progress" }, { status: 400 })
    }

    // Calculate duration
    const endTime = new Date()
    const startTime = new Date(visit.start_time)
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    // Update visit
    const { data: updatedVisit, error: updateError } = await supabase
      .from('staff_visits')
      .update({
        end_time: endTime.toISOString(),
        duration: durationMinutes,
        notes: notes || null,
        status: 'completed'
      })
      .eq('id', visitId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating visit:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update performance stats
    await updatePerformanceStats(visit.staff_id, durationMinutes)

    return NextResponse.json({
      success: true,
      message: "Visit ended successfully",
      visit: {
        id: updatedVisit.id,
        duration: updatedVisit.duration,
        endTime: updatedVisit.end_time
      }
    })
  } catch (error: any) {
    console.error("Error ending visit:", error)
    return NextResponse.json({ error: error.message || "Failed to end visit" }, { status: 500 })
  }
}

async function updatePerformanceStats(staffId: string, visitDuration: number) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const today = new Date().toISOString().split('T')[0]
  
  // Get or create today's stats
  const { data: existing } = await supabase
    .from('staff_performance_stats')
    .select('*')
    .eq('staff_id', staffId)
    .eq('date', today)
    .eq('period', 'day')
    .single()

  if (existing) {
    const totalVisits = (existing.total_visits || 0) + 1
    const totalVisitTime = (existing.total_visit_time || 0) + visitDuration
    const avgDuration = totalVisitTime / totalVisits

    await supabase
      .from('staff_performance_stats')
      .update({
        total_visits: totalVisits,
        total_visit_time: totalVisitTime,
        avg_visit_duration: parseFloat(avgDuration.toFixed(2)),
        // Calculate efficiency score (higher is better: more visit time vs drive time)
        efficiency_score: existing.total_drive_time 
          ? Math.min(100, Math.round((totalVisitTime / (totalVisitTime + existing.total_drive_time)) * 100))
          : 100,
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
        total_visits: 1,
        total_visit_time: visitDuration,
        avg_visit_duration: visitDuration,
        efficiency_score: 100
      })
  }
}

