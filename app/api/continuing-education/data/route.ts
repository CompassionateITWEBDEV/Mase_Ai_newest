import { type NextRequest, NextResponse } from "next/server"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Configure runtime for Vercel Edge/Serverless
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // Disable caching for this route
export const maxDuration = 30 // Maximum execution time in seconds

// Singleton client for better connection management in serverless
let supabaseClient: SupabaseClient | null = null

// Helper to get service role client (bypasses RLS)
function getServiceClient() {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  // Reuse existing client in serverless environment
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-timeout': '30000',
        },
      },
    })
  }
  
  return supabaseClient
}

// Michigan state CEU requirements by role
const STATE_REQUIREMENTS = {
  RN: { hours: 25, period: "biennial", description: "25 hours every 2 years" },
  LPN: { hours: 20, period: "biennial", description: "20 hours every 2 years" },
  CNA: { hours: 12, period: "annual", description: "12 hours annually" },
  PT: { hours: 30, period: "biennial", description: "30 hours every 2 years" },
  PTA: { hours: 20, period: "biennial", description: "20 hours every 2 years" },
  OT: { hours: 24, period: "biennial", description: "24 hours every 2 years" },
  HHA: { hours: 12, period: "annual", description: "12 hours annually" },
}

// Determine CEU requirements based on role/credentials
function getRoleRequirements(credentials: string): { hours: number; period: string; description: string } {
  const credUpper = (credentials || "").toUpperCase().trim()
  
  for (const [role, req] of Object.entries(STATE_REQUIREMENTS)) {
    if (credUpper.includes(role) || credUpper === role) {
      return req
    }
  }
  
  // Default for unknown roles
  return { hours: 20, period: "annual", description: "20 hours annually" }
}

// Calculate compliance status
function calculateComplianceStatus(
  completedHours: number,
  requiredHours: number,
  daysUntilDue: number
): "compliant" | "at_risk" | "due_soon" | "non_compliant" {
  const completionPercentage = (completedHours / requiredHours) * 100

  // Non-compliant if past due date
  if (daysUntilDue < 0) {
    return "non_compliant"
  }

  // Due soon if within 30 days
  if (daysUntilDue <= 30) {
    return "due_soon"
  }

  // At risk if less than 60% complete and less than 90 days remaining
  if (completionPercentage < 60 && daysUntilDue <= 90) {
    return "at_risk"
  }

  // Compliant otherwise
  return "compliant"
}

// Calculate days until due (assumes biennial = 2 years from hire date, annual = end of year)
function calculateDaysUntilDue(
  hireDate: string,
  period: string,
  currentPeriodEnd?: string
): number {
  if (currentPeriodEnd) {
    const endDate = new Date(currentPeriodEnd)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const today = new Date()
  
  if (period === "annual") {
    // Due at end of current year
    const endOfYear = new Date(today.getFullYear(), 11, 31)
    const diffTime = endOfYear.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } else if (period === "biennial") {
    // Due 2 years from hire date
    const hired = new Date(hireDate)
    const biennial = new Date(hired.getFullYear() + 2, hired.getMonth(), hired.getDate())
    
    // If past the 2-year mark, calculate next 2-year cycle
    if (today > biennial) {
      const yearsSinceHire = Math.floor(
        (today.getTime() - hired.getTime()) / (1000 * 60 * 60 * 24 * 365)
      )
      const nextCycle = Math.ceil(yearsSinceHire / 2) * 2
      const nextDue = new Date(
        hired.getFullYear() + nextCycle,
        hired.getMonth(),
        hired.getDate()
      )
      const diffTime = nextDue.getTime() - today.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const diffTime = biennial.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return 365 // Default to 1 year
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")

    console.log("🔄 Starting data fetch for continuing education...")

    // Get all active staff members
    const { data: staffList, error: staffError } = await supabase
      .from("staff")
      .select("*")
      .eq("is_active", true)

    if (staffError) {
      console.error("❌ Error fetching staff:", staffError)
      return NextResponse.json({ 
        error: "Failed to fetch staff", 
        details: staffError.message 
      }, { status: 500 })
    }

    if (!staffList || staffList.length === 0) {
      console.log("⚠️ No active staff found")
      return NextResponse.json({
        success: true,
        employees: [],
        stats: { total: 0, compliant: 0, atRisk: 0, dueSoon: 0, nonCompliant: 0, lockedOut: 0 },
        stateRequirements: STATE_REQUIREMENTS,
        onboardingModules: [],
        enrollments: [],
        completions: [],
      })
    }

    console.log(`✅ Found ${staffList.length} active staff members`)

    // Fetch all data in parallel with proper error handling
    const currentYear = new Date().getFullYear()
    
    const [
      completionsResult,
      enrollmentsResult,
      requirementsResult,
      mandatoryTrainingsResult
    ] = await Promise.allSettled([
      supabase
        .from("in_service_completions")
        .select(`
          *,
          in_service_trainings (
            title,
            category,
            accreditation
          )
        `),
      supabase
        .from("in_service_enrollments")
        .select(`
          *,
          in_service_trainings (
            title,
            category,
            ceu_hours
          )
        `),
      supabase
        .from("employee_training_requirements")
        .select("*")
        .eq("year", currentYear),
      supabase
        .from("in_service_trainings")
        .select("*")
        .eq("mandatory", true)
        .eq("status", "active")
    ])

    // Extract data with proper error handling
    const completions = completionsResult.status === "fulfilled" && !completionsResult.value.error
      ? completionsResult.value.data
      : []
    
    const enrollments = enrollmentsResult.status === "fulfilled" && !enrollmentsResult.value.error
      ? enrollmentsResult.value.data
      : []
    
    const requirements = requirementsResult.status === "fulfilled" && !requirementsResult.value.error
      ? requirementsResult.value.data
      : []
    
    const mandatoryTrainings = mandatoryTrainingsResult.status === "fulfilled" && !mandatoryTrainingsResult.value.error
      ? mandatoryTrainingsResult.value.data
      : []

    // Log any errors but continue processing
    if (completionsResult.status === "rejected" || (completionsResult.status === "fulfilled" && completionsResult.value.error)) {
      console.error("⚠️ Error fetching completions:", completionsResult.status === "rejected" ? completionsResult.reason : completionsResult.value.error)
    }
    if (enrollmentsResult.status === "rejected" || (enrollmentsResult.status === "fulfilled" && enrollmentsResult.value.error)) {
      console.error("⚠️ Error fetching enrollments:", enrollmentsResult.status === "rejected" ? enrollmentsResult.reason : enrollmentsResult.value.error)
    }
    if (requirementsResult.status === "rejected" || (requirementsResult.status === "fulfilled" && requirementsResult.value.error)) {
      console.error("⚠️ Error fetching requirements:", requirementsResult.status === "rejected" ? requirementsResult.reason : requirementsResult.value.error)
    }
    if (mandatoryTrainingsResult.status === "rejected" || (mandatoryTrainingsResult.status === "fulfilled" && mandatoryTrainingsResult.value.error)) {
      console.error("⚠️ Error fetching mandatory trainings:", mandatoryTrainingsResult.status === "rejected" ? mandatoryTrainingsResult.reason : mandatoryTrainingsResult.value.error)
    }

    console.log(`📊 Data fetched - Completions: ${completions?.length || 0}, Enrollments: ${enrollments?.length || 0}, Requirements: ${requirements?.length || 0}, Mandatory: ${mandatoryTrainings?.length || 0}`)

    // Process each employee
    const employees = (staffList || []).map((staff: any) => {
      const empCompletions = (completions || []).filter(
        (c: any) => c.employee_id === staff.id
      )
      const empEnrollments = (enrollments || []).filter(
        (e: any) => e.employee_id === staff.id
      )
      const empRequirement = (requirements || []).find(
        (r: any) => r.employee_id === staff.id
      )

      // Get role requirements
      const roleReq = getRoleRequirements(staff.credentials || staff.role_id || "")
      
      // Get annual requirement from database OR use role-based default
      const requiredHours = empRequirement?.annual_requirement_hours || roleReq.hours

      // Calculate completed CEU hours from this year
      // Include BOTH completions table AND enrollments with status='completed'
      const completionsThisYear = empCompletions.filter((c: any) => {
        const completionYear = new Date(c.completion_date).getFullYear()
        return completionYear === currentYear
      })
      
      // Get completed hours from completions table
      const hoursFromCompletions = completionsThisYear.reduce(
        (sum: number, c: any) => sum + (parseFloat(c.ceu_hours_earned) || 0), 
        0
      )
      
      // Get completed hours from enrollments with status='completed' (that don't have completion record yet)
      const completedEnrollmentsWithoutCompletion = empEnrollments.filter((e: any) => {
        if (e.status !== "completed") return false
        // Check if this enrollment already has a completion record
        const hasCompletion = empCompletions.some((c: any) => c.enrollment_id === e.id)
        return !hasCompletion
      })
      
      const hoursFromEnrollments = completedEnrollmentsWithoutCompletion.reduce(
        (sum: number, e: any) => sum + (parseFloat(e.in_service_trainings?.ceu_hours) || 0),
        0
      )
      
      const completedHours = hoursFromCompletions + hoursFromEnrollments

      // Calculate period end date
      const hireDate = staff.created_at || new Date().toISOString()
      const periodStart =
        roleReq.period === "annual"
          ? `${currentYear}-01-01`
          : new Date(hireDate).toISOString().split("T")[0]
      const periodEnd =
        roleReq.period === "annual"
          ? `${currentYear}-12-31`
          : new Date(
              new Date(hireDate).getFullYear() + 2,
              new Date(hireDate).getMonth(),
              new Date(hireDate).getDate()
            )
              .toISOString()
              .split("T")[0]

      // Calculate days until due
      const daysUntilDue = calculateDaysUntilDue(hireDate, roleReq.period, periodEnd)

      // Calculate compliance status
      const status = calculateComplianceStatus(completedHours, requiredHours, daysUntilDue)

      // Determine work restrictions based on compliance
      const workRestrictions: string[] = []
      if (status === "non_compliant") {
        workRestrictions.push("scheduling", "payroll", "patient_assignments")
      }

      // Get onboarding modules with completion details
      // Show each mandatory training with its module breakdown
      const onboardingModules = (mandatoryTrainings || []).map((mt: any) => {
        const completion = empCompletions.find((c: any) => c.training_id === mt.id)
        const enrollment = empEnrollments.find((e: any) => e.training_id === mt.id)
        
        // Get modules from training (stored in JSONB field)
        const trainingModules = Array.isArray(mt.modules) ? mt.modules : 
                               (typeof mt.modules === 'string' ? JSON.parse(mt.modules) : [])
        
        // Get completed modules from enrollment
        let completedModuleIds = enrollment?.completed_modules || []
        
        // If training is completed, consider ALL modules as completed
        if (completion && enrollment?.status === 'completed') {
          completedModuleIds = trainingModules.map((m: any) => m.id)
        }
        
        return {
          id: mt.id,
          title: mt.title,
          category: mt.category,
          duration: mt.duration,
          completed: !!completion,
          completionDate: completion ? new Date(completion.completion_date).toISOString().split("T")[0] : null,
          score: completion ? parseFloat(completion.score) : null,
          totalModules: trainingModules.length,
          completedModules: completedModuleIds.length,
          modules: trainingModules.map((m: any) => ({
            id: m.id,
            title: m.title,
            completed: completedModuleIds.includes(m.id),
          })),
        }
      })
      
      // Calculate TOTAL modules across ALL mandatory trainings
      const totalOnboardingModules = onboardingModules.reduce((sum, training) => {
        return sum + (training.totalModules || 0)
      }, 0)
      
      // Calculate TOTAL completed modules across ALL trainings
      const totalCompletedModules = onboardingModules.reduce((sum, training) => {
        return sum + (training.completedModules || 0)
      }, 0)
      
      // Check if all trainings are completed
      const completedMandatoryTrainings = mandatoryTrainings?.filter((mt: any) =>
        empCompletions.some((c: any) => c.training_id === mt.id)
      )
      const onboardingCompleted = completedMandatoryTrainings?.length === mandatoryTrainings?.length

      // Get certificates ONLY from COMPLETED trainings
      // "verified" = Training is COMPLETE (status='completed' in enrollments + has completion record)
      const certificatesFromCompletions = empCompletions.map((c: any) => {
        // Check if enrollment status is 'completed'
        const enrollment = empEnrollments.find((e: any) => e.id === c.enrollment_id)
        const isComplete = enrollment?.status === "completed"
        
        return {
          id: c.id,
          title: c.in_service_trainings?.title || "Unknown Training",
          provider: c.in_service_trainings?.accreditation || "Internal Training",
          completionDate: new Date(c.completion_date).toISOString().split("T")[0],
          hoursEarned: parseFloat(c.ceu_hours_earned) || 0,
          certificateNumber: c.certificate_number || "",
          score: c.score ? parseFloat(c.score) : null,
          status: isComplete ? "verified" : "pending",
          source: "completion",
        }
      })
      
      // Add certificates from enrollments with status='completed' (but no completion record yet)
      const certificatesFromEnrollments = completedEnrollmentsWithoutCompletion.map((e: any) => ({
        id: e.id,
        title: e.in_service_trainings?.title || "Unknown Training",
        provider: "Internal Training",
        completionDate: e.updated_at ? new Date(e.updated_at).toISOString().split("T")[0] : "",
        hoursEarned: parseFloat(e.in_service_trainings?.ceu_hours) || 0,
        certificateNumber: "",
        score: null, // No score for enrollments without completion record
        status: "verified", // Status is 'completed' in enrollment table
        source: "enrollment",
      }))
      
      // Combine both sources - ALL should be verified (completed trainings only)
      const certificates = [...certificatesFromCompletions, ...certificatesFromEnrollments]

      return {
        id: staff.id,
        name: staff.name,
        role: staff.credentials || staff.role_id || "Staff",
        hireDate: new Date(hireDate).toISOString().split("T")[0],
        licenseExpiry: periodEnd, // Using period end as license expiry
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        requiredHours: requiredHours,
        completedHours: Math.round(completedHours * 10) / 10,
        status: status,
        daysUntilDue: daysUntilDue,
        certificates: certificates,
        onboardingStatus: {
          completed: onboardingCompleted,
          completionDate: onboardingCompleted
            ? empCompletions[empCompletions.length - 1]?.completion_date?.split("T")[0]
            : null,
          totalModules: totalOnboardingModules,        // Total modules across ALL trainings
          completedModules: totalCompletedModules,     // Total completed modules across ALL trainings
          modules: onboardingModules,                   // Detailed module list per training
        },
        workRestrictions: workRestrictions,
        email: staff.email,
        department: staff.department || "General",
      }
    })

    // Filter by employeeId if provided
    const filteredEmployees = employeeId
      ? employees.filter((emp) => emp.id === employeeId)
      : employees

        // Calculate compliance statistics from REAL DATABASE DATA
    const stats = {
      total: filteredEmployees.length,
      compliant: filteredEmployees.filter((e) => e.status === "compliant").length,
      atRisk: filteredEmployees.filter((e) => e.status === "at_risk").length,
      dueSoon: filteredEmployees.filter((e) => e.status === "due_soon").length,
      nonCompliant: filteredEmployees.filter((e) => e.status === "non_compliant").length,
      lockedOut: filteredEmployees.filter((e) => e.workRestrictions.length > 0).length,
    }

    // Debug logging to verify stats are calculated from real data
    console.log("📊 Compliance Stats Calculation:")
    console.log(`  Total Employees: ${stats.total}`)
    console.log(`  ✅ Compliant: ${stats.compliant}`)
    console.log(`  🟡 At Risk: ${stats.atRisk}`)
    console.log(`  🟠 Due Soon: ${stats.dueSoon}`)
    console.log(`  ❌ Non-Compliant: ${stats.nonCompliant}`)
    console.log(`  🔒 Locked Out: ${stats.lockedOut}`)
    
    // Show breakdown of each employee's status
    filteredEmployees.forEach((emp) => {
      console.log(
        `  ${emp.name}: ${emp.status.toUpperCase()} (${emp.completedHours}/${emp.requiredHours} hrs, ${emp.daysUntilDue} days left)`
      )
    })

    // Get onboarding modules (mandatory trainings)
    const onboardingModules = (mandatoryTrainings || []).map((training: any) => ({
      id: training.id,
      title: training.title,
      description: training.description || "",
      dueWithin: 14, // Default due within 14 days
      category: training.category,
      estimatedTime: training.duration || 60,
      required: training.mandatory,
      roles: training.target_roles || [],
      modules: training.modules || [], // Include modules from JSONB field
    }))

    // Create response with proper headers for Vercel
    const response = NextResponse.json({
      success: true,
      employees: filteredEmployees,
      stats,
      stateRequirements: STATE_REQUIREMENTS,
      onboardingModules,
      enrollments: enrollments || [], // Include raw enrollment data for accurate statistics
      completions: completions || [], // Include raw completion data
      timestamp: new Date().toISOString(), // Add timestamp for debugging
    })

    // Set cache control headers - disable caching for dynamic data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('CDN-Cache-Control', 'no-store')
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store')

    console.log("✅ Successfully processed continuing education data")

    return response
  } catch (error: any) {
    console.error("❌ Critical error in continuing education API:", error)
    
    // Return detailed error in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return NextResponse.json(
      { 
        error: "Failed to fetch continuing education data",
        details: isDevelopment ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

