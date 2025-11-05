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

// Helper to get role-based annual requirement
function getRoleBasedRequirement(role: string): number {
  const roleUpper = (role || "").toUpperCase()
  
  // Different roles may have different requirements
  // You can customize these based on your organization's needs
  if (roleUpper.includes("RN") || roleUpper.includes("REGISTERED NURSE")) {
    return 20.0 // RNs typically need 20 hours
  } else if (roleUpper.includes("LPN") || roleUpper.includes("LICENSED PRACTICAL NURSE")) {
    return 20.0 // LPNs typically need 20 hours
  } else if (roleUpper.includes("PT") || roleUpper.includes("PHYSICAL THERAPIST")) {
    return 20.0 // PTs typically need 20 hours
  } else if (roleUpper.includes("PTA") || roleUpper.includes("PHYSICAL THERAPIST ASSISTANT")) {
    return 20.0 // PTAs typically need 20 hours
  } else if (roleUpper.includes("OT") || roleUpper.includes("OCCUPATIONAL THERAPIST")) {
    return 20.0 // OTs typically need 20 hours
  } else if (roleUpper.includes("CNA") || roleUpper.includes("CERTIFIED NURSING ASSISTANT")) {
    return 12.0 // CNAs typically need 12 hours
  } else {
    return 20.0 // Default for other roles
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS and ensure all data is accessible
    const supabase = getServiceClient()

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    // Get all employees (from staff table and hired applicants)
    const { data: staffList } = await supabase.from("staff").select("id, name, email, role_id, department, credentials").eq("is_active", true)
    
    // Get hired applicants
    const { data: hiredApps } = await supabase
      .from("job_applications")
      .select("applicant_id")
      .in("status", ["accepted", "hired"])

    const applicantIds = Array.from(new Set((hiredApps || []).map((a: any) => a.applicant_id).filter(Boolean)))
    
    let applicantsList: any[] = []
    if (applicantIds.length > 0) {
      const { data } = await supabase
        .from("applicants")
        .select("id, first_name, last_name, email, profession")
        .in("id", applicantIds as string[])
      applicantsList = data || []
    }

    // Get training requirements for current year
    const currentYear = new Date().getFullYear()
    const { data: requirements } = await supabase
      .from("employee_training_requirements")
      .select("*")
      .eq("year", currentYear)

    // Get all enrollments
    const { data: enrollments } = await supabase
      .from("in_service_enrollments")
      .select("*, in_service_trainings(*)")

    // Get all completions
    const { data: completions } = await supabase
      .from("in_service_completions")
      .select("*, in_service_trainings(*)")

    // Get all assignments
    const { data: assignments } = await supabase
      .from("in_service_assignments")
      .select("*, in_service_trainings(*)")
      .eq("status", "active")

    // Combine staff and applicants into employee list
    const combinedEmployees = [
      ...(staffList || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        role: s.credentials || s.role_id || "Staff",
        department: s.department || "General",
        email: s.email,
        source: "staff",
      })),
      ...(applicantsList || []).map((a: any) => ({
        id: a.id,
        name: `${a.first_name} ${a.last_name}`.trim(),
        role: a.profession || "Employee",
        department: "General",
        email: a.email,
        source: "applicant",
      })),
    ]
    
    // Deduplicate employees by ID and email
    const seenIds = new Set<string>()
    const seenEmails = new Set<string>()
    const employees = combinedEmployees.filter((emp) => {
      // Check if ID already seen
      if (seenIds.has(emp.id)) {
        console.log(`[API] Skipping duplicate employee by ID: ${emp.name} (${emp.id})`)
        return false
      }
      
      // Check if email already seen (case-insensitive)
      const emailLower = (emp.email || "").toLowerCase().trim()
      if (emailLower && seenEmails.has(emailLower)) {
        console.log(`[API] Skipping duplicate employee by email: ${emp.name} (${emailLower})`)
        return false
      }
      
      // Add to seen sets
      seenIds.add(emp.id)
      if (emailLower) {
        seenEmails.add(emailLower)
      }
      
      return true
    })
    
    console.log(`[API] Total employees after deduplication: ${employees.length} (from ${combinedEmployees.length} combined)`)
    

    // Build employee progress data
    const employeeProgress = await Promise.all(employees.map(async (emp) => {
      const req = requirements?.find((r: any) => r.employee_id === emp.id)
      const empEnrollments = enrollments?.filter((e: any) => e.employee_id === emp.id) || []
      const empCompletions = completions?.filter((c: any) => c.employee_id === emp.id) || []
      
      console.log(`[API] Processing employee ${emp.name} (${emp.id}):`, {
        enrollmentsCount: empEnrollments.length,
        completionsCount: empCompletions.length,
        totalEnrollments: enrollments?.length || 0,
        totalCompletions: completions?.length || 0,
        enrollments: empEnrollments.map((e: any) => ({
          trainingId: e.training_id,
          status: e.status,
          progress: e.progress,
        })),
      })
      
      // Filter assignments for this employee - more robust matching
      const empAssignments = (assignments || []).filter((a: any) => {
        // Check if assignment is for "all" employees
        if (a.assigned_to_type === "all") {
          return true
        }
        
        // Check if assignment is for this employee's role
        if (a.assigned_to_type === "role" && a.assigned_to_value) {
          const assignmentRole = (a.assigned_to_value || "").toUpperCase().trim()
          const empRole = (emp.role || "").toUpperCase().trim()
          
          // Check direct match
          if (assignmentRole === empRole) {
            return true
          }
          
          // Check if role contains the assignment role (e.g., "RN" in "REGISTERED NURSE")
          if (empRole.includes(assignmentRole) || assignmentRole.includes(empRole)) {
            return true
          }
          
          // For staff, check credentials and role_id separately
          if (emp.source === "staff") {
            const staffData = staffList?.find((s: any) => s.id === emp.id)
            if (staffData) {
              const credentials = (staffData.credentials || "").toUpperCase().trim()
              const roleId = (staffData.role_id || "").toUpperCase().trim()
              
              if (credentials === assignmentRole || roleId === assignmentRole) {
                return true
              }
              if (credentials.includes(assignmentRole) || assignmentRole.includes(credentials)) {
                return true
              }
            }
          }
          
          // For applicants, check profession
          if (emp.source === "applicant") {
            const applicantData = applicantsList?.find((a: any) => a.id === emp.id)
            if (applicantData) {
              const profession = (applicantData.profession || "").toUpperCase().trim()
              if (profession === assignmentRole || profession.includes(assignmentRole) || assignmentRole.includes(profession)) {
                return true
              }
            }
          }
        }
        
        // Check if assignment is for individual employees (by ID)
        if (a.assigned_to_type === "individual" && Array.isArray(a.assigned_employee_ids)) {
          return a.assigned_employee_ids.some((id: string) => id === emp.id)
        }
        
        return false
      })
      
      console.log(`[API] Employee ${emp.name} (${emp.id}) assignments:`, {
        totalAssignments: assignments?.length || 0,
        matchedAssignments: empAssignments.length,
        empRole: emp.role,
        source: emp.source,
        assignments: empAssignments.map((a: any) => ({
          trainingId: a.training_id,
          trainingTitle: a.in_service_trainings?.title,
          assignedToType: a.assigned_to_type,
        })),
      })

      // Get completed trainings
      const completedTrainings = empCompletions.map((c: any) => ({
        id: c.training_id,
        trainingId: c.training_id, // Add trainingId for frontend compatibility
        title: c.in_service_trainings?.title || "Unknown Training",
        completionDate: c.completion_date?.split("T")[0] || "",
        score: parseFloat(c.score?.toString() || "0"),
        ceuHours: parseFloat(c.ceu_hours_earned?.toString() || "0"),
        certificate: c.certificate_number || "",
        category: c.in_service_trainings?.category || "",
      }))
      
      console.log(`[API] Employee ${emp.name} completedTrainings:`, completedTrainings)

      // Get in-progress trainings (status = 'in_progress')
      const inProgressTrainings = empEnrollments
        .filter((e: any) => e.status === "in_progress")
        .map((e: any) => {
          // Find the assignment for this training to get due date and priority
          const assignment = empAssignments.find((a: any) => a.training_id === e.training_id)
          // Get completed modules and viewed files
          const completedModules = Array.isArray(e.completed_modules) 
            ? e.completed_modules 
            : (e.completed_modules ? JSON.parse(e.completed_modules) : [])
          const viewedFiles = e.viewed_files || (typeof e.viewed_files === 'string' ? JSON.parse(e.viewed_files) : {})
          const moduleQuizScores = e.module_quiz_scores || (typeof e.module_quiz_scores === 'string' ? JSON.parse(e.module_quiz_scores) : {})
          const moduleTimeSpent = e.module_time_spent || (typeof e.module_time_spent === 'string' ? JSON.parse(e.module_time_spent) : {})
          
          return {
            id: e.training_id,
            title: e.in_service_trainings?.title || "Unknown Training",
            startDate: e.start_date?.split("T")[0] || "",
            progress: e.progress || 0,
            estimatedCompletion: e.estimated_completion_date || "",
            dueDate: assignment?.due_date || "",
            priority: assignment?.priority || "medium",
            ceuHours: parseFloat(e.in_service_trainings?.ceu_hours?.toString() || "0"),
            assignmentId: assignment?.id,
            enrollmentId: e.id,
            notes: assignment?.notes || "",
            completedModules: completedModules,
            viewedFiles: viewedFiles,
            moduleQuizScores: moduleQuizScores,
            moduleTimeSpent: moduleTimeSpent,
            trainingId: e.training_id,
          }
        })

      // Get assigned/enrolled trainings that haven't been started yet (status = 'enrolled')
      const assignedTrainings = empEnrollments
        .filter((e: any) => e.status === "enrolled")
        .map((e: any) => {
          // Find the assignment for this training to get due date and priority
          const assignment = empAssignments.find((a: any) => a.training_id === e.training_id)
          // Get completed modules from enrollment (stored as JSONB array)
          const completedModules = Array.isArray(e.completed_modules) 
            ? e.completed_modules 
            : (e.completed_modules ? JSON.parse(e.completed_modules) : [])
          const viewedFiles = e.viewed_files || (typeof e.viewed_files === 'string' ? JSON.parse(e.viewed_files) : {})
          const moduleQuizScores = e.module_quiz_scores || (typeof e.module_quiz_scores === 'string' ? JSON.parse(e.module_quiz_scores) : {})
          const moduleTimeSpent = e.module_time_spent || (typeof e.module_time_spent === 'string' ? JSON.parse(e.module_time_spent) : {})
          
          return {
            id: e.training_id,
            title: e.in_service_trainings?.title || "Unknown Training",
            enrollmentDate: e.enrollment_date?.split("T")[0] || "",
            dueDate: assignment?.due_date || "",
            priority: assignment?.priority || "medium",
            ceuHours: parseFloat(e.in_service_trainings?.ceu_hours?.toString() || "0"),
            assignmentId: assignment?.id,
            enrollmentId: e.id,
            notes: assignment?.notes || "",
            completedModules: completedModules, // Array of completed module IDs
            viewedFiles: viewedFiles, // Object mapping moduleId to array of viewed fileIds
            moduleQuizScores: moduleQuizScores, // Object mapping moduleId to quiz score
            moduleTimeSpent: moduleTimeSpent, // Object mapping moduleId to time spent (seconds)
            trainingId: e.training_id,
          }
        })
      
      // Add assigned trainings that don't have an enrollment yet
      const enrolledTrainingIds = empEnrollments.map((e: any) => e.training_id)
      const assignmentsWithoutEnrollment = empAssignments
        .filter((a: any) => !enrolledTrainingIds.includes(a.training_id))
        .map((a: any) => ({
          id: a.training_id,
          title: a.in_service_trainings?.title || "Unknown Training",
          enrollmentDate: a.assigned_date?.split("T")[0] || "",
          dueDate: a.due_date || "",
          priority: a.priority || "medium",
          ceuHours: parseFloat(a.in_service_trainings?.ceu_hours?.toString() || "0"),
          assignmentId: a.id,
          enrollmentId: null,
          notes: a.notes || "",
          completedModules: [],
          viewedFiles: {},
          moduleQuizScores: {},
          moduleTimeSpent: {},
          trainingId: a.training_id,
        }))
      
      // Combine enrolled assignments with non-enrolled assignments
      const combinedTrainings = [...assignedTrainings, ...assignmentsWithoutEnrollment]
      
      // Deduplicate by training_id (keep the first occurrence)
      const seenTrainingIds = new Set<string>()
      const allAssignedTrainings = combinedTrainings.filter((training: any) => {
        if (seenTrainingIds.has(training.trainingId)) {
          return false // Skip duplicates
        }
        seenTrainingIds.add(training.trainingId)
        return true
      })
      
      console.log(`[API] Employee ${emp.name} inProgressTrainings:`, inProgressTrainings)
      console.log(`[API] Employee ${emp.name} assignedTrainings (with enrollments):`, assignedTrainings)
      console.log(`[API] Employee ${emp.name} assignmentsWithoutEnrollment:`, assignmentsWithoutEnrollment)
      console.log(`[API] Employee ${emp.name} allAssignedTrainings:`, allAssignedTrainings)

      // Get upcoming deadlines from assignments
      // Show assignments that are active, have a due date within 1 week (7 days or less), and are not yet completed
      const upcomingDeadlines = empAssignments
        .filter((a: any) => {
          // Only show assignments that are active and have a due date
          if (!a.due_date || a.status !== "active") return false
          
          // Check if due date is within 1 week (7 days or less) from today
          const dueDate = new Date(a.due_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0) // Reset time to start of day
          dueDate.setHours(0, 0, 0, 0) // Reset time to start of day
          
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          // Only show if due date is within 7 days (0 to 7 days from now)
          // Don't show if more than 7 days away
          // Don't show if overdue (negative days)
          if (daysUntilDue > 7 || daysUntilDue < 0) return false // More than 1 week away or overdue, don't show
          
          // Check if training is completed
          const completion = empCompletions.find((c: any) => c.training_id === a.training_id)
          if (completion) return false // Already completed, don't show in upcoming
          
          // Show if not enrolled yet, or enrolled/in-progress (not completed)
          const enrollment = empEnrollments.find((e: any) => e.training_id === a.training_id)
          if (!enrollment) return true // Not enrolled yet - show as upcoming
          if (enrollment.status === "enrolled" || enrollment.status === "in_progress") return true // Enrolled but not completed
          return false // Should not reach here, but safety check
        })
        .map((a: any) => {
          const dueDate = new Date(a.due_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          dueDate.setHours(0, 0, 0, 0)
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          return {
            trainingId: a.training_id,
            training: a.in_service_trainings?.title || "Unknown Training",
            dueDate: a.due_date || "",
            daysUntilDue: daysUntilDue, // Add days until due for display
            priority: a.priority || "medium",
            assignmentId: a.id,
            notes: a.notes || "",
            assignedDate: a.assigned_date?.split("T")[0] || "",
          }
        })
        .sort((a, b) => {
          // Sort by days until due (soonest first)
          return a.daysUntilDue - b.daysUntilDue
        })

      // Calculate ACTUAL completed hours from completions (not from requirements table)
      const actualCompletedHours = empCompletions.reduce((sum, completion) => {
        return sum + parseFloat(completion.ceu_hours_earned?.toString() || "0")
      }, 0)
      
      // Calculate ACTUAL in-progress hours from enrollments
      const actualInProgressHours = empEnrollments
        .filter((e: any) => e.status === "in_progress")
        .reduce((sum, enrollment) => {
          return sum + parseFloat(enrollment.in_service_trainings?.ceu_hours?.toString() || "0")
        }, 0)
      
      const completedHours = actualCompletedHours
      const inProgressHours = actualInProgressHours
      
      console.log(`[ANNUAL PROGRESS] Employee: ${emp.name}`, {
        completions: empCompletions.length,
        completedHours,
        inProgressEnrollments: empEnrollments.filter((e: any) => e.status === "in_progress").length,
        inProgressHours,
        annualRequirementFromDB: req?.annual_requirement_hours
      })
      
      // Get the actual annual requirement for this employee from the database
      // If no requirement record exists, calculate it based on employee's role/credentials
      let annualRequirement = parseFloat(req?.annual_requirement_hours?.toString() || "0")
      
      // If no requirement record exists, create one or use role-based default
      if (!req || annualRequirement === 0) {
        // Try to determine requirement based on role
        // Different roles might have different requirements
        const roleBasedRequirement = getRoleBasedRequirement(emp.role)
        annualRequirement = roleBasedRequirement
        
        // Create requirement record for this employee if it doesn't exist
        // Use service client for upsert operation
        const serviceSupabase = getServiceClient()
        const currentYear = new Date().getFullYear()
        const remainingHours = Math.max(0, annualRequirement - completedHours - inProgressHours)
        
        await serviceSupabase
          .from("employee_training_requirements")
          .upsert({
            employee_id: emp.id,
            year: currentYear,
            annual_requirement_hours: annualRequirement,
            completed_hours: completedHours,
            in_progress_hours: inProgressHours,
            remaining_hours: remainingHours,
            compliance_status: remainingHours === 0 ? "on_track" : (remainingHours > 10 ? "behind" : "at_risk"),
            last_training_date: empCompletions.length > 0 ? empCompletions[empCompletions.length - 1].completion_date : null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "employee_id,year"
          })
      } else {
        // Update existing requirement record with latest calculated hours
        const serviceSupabase = getServiceClient()
        const currentYear = new Date().getFullYear()
        const remainingHours = Math.max(0, annualRequirement - completedHours - inProgressHours)
        
        await serviceSupabase
          .from("employee_training_requirements")
          .update({
            completed_hours: completedHours,
            in_progress_hours: inProgressHours,
            remaining_hours: remainingHours,
            compliance_status: remainingHours === 0 ? "on_track" : (remainingHours > 10 ? "behind" : "at_risk"),
            last_training_date: empCompletions.length > 0 ? empCompletions[empCompletions.length - 1].completion_date : null,
            updated_at: new Date().toISOString(),
          })
          .eq("employee_id", emp.id)
          .eq("year", currentYear)
      }
      
      // Calculate remaining hours based on actual requirement
      const remainingHours = Math.max(0, annualRequirement - completedHours - inProgressHours)

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        hireDate: "", // Would need to be added to tables
        annualRequirement: annualRequirement,
        completedHours: completedHours,
        inProgressHours: inProgressHours,
        remainingHours: remainingHours,
        complianceStatus: req?.compliance_status || "on_track",
        lastTrainingDate: req?.last_training_date?.toString() || "",
        nextDeadline: upcomingDeadlines[0]?.dueDate || "",
        completedTrainings,
        inProgressTrainings,
        assignedTrainings: allAssignedTrainings, // All assigned trainings (with and without enrollments)
        upcomingDeadlines,
      }
    }))

    // Apply filters
    let filteredProgress = employeeProgress

    if (employeeId) {
      filteredProgress = filteredProgress.filter((emp) => emp.id === employeeId)
    }

    if (role && role !== "all") {
      filteredProgress = filteredProgress.filter((emp) => emp.role === role)
    }

    if (status && status !== "all") {
      filteredProgress = filteredProgress.filter((emp) => emp.complianceStatus === status)
    }

    // Calculate summary statistics
    const summary = {
      totalEmployees: employeeProgress.length,
      onTrack: employeeProgress.filter((e) => e.complianceStatus === "on_track").length,
      behind: employeeProgress.filter((e) => e.complianceStatus === "behind").length,
      atRisk: employeeProgress.filter((e) => e.complianceStatus === "at_risk").length,
      nonCompliant: employeeProgress.filter((e) => e.complianceStatus === "non_compliant").length,
      totalHoursCompleted: employeeProgress.reduce((sum, emp) => sum + emp.completedHours, 0),
      averageCompletion:
        employeeProgress.length > 0
          ? Math.round(
              (employeeProgress.reduce(
                (sum, emp) => sum + (emp.completedHours / emp.annualRequirement) * 100,
                0,
              ) /
            employeeProgress.length) *
            10,
            ) / 10
          : 0,
    }

    return NextResponse.json({
      success: true,
      employees: filteredProgress,
      summary,
      total: filteredProgress.length,
    })
  } catch (error) {
    console.error("Error fetching employee progress:", error)
    return NextResponse.json({ error: "Failed to fetch employee progress" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for admin operations
    const supabase = getServiceClient()

    const { employeeId, trainingId, action, data } = await request.json()

    if (!employeeId || !trainingId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let result: any = {}

    switch (action) {
      case "enroll":
        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabase
          .from("in_service_enrollments")
          .select("*")
          .eq("training_id", trainingId)
          .eq("employee_id", employeeId)
          .single()

        if (existingEnrollment) {
          return NextResponse.json({
            success: true,
            result: existingEnrollment,
            message: "Employee already enrolled",
          })
        }

        const { data: newEnrollment, error: enrollError } = await supabase
          .from("in_service_enrollments")
          .insert({
            training_id: trainingId,
            employee_id: employeeId,
            enrollment_date: new Date().toISOString(),
          status: "enrolled",
          progress: 0,
          })
          .select()
          .single()

        if (enrollError) {
          return NextResponse.json({ error: "Failed to enroll: " + enrollError.message }, { status: 500 })
        }

        result = newEnrollment
        break

      case "start":
        const { data: enrollmentToStart } = await supabase
          .from("in_service_enrollments")
          .select("*")
          .eq("training_id", trainingId)
          .eq("employee_id", employeeId)
          .single()

        if (!enrollmentToStart) {
          // Create enrollment if it doesn't exist
          const { data: newEnroll } = await supabase
            .from("in_service_enrollments")
            .insert({
              training_id: trainingId,
              employee_id: employeeId,
              start_date: new Date().toISOString(),
          status: "in_progress",
          progress: 0,
            })
            .select()
            .single()
          result = newEnroll
        } else {
          const { data: updatedEnroll } = await supabase
            .from("in_service_enrollments")
            .update({
              start_date: new Date().toISOString(),
              status: "in_progress",
              last_accessed: new Date().toISOString(),
            })
            .eq("id", enrollmentToStart.id)
            .select()
            .single()
          result = updatedEnroll
        }
        break

      case "progress":
        const { data: enrollmentForProgress } = await supabase
          .from("in_service_enrollments")
          .select("*")
          .eq("training_id", trainingId)
          .eq("employee_id", employeeId)
          .single()

        if (!enrollmentForProgress) {
          return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
        }

        const progressValue = data?.progress || 0
        const completedModules = data?.completedModules || []
        const viewedFiles = data?.viewedFiles || {} // Track viewed files per module
        const moduleQuizScores = data?.moduleQuizScores || {} // Track quiz scores per module
        const moduleTimeSpent = data?.moduleTimeSpent || {} // Track time spent per module in seconds
        
        // Update enrollment with progress and completed modules
        const updateData: any = {
          progress: progressValue,
          status: progressValue >= 100 ? "completed" : "in_progress",
          last_accessed: new Date().toISOString(),
        }
        
        // Store completed modules as JSONB if provided
        if (Array.isArray(completedModules)) {
          updateData.completed_modules = completedModules
        }
        
        // Store viewed files as JSONB (object mapping moduleId to array of fileIds)
        if (viewedFiles && typeof viewedFiles === 'object') {
          updateData.viewed_files = viewedFiles
        }
        
        // Store module quiz scores as JSONB (object mapping moduleId to score)
        if (moduleQuizScores && typeof moduleQuizScores === 'object') {
          updateData.module_quiz_scores = moduleQuizScores
        }
        
        // Store module time spent as JSONB (object mapping moduleId to seconds)
        if (moduleTimeSpent && typeof moduleTimeSpent === 'object') {
          updateData.module_time_spent = moduleTimeSpent
        }
        
        const { data: updatedProgress } = await supabase
          .from("in_service_enrollments")
          .update(updateData)
          .eq("id", enrollmentForProgress.id)
          .select()
          .single()

        result = updatedProgress
        break

      case "complete":
        const { data: enrollmentToComplete } = await supabase
          .from("in_service_enrollments")
          .select("*, in_service_trainings(*)")
          .eq("training_id", trainingId)
          .eq("employee_id", employeeId)
          .single()

        if (!enrollmentToComplete) {
          return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
        }

        // Update enrollment to completed
        await supabase
          .from("in_service_enrollments")
          .update({
          status: "completed",
          progress: 100,
          })
          .eq("id", enrollmentToComplete.id)

        // Create completion record
        const { data: newCompletion, error: completionError } = await supabase
          .from("in_service_completions")
          .insert({
            enrollment_id: enrollmentToComplete.id,
            training_id: trainingId,
            employee_id: employeeId,
            completion_date: new Date().toISOString(),
            score: parseFloat(data?.score?.toString() || "0"),
            ceu_hours_earned: parseFloat(
              enrollmentToComplete.in_service_trainings?.ceu_hours?.toString() || data?.ceuHours?.toString() || "0",
            ),
            certificate_number: `CERT-${Date.now()}`,
            quiz_attempts: data?.quizAttempts || 0,
            final_quiz_score: parseFloat(data?.score?.toString() || "0"),
          })
          .select()
          .single()

        if (completionError) {
          return NextResponse.json({ error: "Failed to complete: " + completionError.message }, { status: 500 })
        }

        result = newCompletion
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Training ${action} successful`,
    })
  } catch (error) {
    console.error("Error updating employee progress:", error)
    return NextResponse.json({ error: "Failed to update employee progress" }, { status: 500 })
  }
}
