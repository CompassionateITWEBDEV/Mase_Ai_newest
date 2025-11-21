import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get all staff to see what's in the database
    const { data: allStaff, error } = await supabase
      .from('staff')
      .select('id, name, email, role_id, is_active')
      .limit(10)

    if (error) {
      console.error('Error fetching all staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: allStaff?.length || 0,
      staff: allStaff || [],
      message: 'Use one of these IDs in the URL: /track/[staff-id]'
    })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 })
  }
}

