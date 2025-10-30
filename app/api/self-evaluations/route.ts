import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action, // 'save-draft' | 'submit'
      id, // optional for updates
      // staffId intentionally optional; we derive from headers if missing
      evaluationType, // 'performance' | 'competency'
      assessmentType, // 'annual' | 'mid-year' | 'probationary' | 'initial' | 'skills-validation'
      responses = {},
      completionPercentage = 0,
      dueDate,
    } = body || {}

    // Prefer body, fallback to headers to avoid requiring clients to predefine staff_id in payload
    const headerUserId = request.headers.get("x-user-id") || request.headers.get("x-staff-id") || undefined
    const staffId = body?.staffId || headerUserId

    if (!staffId || !evaluationType || !assessmentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseRW = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const common = {
      staff_id: staffId,
      evaluation_type: evaluationType,
      assessment_type: assessmentType,
      responses,
      completion_percentage: Math.round(completionPercentage) || 0,
      last_modified: new Date().toISOString(),
      due_date: dueDate || null,
    }

    if (action === "submit") {
      const payload = {
        ...common,
        status: "submitted" as const,
        submitted_at: new Date().toISOString(),
      }
      const { data, error } = await supabaseRW
        .from("staff_self_evaluations")
        .upsert(
          {
            id: id || undefined,
            ...payload,
          },
          { onConflict: "id" }
        )
        .select()
        .maybeSingle()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, evaluation: data })
    }

    // default: save draft
    const payload = {
      ...common,
      status: "draft" as const,
    }

    const { data, error } = await supabaseRW
      .from("staff_self_evaluations")
      .upsert(
        {
          id: id || undefined,
          ...payload,
        },
        { onConflict: "id" }
      )
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, evaluation: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save evaluation" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id, reviewerNotes } = body || {}
    if (!action || !id) return NextResponse.json({ error: "Missing action or id" }, { status: 400 })

    const supabaseRW = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    if (action === "approve") {
      const approverId = request.headers.get("x-user-id") || request.headers.get("x-staff-id") || null
      const { data, error } = await supabaseRW
        .from("staff_self_evaluations")
        .update({ status: "approved", approved_by: approverId, approved_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, evaluation: data })
    }

    if (action === "add-notes") {
      const { data, error } = await supabaseRW
        .from("staff_self_evaluations")
        .update({ reviewer_notes: reviewerNotes || null })
        .eq("id", id)
        .select()
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, evaluation: data })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update evaluation" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId =
      searchParams.get("staffId") || request.headers.get("x-user-id") || request.headers.get("x-staff-id") || undefined
    const evaluationType = searchParams.get("evaluationType")
    const status = searchParams.get("status")

    const supabaseRO = createClient(supabaseUrl, supabaseAnonKey)
    let query = supabaseRO
      .from("staff_self_evaluations")
      .select("*")
      .order("updated_at", { ascending: false })

    if (staffId) query = query.eq("staff_id", staffId)
    if (evaluationType) query = query.eq("evaluation_type", evaluationType)
    if (status) query = query.eq("status", status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, evaluations: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load evaluations" }, { status: 500 })
  }
}


