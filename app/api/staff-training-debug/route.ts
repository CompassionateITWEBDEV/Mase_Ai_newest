import { NextRequest, NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Configure runtime for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Singleton client
let serviceClient: SupabaseClient | null = null

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials")
  }

  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return serviceClient
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const email = searchParams.get("email")

    if (!employeeId && !email) {
      return NextResponse.json({
        error: "Please provide employeeId or email parameter"
      }, { status: 400 })
    }

    console.log("🔍 Debug request:", { employeeId, email })

    const supabase = getServiceClient()

    // 1. Find staff record
    let staffQuery = supabase.from("staff").select("*")
    
    if (employeeId) {
      staffQuery = staffQuery.eq("id", employeeId)
    } else if (email) {
      staffQuery = staffQuery.eq("email", email)
    }

    const { data: staff, error: staffError } = await staffQuery.single()

    if (staffError || !staff) {
      return NextResponse.json({
        error: "Staff not found",
        details: staffError?.message,
        searchCriteria: { employeeId, email },
        step: "staff_lookup"
      }, { status: 404 })
    }

    console.log("✅ Found staff:", {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role_id
    })

    // 2. Get enrollments for this staff
    const { data: enrollments, error: enrollError } = await supabase
      .from("in_service_enrollments")
      .select("*, in_service_trainings(title, category, ceu_hours)")
      .eq("employee_id", staff.id)

    console.log("📊 Enrollments found:", enrollments?.length || 0)
    console.log("Enrollments:", enrollments?.map(e => ({
      id: e.id,
      training: e.in_service_trainings?.title,
      status: e.status,
      progress: e.progress
    })))

    // 3. Get completions for this staff
    const { data: completions, error: compError } = await supabase
      .from("in_service_completions")
      .select("*, in_service_trainings(title, category)")
      .eq("employee_id", staff.id)

    console.log("✅ Completions found:", completions?.length || 0)
    console.log("Completions:", completions?.map(c => ({
      id: c.id,
      training: c.in_service_trainings?.title,
      completionDate: c.completion_date,
      score: c.score,
      ceuHours: c.ceu_hours_earned
    })))

    // 4. Get assignments for this staff
    const { data: assignments, error: assignError } = await supabase
      .from("in_service_assignments")
      .select("*, in_service_trainings(title, category)")
      .eq("status", "active")

    // Filter assignments that apply to this staff
    const applicableAssignments = (assignments || []).filter((a: any) => {
      if (a.assigned_to_type === "all") return true
      if (a.assigned_to_type === "role" && a.assigned_to_value) {
        const roleMatch = staff.role_id === a.assigned_to_value || 
                         staff.credentials === a.assigned_to_value
        return roleMatch
      }
      if (a.assigned_to_type === "individual" && Array.isArray(a.assigned_employee_ids)) {
        return a.assigned_employee_ids.includes(staff.id)
      }
      return false
    })

    console.log("📋 Assignments applicable:", applicableAssignments.length)

    // 5. Calculate completed trainings from BOTH sources
    const completedFromCompletions = (completions || []).map((c: any) => ({
      source: "completions_table",
      trainingId: c.training_id,
      trainingTitle: c.in_service_trainings?.title,
      completionDate: c.completion_date,
      score: c.score,
      ceuHours: c.ceu_hours_earned,
      certificate: c.certificate_number
    }))

    const completedFromEnrollments = (enrollments || [])
      .filter((e: any) => e.status === "completed")
      .filter((e: any) => {
        // Check if already in completions table
        const hasCompletion = (completions || []).some((c: any) => c.enrollment_id === e.id)
        return !hasCompletion
      })
      .map((e: any) => ({
        source: "enrollment_status",
        trainingId: e.training_id,
        trainingTitle: e.in_service_trainings?.title,
        completionDate: e.updated_at,
        progress: e.progress,
        ceuHours: e.in_service_trainings?.ceu_hours
      }))

    const allCompleted = [...completedFromCompletions, ...completedFromEnrollments]

    console.log("🎯 Total completed trainings:", allCompleted.length)
    console.log("  - From completions table:", completedFromCompletions.length)
    console.log("  - From enrollment status:", completedFromEnrollments.length)

    // 6. Summary
    return NextResponse.json({
      success: true,
      debug: {
        staff: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role_id,
          credentials: staff.credentials,
          isActive: staff.is_active
        },
        counts: {
          totalEnrollments: enrollments?.length || 0,
          completedEnrollments: enrollments?.filter((e: any) => e.status === "completed").length || 0,
          inProgressEnrollments: enrollments?.filter((e: any) => e.status === "in_progress").length || 0,
          enrolledOnly: enrollments?.filter((e: any) => e.status === "enrolled").length || 0,
          completionRecords: completions?.length || 0,
          applicableAssignments: applicableAssignments.length,
          totalCompletedTrainings: allCompleted.length
        },
        enrollments: enrollments?.map((e: any) => ({
          id: e.id,
          trainingId: e.training_id,
          title: e.in_service_trainings?.title,
          status: e.status,
          progress: e.progress,
          enrollmentDate: e.enrollment_date,
          startDate: e.start_date,
          lastAccessed: e.last_accessed
        })) || [],
        completions: completions?.map((c: any) => ({
          id: c.id,
          trainingId: c.training_id,
          title: c.in_service_trainings?.title,
          completionDate: c.completion_date,
          score: c.score,
          ceuHours: c.ceu_hours_earned,
          certificate: c.certificate_number,
          enrollmentId: c.enrollment_id
        })) || [],
        completedTrainings: allCompleted,
        assignments: applicableAssignments.map((a: any) => ({
          id: a.id,
          trainingId: a.training_id,
          title: a.in_service_trainings?.title,
          assignedTo: a.assigned_to_type,
          dueDate: a.due_date,
          priority: a.priority
        }))
      },
      errors: {
        enrollments: enrollError?.message || null,
        completions: compError?.message || null,
        assignments: assignError?.message || null
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("❌ Debug API error:", error)
    return NextResponse.json({
      error: "Debug failed",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}


