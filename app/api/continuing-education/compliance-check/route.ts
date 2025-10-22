import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json()

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 })
    }

    // Mock compliance check logic
    const employee = {
      id: employeeId,
      role: "RN",
      requiredHours: 25,
      completedHours: 18.5,
      currentPeriodEnd: "2025-06-30",
      licenseExpiry: "2025-06-30",
    }

    const today = new Date()
    const periodEnd = new Date(employee.currentPeriodEnd)
    const daysUntilDue = Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let status = "compliant"
    let workRestrictions: string[] = []

    // Determine compliance status
    if (daysUntilDue < 0) {
      // Past due
      status = "non_compliant"
      workRestrictions = ["scheduling", "payroll", "patient_assignments"]
    } else if (daysUntilDue <= 30 && employee.completedHours < employee.requiredHours) {
      // Due soon
      status = "due_soon"
    } else if (daysUntilDue <= 90 && employee.completedHours < employee.requiredHours * 0.75) {
      // At risk
      status = "at_risk"
    }

    const complianceResult = {
      employeeId,
      status,
      requiredHours: employee.requiredHours,
      completedHours: employee.completedHours,
      remainingHours: Math.max(0, employee.requiredHours - employee.completedHours),
      daysUntilDue,
      workRestrictions,
      compliancePercentage: Math.round((employee.completedHours / employee.requiredHours) * 100),
      nextAction: getNextAction(status, daysUntilDue, employee.completedHours, employee.requiredHours),
      notifications: generateNotifications(status, daysUntilDue),
    }

    // Log compliance check
    console.log(`Compliance check for employee ${employeeId}: ${status}`)

    return NextResponse.json({
      success: true,
      compliance: complianceResult,
    })
  } catch (error) {
    console.error("Compliance check error:", error)
    return NextResponse.json({ error: "Failed to check compliance" }, { status: 500 })
  }
}

function getNextAction(status: string, daysUntilDue: number, completedHours: number, requiredHours: number) {
  switch (status) {
    case "non_compliant":
      return "Upload CEU certificates immediately to restore work eligibility"
    case "due_soon":
      return `Complete ${requiredHours - completedHours} hours within ${daysUntilDue} days`
    case "at_risk":
      return `Plan to complete ${requiredHours - completedHours} hours before deadline`
    default:
      return "Continue maintaining compliance"
  }
}

function generateNotifications(status: string, daysUntilDue: number) {
  const notifications = []

  if (status === "non_compliant") {
    notifications.push({
      type: "error",
      message: "CEU requirements are overdue. Work restrictions are in effect.",
      action: "Upload certificates now",
    })
  } else if (status === "due_soon") {
    notifications.push({
      type: "warning",
      message: `CEU requirements due in ${daysUntilDue} days`,
      action: "Complete remaining hours",
    })
  } else if (status === "at_risk") {
    notifications.push({
      type: "info",
      message: "CEU progress is behind schedule",
      action: "Plan training completion",
    })
  }

  return notifications
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    // Mock employee compliance data
    const employees = [
      {
        id: "EMP-001",
        name: "Sarah Johnson",
        role: "RN",
        status: "compliant",
        completedHours: 18.5,
        requiredHours: 25,
        daysUntilDue: 245,
      },
      {
        id: "EMP-002",
        name: "Michael Chen",
        role: "PT",
        status: "at_risk",
        completedHours: 12.0,
        requiredHours: 30,
        daysUntilDue: 89,
      },
      {
        id: "EMP-003",
        name: "Emily Davis",
        role: "CNA",
        status: "due_soon",
        completedHours: 4.0,
        requiredHours: 12,
        daysUntilDue: 28,
      },
      {
        id: "EMP-004",
        name: "Robert Wilson",
        role: "LPN",
        status: "non_compliant",
        completedHours: 8.0,
        requiredHours: 20,
        daysUntilDue: -15,
      },
    ]

    let filteredEmployees = employees

    if (role && role !== "all") {
      filteredEmployees = filteredEmployees.filter((emp) => emp.role === role)
    }

    if (status && status !== "all") {
      filteredEmployees = filteredEmployees.filter((emp) => emp.status === status)
    }

    return NextResponse.json({
      employees: filteredEmployees,
      summary: {
        total: employees.length,
        compliant: employees.filter((e) => e.status === "compliant").length,
        atRisk: employees.filter((e) => e.status === "at_risk").length,
        dueSoon: employees.filter((e) => e.status === "due_soon").length,
        nonCompliant: employees.filter((e) => e.status === "non_compliant").length,
      },
    })
  } catch (error) {
    console.error("Error fetching compliance data:", error)
    return NextResponse.json({ error: "Failed to fetch compliance data" }, { status: 500 })
  }
}
