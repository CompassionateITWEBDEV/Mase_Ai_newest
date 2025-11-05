import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Helper to get service role client (bypasses RLS)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Helper to get regular client (respects RLS)
function getClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for admin operations
    const supabase = getServiceClient()

    const { trainingId, assignTo, dueDate, notes, priority } = await request.json()

    console.log("Assignment request:", { trainingId, assignTo, assignToType: typeof assignTo, isArray: Array.isArray(assignTo), dueDate })

    if (!trainingId || !assignTo || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get training details
    const { data: training } = await supabase.from("in_service_trainings").select("*").eq("id", trainingId).single()

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 })
    }

    // Determine assignment type and value
    let assignedToType = "individual"
    let assignedToValue: string | null = null
    let assignedEmployeeIds: string[] = []

    // Check if assignTo is an array (individual selection) - MUST CHECK FIRST
    if (Array.isArray(assignTo)) {
      console.log("AssignTo is array, processing individual selection:", assignTo)
      assignedToType = "individual"
      assignedToValue = "individual" // Set to "individual" instead of null
      assignedEmployeeIds = assignTo.filter((id: any) => id && typeof id === "string")
      console.log("Filtered employee IDs:", assignedEmployeeIds)
      
      if (assignedEmployeeIds.length === 0) {
        return NextResponse.json({ error: "No valid employee IDs provided" }, { status: 400 })
      }
    } else if (typeof assignTo === "string" || typeof assignTo === "number") {
      // Convert to string if it's a number
      const assignToStr = String(assignTo)
      console.log("AssignTo is string/number:", assignToStr)
      
      if (assignToStr === "all") {
        assignedToType = "all"
        assignedToValue = "all"
        // Get ONLY active staff members (not hired applicants)
        const { data: staffList } = await supabase
          .from("staff")
          .select("id")
          .eq("is_active", true)
        
        assignedEmployeeIds = (staffList || []).map((s: any) => s.id)
        console.log("Assigned to all STAFF members (no hired applicants):", assignedEmployeeIds.length)
      } else if (assignToStr.startsWith("role-")) {
        assignedToType = "role"
        assignedToValue = assignToStr.replace("role-", "").toUpperCase()
        console.log("Assigning by role:", assignedToValue)
        // Get ONLY active staff by role (not hired applicants)
        const { data: staffByRole } = await supabase
          .from("staff")
          .select("id")
          .eq("is_active", true)
          .or(`credentials.eq.${assignedToValue},role_id.eq.${assignedToValue}`)

        assignedEmployeeIds = (staffByRole || []).map((s: any) => s.id)
        console.log("Assigned to STAFF by role (no hired applicants):", assignedEmployeeIds.length)
      } else {
        // Single employee ID
        assignedToType = "individual"
        assignedToValue = "individual" // Set to "individual" instead of null
        assignedEmployeeIds = [assignToStr]
        console.log("Assigned to single employee:", assignToStr)
      }
    } else {
      console.error("Invalid assignTo type:", typeof assignTo, assignTo)
      return NextResponse.json({ error: `Invalid assignTo value. Expected string, array, or number, got ${typeof assignTo}` }, { status: 400 })
    }
    
    // Validate that we have employee IDs
    if (assignedEmployeeIds.length === 0) {
      return NextResponse.json({ error: "No employees found for assignment" }, { status: 400 })
    }

    // Create assignment record
    // Note: The database column is `assigned_employee_ids` (plural) which is an array type
    const assignmentData: any = {
      training_id: trainingId,
      assigned_to_type: assignedToType,
      assigned_to_value: assignedToValue || assignedToType, // Ensure no null values
      assigned_employee_ids: assignedEmployeeIds, // Use plural column name as per database schema
      assigned_by: null, // TODO: Get from auth session
      assigned_date: new Date().toISOString(),
      due_date: dueDate,
      notes: notes || "",
      priority: priority || "medium",
      status: "active",
    }
    
    console.log("Creating assignment with data:", {
      training_id: assignmentData.training_id,
      assigned_to_type: assignmentData.assigned_to_type,
      assigned_to_value: assignmentData.assigned_to_value,
      assigned_employee_id_count: assignmentData.assigned_employee_id?.length,
      due_date: assignmentData.due_date,
    })
    
    const { data: assignment, error: assignmentError } = await supabase
      .from("in_service_assignments")
      .insert(assignmentData)
      .select()
      .single()

    if (assignmentError) {
      return NextResponse.json({ error: "Failed to create assignment: " + assignmentError.message }, { status: 500 })
    }

    // Create enrollments for assigned employees
    if (assignedEmployeeIds.length > 0) {
      const enrollments = assignedEmployeeIds.map((empId) => ({
        training_id: trainingId,
        employee_id: empId,
        enrollment_date: new Date().toISOString(),
        status: "enrolled",
        progress: 0,
      }))

      await supabase.from("in_service_enrollments").insert(enrollments)
    }

    return NextResponse.json({
      success: true,
      assignment,
      message: `Training assigned to ${assignedEmployeeIds.length} employees`,
    })
  } catch (error) {
    console.error("Error creating assignment:", error)
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("=== GET /api/in-service/assignments - START ===")
    
    // Use service role client to bypass RLS for admin operations
    const supabase = getServiceClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const trainingId = searchParams.get("trainingId")

    console.log("Query params:", { status, trainingId })

    // Build query
    let query = supabase
      .from("in_service_assignments")
      .select("*, in_service_trainings(*)")
      .order("assigned_date", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (trainingId) {
      query = query.eq("training_id", trainingId)
    }

    console.log("Executing assignments query...")
    const { data: assignments, error } = await query

    if (error) {
      console.error("Error fetching assignments:", error)
      return NextResponse.json({ error: "Failed to fetch assignments: " + error.message }, { status: 500 })
    }

    console.log(`Found ${assignments?.length || 0} assignments`)

    // Calculate completion stats for each assignment
    const assignmentsWithStats = await Promise.all(
      (assignments || []).map(async (assignment: any) => {
        console.log(`Processing assignment ${assignment.id}:`, {
          training_id: assignment.training_id,
          assigned_to_type: assignment.assigned_to_type,
          assigned_employee_ids_count: assignment.assigned_employee_ids?.length || 0,
        })
        
        // Get enrollments for this assignment
        // Note: Database column is `assigned_employee_ids` (plural, array type)
        let employeeIds = Array.isArray(assignment.assigned_employee_ids) 
          ? assignment.assigned_employee_ids 
          : []

        if (employeeIds.length === 0 && assignment.assigned_to_type === "all") {
          console.log("Assignment is for all employees, fetching all employee IDs...")
          // Get all employees
          const { data: staffList } = await supabase.from("staff").select("id").eq("is_active", true)
          const { data: hiredApps } = await supabase
            .from("job_applications")
            .select("applicant_id")
            .in("status", ["accepted", "hired"])

          const applicantIds = Array.from(new Set((hiredApps || []).map((a: any) => a.applicant_id).filter(Boolean)))
          employeeIds = [
            ...(staffList || []).map((s: any) => s.id),
            ...(applicantIds as string[]),
          ]
          console.log(`Found ${employeeIds.length} total employees (${staffList?.length || 0} staff + ${applicantIds.length} applicants)`)
        } else if (assignment.assigned_to_type === "role" && assignment.assigned_to_value) {
          console.log(`Assignment is for role: ${assignment.assigned_to_value}`)
          // Get employees by role
          const { data: staffByRole } = await supabase
            .from("staff")
            .select("id")
            .eq("is_active", true)
            .or(`credentials.eq.${assignment.assigned_to_value},role_id.eq.${assignment.assigned_to_value}`)

          const { data: applicantsByProfession } = await supabase
            .from("applicants")
            .select("id")
            .eq("profession", assignment.assigned_to_value)

          employeeIds = [
            ...(staffByRole || []).map((s: any) => s.id),
            ...(applicantsByProfession || []).map((a: any) => a.id),
          ]
          console.log(`Found ${employeeIds.length} employees for role ${assignment.assigned_to_value}`)
        }

        // Get enrollments for these employees
        let enrollments: any[] = []
        if (employeeIds.length > 0) {
          const { data: enrollmentsData, error: enrollError } = await supabase
            .from("in_service_enrollments")
            .select("*")
            .eq("training_id", assignment.training_id)
            .in("employee_id", employeeIds)
          
          if (enrollError) {
            console.error(`Error fetching enrollments for assignment ${assignment.id}:`, enrollError)
          } else {
            enrollments = enrollmentsData || []
          }
        }

        const total = employeeIds.length
        const completed = enrollments?.filter((e: any) => e.status === "completed").length || 0
        const inProgress = enrollments?.filter((e: any) => e.status === "in_progress").length || 0
        const notStarted = total - completed - inProgress
        
        // Debug: Log enrollment statuses
        console.log(`[ASSIGNMENT ${assignment.id}] Enrollment statuses:`, {
          total: enrollments.length,
          statuses: enrollments.map((e: any) => ({ id: e.id, status: e.status, progress: e.progress }))
        })
        
        console.log(`[ASSIGNMENT ${assignment.id}] Completion stats:`, {
          totalEmployees: total,
          completed,
          inProgress,
          notStarted,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        })

        // Get employee names for individual assignments (for display)
        let employeeNames: string[] = []
        if (assignment.assigned_to_type === "individual" && employeeIds.length > 0 && employeeIds.length <= 10) {
          // Only fetch names if 10 or fewer employees (to avoid performance issues)
          const { data: staffList } = await supabase
            .from("staff")
            .select("id, name")
            .in("id", employeeIds)
          
          const { data: applicantsList } = await supabase
            .from("applicants")
            .select("id, first_name, last_name")
            .in("id", employeeIds)
          
          employeeNames = [
            ...(staffList || []).map((s: any) => s.name),
            ...(applicantsList || []).map((a: any) => `${a.first_name} ${a.last_name}`.trim()),
          ]
        }

        return {
          id: assignment.id,
          trainingId: assignment.training_id,
          trainingTitle: assignment.in_service_trainings?.title || "",
          assignedEmployees: employeeIds,
          assignedEmployeeNames: employeeNames, // For display purposes
          assignedBy: assignment.assigned_by,
          assignedDate: assignment.assigned_date,
          dueDate: assignment.due_date,
          notes: assignment.notes || "",
          priority: assignment.priority || "medium",
          status: assignment.status || "active",
          assignedToType: assignment.assigned_to_type || "individual",
          assignedToValue: assignment.assigned_to_value || null,
          completionStats: {
            total,
            completed,
            inProgress,
            notStarted,
          },
        }
      }),
    )

    // Calculate summary
    const summary = {
      totalAssignments: assignmentsWithStats.length,
      activeAssignments: assignmentsWithStats.filter((a) => a.status === "active").length,
      completedAssignments: assignmentsWithStats.filter((a) => a.status === "completed").length,
      totalEmployeesAssigned: assignmentsWithStats.reduce((sum, a) => sum + a.completionStats.total, 0),
      totalCompletions: assignmentsWithStats.reduce((sum, a) => sum + a.completionStats.completed, 0),
    }

    console.log(`Returning ${assignmentsWithStats.length} assignments with stats`)
    console.log("Summary:", summary)
    
    return NextResponse.json({
      success: true,
      assignments: assignmentsWithStats || [],
      total: assignmentsWithStats.length,
      summary,
    })
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for admin operations
    const supabase = getServiceClient()

    const { assignmentId, action, data } = await request.json()

    if (!assignmentId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let result: any = {}

    switch (action) {
      case "extend_deadline":
        const { data: updatedDeadline, error: deadlineError } = await supabase
          .from("in_service_assignments")
          .update({
            due_date: data.dueDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignmentId)
          .select()
          .single()

        if (deadlineError) {
          return NextResponse.json({ error: "Failed to extend deadline: " + deadlineError.message }, { status: 500 })
        }

        result = updatedDeadline
        break

      case "add_employees":
        const { data: currentAssignment } = await supabase
          .from("in_service_assignments")
          .select("*")
          .eq("id", assignmentId)
          .single()

        if (!currentAssignment) {
          return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }

        const newEmployeeIds = data.employees || []
        const existingIds = currentAssignment.assigned_employee_ids || []
        const updatedIds = [...new Set([...existingIds, ...newEmployeeIds])]

        const { data: updatedAssignment } = await supabase
          .from("in_service_assignments")
          .update({
            assigned_employee_ids: updatedIds, // Use plural column name
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignmentId)
          .select()
          .single()

        // Create enrollments for new employees
        if (newEmployeeIds.length > 0) {
          const enrollments = newEmployeeIds.map((empId: string) => ({
            training_id: currentAssignment.training_id,
            employee_id: empId,
            enrollment_date: new Date().toISOString(),
            status: "enrolled",
            progress: 0,
          }))

          await supabase.from("in_service_enrollments").insert(enrollments)
        }

        result = updatedAssignment
        break

      case "remove_employees":
        const { data: assignmentToUpdate } = await supabase
          .from("in_service_assignments")
          .select("*")
          .eq("id", assignmentId)
          .single()

        if (!assignmentToUpdate) {
          return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
        }

        const removeEmployeeIds = data.employees || []
        const currentIds = assignmentToUpdate.assigned_employee_ids || []
        const filteredIds = currentIds.filter((id: string) => !removeEmployeeIds.includes(id))

        const { data: updatedAfterRemove } = await supabase
          .from("in_service_assignments")
          .update({
            assigned_employee_ids: filteredIds, // Use plural column name
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignmentId)
          .select()
          .single()

        result = updatedAfterRemove
        break

      case "cancel":
        const { data: cancelledAssignment } = await supabase
          .from("in_service_assignments")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignmentId)
          .select()
          .single()

        result = cancelledAssignment
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Assignment ${action} successful`,
    })
  } catch (error) {
    console.error("Error updating assignment:", error)
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
  }
}
