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
    const providedStaffId = body?.staffId || headerUserId

    if (!providedStaffId || !evaluationType || !assessmentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseRW = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Resolve staff_id to actual UUID from staff table
    let staffIdUuid = providedStaffId
    const isValidUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(str)
    }

    // If not a valid UUID, try to find the staff member
    if (!isValidUUID(providedStaffId)) {
      console.log('🔵 [Self-Evaluation] Resolving staff_id to UUID:', providedStaffId)
      
      // Try to find staff by user_id (if providedStaffId is a user_id from auth)
      const { data: staffByUserId } = await supabaseRW
        .from('staff')
        .select('id')
        .eq('user_id', providedStaffId)
        .maybeSingle()
      
      if (staffByUserId?.id && isValidUUID(staffByUserId.id)) {
        staffIdUuid = staffByUserId.id
        console.log('✅ [Self-Evaluation] Resolved via user_id:', staffIdUuid)
      } else {
        // Try to find by email (if providedStaffId is an email)
        const { data: staffByEmail } = await supabaseRW
          .from('staff')
          .select('id')
          .eq('email', providedStaffId)
          .maybeSingle()
        
        if (staffByEmail?.id && isValidUUID(staffByEmail.id)) {
          staffIdUuid = staffByEmail.id
          console.log('✅ [Self-Evaluation] Resolved via email:', staffIdUuid)
        } else {
          // Try direct match (case where it's stored as string UUID but passed as string "1")
          const { data: staffDirect } = await supabaseRW
            .from('staff')
            .select('id')
            .eq('id', providedStaffId)
            .maybeSingle()
          
          if (staffDirect?.id && isValidUUID(staffDirect.id)) {
            staffIdUuid = staffDirect.id
            console.log('✅ [Self-Evaluation] Resolved via direct match:', staffIdUuid)
          } else {
            // If it's numeric, try to find by index (last resort, not recommended)
            if (!isNaN(parseInt(providedStaffId, 10))) {
              const { data: allStaff } = await supabaseRW
                .from('staff')
                .select('id')
                .order('created_at', { ascending: false })
              
              const numericIndex = parseInt(providedStaffId, 10) - 1
              if (allStaff && allStaff.length > numericIndex && numericIndex >= 0) {
                const indexedStaff = allStaff[numericIndex]
                if (indexedStaff?.id && isValidUUID(indexedStaff.id)) {
                  staffIdUuid = indexedStaff.id
                  console.warn('⚠️ [Self-Evaluation] Resolved via numeric index (not recommended):', staffIdUuid)
                }
              }
            }
            
            // If still not resolved, log error
            if (!isValidUUID(staffIdUuid)) {
              console.error('❌ [Self-Evaluation] Could not resolve staff_id to UUID:', providedStaffId)
              return NextResponse.json({ 
                error: `Invalid staff_id: "${providedStaffId}". Could not resolve to valid UUID. Please ensure you are logged in with a valid staff account.` 
              }, { status: 400 })
            }
          }
        }
      }
    }

    console.log('🔵 [Self-Evaluation] Using staff_id:', staffIdUuid)

    const common = {
      staff_id: staffIdUuid, // Use resolved UUID
      evaluation_type: evaluationType,
      assessment_type: assessmentType,
      responses,
      completion_percentage: Math.round(completionPercentage) || 0,
      last_modified: new Date().toISOString(),
      due_date: dueDate || null,
    }

    if (action === "submit") {
      // Check if evaluation already exists and is already submitted
      if (id) {
        const { data: existing } = await supabaseRW
          .from("staff_self_evaluations")
          .select("id, status")
          .eq("id", id)
          .maybeSingle()
        
        if (existing && (existing.status === "submitted" || existing.status === "approved")) {
          return NextResponse.json({ 
            error: "This evaluation has already been submitted and cannot be resubmitted.",
            evaluation: existing 
          }, { status: 400 })
        }
      }
      
      const payload = {
        ...common,
        status: "submitted" as const,
        submitted_at: new Date().toISOString(),
        competency_evaluation_id: body?.competencyEvaluationId || null,
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
      
      // Double-check after upsert to ensure status is correct
      if (data?.id) {
        const { data: verify } = await supabaseRW
          .from("staff_self_evaluations")
          .select("status")
          .eq("id", data.id)
          .maybeSingle()
        
        if (verify && verify.status !== "submitted" && verify.status !== "approved") {
          console.warn('⚠️ [Submit] Status mismatch after submit:', verify.status)
        }
      }

      // If this is a competency self-evaluation linked to a competency evaluation, sync scores
      if (evaluationType === "competency" && data?.competency_evaluation_id && data?.responses) {
        await syncSelfAssessmentScores(data.competency_evaluation_id, staffId, data.responses, supabaseRW)
      }

      // Update competency evaluation status
      if (data?.competency_evaluation_id) {
        await supabaseRW
          .from("staff_competency_evaluations")
          .update({ self_evaluation_status: "submitted" })
          .eq("id", data.competency_evaluation_id)
      }

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

    if (action === "approve-with-score") {
      const { reviewerNotes, overallScore, supervisorScore } = body || {}
      const approverId = request.headers.get("x-user-id") || request.headers.get("x-staff-id") || null
      
      // Get approver name from staff table
      let approverName = 'Supervisor'
      if (approverId) {
        try {
          const { data: approver } = await supabaseRW
            .from('staff')
            .select('name')
            .or(`id.eq.${approverId},user_id.eq.${approverId}`)
            .maybeSingle()
          if (approver?.name) approverName = approver.name
        } catch (e) {
          console.warn('Could not fetch approver name:', e)
        }
      }

      const updateData: any = {
        status: "approved",
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        reviewer_notes: reviewerNotes || null,
        updated_at: new Date().toISOString()
      }

      // Add overall_score if provided (may need to be added to schema)
      if (overallScore !== undefined) {
        updateData.overall_score = overallScore
      }

      const { data, error } = await supabaseRW
        .from("staff_self_evaluations")
        .update(updateData)
        .eq("id", id)
        .select()
        .maybeSingle()
      
      if (error) {
        console.error('❌ [Approve with Score] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        evaluation: { 
          ...data, 
          overall_score: overallScore,
          approved_by_name: approverName 
        } 
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update evaluation" }, { status: 500 })
  }
}

// Helper function to sync self-assessment scores to competency skills
async function syncSelfAssessmentScores(
  competencyEvaluationId: string,
  staffId: string,
  responses: Record<string, any>,
  supabase: any
) {
  try {
    // Get all skills for this evaluation
    const { data: areas } = await supabase
      .from('staff_competency_areas')
      .select('id, category_name')
      .eq('evaluation_id', competencyEvaluationId)

    if (!areas || areas.length === 0) return

    // Map responses to skills
    for (const area of areas) {
      const { data: skills } = await supabase
        .from('staff_competency_skills')
        .select('id, skill_name')
        .eq('area_id', area.id)

      if (!skills) continue

      for (const skill of skills) {
        // Try to find matching response
        // Responses are stored as question IDs, we need to match skill names to question IDs
        // This is a simplified mapping - you may need to adjust based on your question IDs
        const skillKey = skill.skill_name.toLowerCase().replace(/\s+/g, '-')
        const responseValue = responses[skillKey] || responses[skill.id] || responses[skill.skill_name]

        if (responseValue !== undefined && responseValue !== null) {
          // Convert response to score (assuming 1-5 scale, convert to 0-100)
          let selfScore = 0
          if (typeof responseValue === 'number') {
            selfScore = Math.round((responseValue / 5) * 100) // Convert 1-5 to 0-100
          } else if (typeof responseValue === 'string') {
            const numValue = parseInt(responseValue, 10)
            if (!isNaN(numValue)) {
              selfScore = Math.round((numValue / 5) * 100)
            }
          }

          // Update skill with self-assessment score
          await supabase
            .from('staff_competency_skills')
            .update({
              self_assessment_score: selfScore,
              last_assessed: new Date().toISOString().split("T")[0]
            })
            .eq('id', skill.id)
        }
      }
    }
  } catch (error) {
    console.error('Error syncing self-assessment scores:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providedStaffId =
      searchParams.get("staffId") || request.headers.get("x-user-id") || request.headers.get("x-staff-id") || undefined
    const evaluationType = searchParams.get("evaluationType")
    const status = searchParams.get("status")
    const competencyEvaluationId = searchParams.get("competencyEvaluationId")

    const supabaseRO = createClient(supabaseUrl, supabaseAnonKey)
    
    // Resolve staff_id to UUID if provided
    let staffIdUuid = providedStaffId
    if (providedStaffId) {
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
      }

      if (!isValidUUID(providedStaffId)) {
        // Try to resolve using service key for lookup
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
        
        // Try user_id lookup
        const { data: staffByUserId } = await supabaseService
          .from('staff')
          .select('id')
          .eq('user_id', providedStaffId)
          .maybeSingle()
        
        if (staffByUserId?.id && isValidUUID(staffByUserId.id)) {
          staffIdUuid = staffByUserId.id
        } else {
          // Try email lookup
          const { data: staffByEmail } = await supabaseService
            .from('staff')
            .select('id')
            .eq('email', providedStaffId)
            .maybeSingle()
          
          if (staffByEmail?.id && isValidUUID(staffByEmail.id)) {
            staffIdUuid = staffByEmail.id
          }
        }
      }
    }
    
    // Select all columns - we'll manually get approver name if needed
    let query = supabaseRO
      .from("staff_self_evaluations")
      .select("*")
      .order("updated_at", { ascending: false })

    if (staffIdUuid) query = query.eq("staff_id", staffIdUuid)
    if (evaluationType) query = query.eq("evaluation_type", evaluationType)
    if (status) query = query.eq("status", status)
    if (competencyEvaluationId) query = query.eq("competency_evaluation_id", competencyEvaluationId)

    const { data, error } = await query
    if (error) {
      console.error('❌ [GET Self-Evaluations] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get approver names for evaluations that have been approved
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const approverIds = Array.from(new Set(
      (data || []).filter((e: any) => e.approved_by).map((e: any) => e.approved_by)
    ))
    
    const approverMap: Record<string, string> = {}
    if (approverIds.length > 0) {
      try {
        const { data: approvers } = await supabaseService
          .from('staff')
          .select('id, name, user_id')
          .or(approverIds.map((id: string) => `id.eq.${id},user_id.eq.${id}`).join(','))
        
        if (approvers) {
          approvers.forEach((approver: any) => {
            approverMap[approver.id] = approver.name
            if (approver.user_id) approverMap[approver.user_id] = approver.name
          })
        }
      } catch (e) {
        console.warn('Could not fetch approver names:', e)
      }
    }

    // Transform data to include approver name and ensure overall_score is included
    const transformed = (data || []).map((evaluation: any) => ({
      ...evaluation,
      approved_by_name: evaluation.approved_by ? (approverMap[evaluation.approved_by] || null) : null,
      overall_score: evaluation.overall_score !== null && evaluation.overall_score !== undefined 
        ? parseFloat(evaluation.overall_score.toString()) 
        : undefined
    }))

    return NextResponse.json({ success: true, evaluations: transformed })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load evaluations" }, { status: 500 })
  }
}


