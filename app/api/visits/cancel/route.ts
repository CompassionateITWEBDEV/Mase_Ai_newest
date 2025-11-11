import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { visitId, reason } = await request.json()

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
      return NextResponse.json({ 
        error: `Visit cannot be cancelled. Current status: ${visit.status}` 
      }, { status: 400 })
    }

    // Update visit to cancelled
    const endTime = new Date()
    const startTime = new Date(visit.start_time)
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

    // Update visit
    const { data: updatedVisit, error: updateError } = await supabase
      .from('staff_visits')
      .update({
        end_time: endTime.toISOString(),
        duration: durationMinutes,
        notes: reason ? `CANCELLED: ${reason}` : 'CANCELLED',
        status: 'cancelled'
      })
      .eq('id', visitId)
      .select()
      .single()

    if (updateError) {
      console.error('Error cancelling visit:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Visit cancelled successfully",
      visit: {
        id: updatedVisit.id,
        status: updatedVisit.status,
        endTime: updatedVisit.end_time
      }
    })
  } catch (error: any) {
    console.error("Error cancelling visit:", error)
    return NextResponse.json({ error: error.message || "Failed to cancel visit" }, { status: 500 })
  }
}

