import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffName = searchParams.get('staff_name') || ''
    const staffId = searchParams.get('staff_id') || ''

    if (!staffName && !staffId) {
      return NextResponse.json({ 
        error: "Please provide either staff_name or staff_id" 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // First, find the staff member
    let staffQuery = supabase
      .from('staff')
      .select('id, name, email')
    
    if (staffId) {
      staffQuery = staffQuery.eq('id', staffId)
    } else {
      staffQuery = staffQuery.ilike('name', `%${staffName}%`)
    }

    const { data: staffMembers, error: staffError } = await staffQuery

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    if (!staffMembers || staffMembers.length === 0) {
      return NextResponse.json({ 
        error: `No staff found with name "${staffName}" or id "${staffId}"` 
      }, { status: 404 })
    }

    const results = await Promise.all(
      staffMembers.map(async (staff) => {
        // Get ALL visits for this staff (no filters)
        const { data: allVisits, error: visitsError } = await supabase
          .from('staff_visits')
          .select('id, patient_name, patient_address, visit_location, scheduled_time, start_time, status, trip_id, created_at')
          .eq('staff_id', staff.id)
          .order('created_at', { ascending: false })
          .limit(50) // Get last 50 visits

        if (visitsError) {
          return {
            staff: staff,
            error: visitsError.message,
            visits: []
          }
        }

        // Analyze each visit
        const analyzedVisits = (allVisits || []).map(visit => {
          const loc = visit.visit_location as any
          const lat = loc?.lat || (Array.isArray(loc) ? loc[0] : null)
          const lng = loc?.lng || (Array.isArray(loc) ? loc[1] : null)
          const hasValidLocation = lat && lng && !isNaN(parseFloat(lat?.toString() || '')) && !isNaN(parseFloat(lng?.toString() || ''))

          return {
            id: visit.id,
            patient_name: visit.patient_name,
            patient_address: visit.patient_address,
            status: visit.status,
            scheduled_time: visit.scheduled_time,
            start_time: visit.start_time,
            created_at: visit.created_at,
            has_visit_location: !!visit.visit_location,
            visit_location_raw: visit.visit_location,
            has_valid_location: hasValidLocation,
            latitude: lat,
            longitude: lng,
            would_appear_in_optimization: hasValidLocation && visit.status !== 'completed' && visit.status !== 'cancelled'
          }
        })

        return {
          staff: staff,
          total_visits: allVisits?.length || 0,
          visits: analyzedVisits,
          visits_with_location: analyzedVisits.filter(v => v.has_valid_location).length,
          visits_for_optimization: analyzedVisits.filter(v => v.would_appear_in_optimization).length
        }
      })
    )

    return NextResponse.json({
      success: true,
      debug: results
    })
  } catch (error: any) {
    console.error("Debug visits error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to debug visits" 
    }, { status: 500 })
  }
}

