import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('id')

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get staff details using staff ID from URL
    console.log('🔍 [STAFF API] Fetching staff with ID:', staffId)
    
    const { data: staff, error } = await supabase
      .from('staff')
      .select('id, name, role_id, email, cost_per_mile')
      .eq('id', staffId)
      .single()

    if (error) {
      console.error('❌ [STAFF API] Error fetching staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!staff) {
      console.error('❌ [STAFF API] Staff not found for ID:', staffId)
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    console.log('✅ [STAFF API] Staff found:', {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role_id
    })

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role_id,
        costPerMile: staff.cost_per_mile
      }
    })
  } catch (error: any) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch staff" }, { status: 500 })
  }
}

