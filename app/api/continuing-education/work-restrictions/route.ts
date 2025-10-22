import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { employeeId, restrictions, reason } = await request.json()

    if (!employeeId || !restrictions || !Array.isArray(restrictions)) {
      return NextResponse.json({ error: "Employee ID and restrictions array required" }, { status: 400 })
    }

    // Mock work restriction implementation
    const restrictionRecord = {
      employeeId,
      restrictions,
      reason: reason || "Compliance requirements not met",
      appliedDate: new Date().toISOString(),
      appliedBy: "system", // In real implementation, get from auth
      status: "active",
    }

    // Log restriction application
    console.log(`Work restrictions applied to employee ${employeeId}:`, restrictions)

    // In a real implementation, this would:
    // 1. Update employee record in database
    // 2. Send notifications to employee and supervisors
    // 3. Update scheduling system to prevent new assignments
    // 4. Flag payroll system to hold payments if applicable

    return NextResponse.json({
      success: true,
      restriction: restrictionRecord,
      message: "Work restrictions applied successfully",
    })
  } catch (error) {
    console.error("Work restriction error:", error)
    return NextResponse.json({ error: "Failed to apply work restrictions" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { employeeId, reason } = await request.json()

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 })
    }

    // Mock restriction removal
    const removalRecord = {
      employeeId,
      reason: reason || "Compliance requirements met",
      removedDate: new Date().toISOString(),
      removedBy: "system",
      status: "lifted",
    }

    console.log(`Work restrictions lifted for employee ${employeeId}`)

    // In a real implementation, this would:
    // 1. Remove restrictions from employee record
    // 2. Send notifications about restored work eligibility
    // 3. Update scheduling system to allow new assignments
    // 4. Resume payroll processing

    return NextResponse.json({
      success: true,
      removal: removalRecord,
      message: "Work restrictions lifted successfully",
    })
  } catch (error) {
    console.error("Restriction removal error:", error)
    return NextResponse.json({ error: "Failed to lift work restrictions" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const status = searchParams.get("status") || "active"

    let restrictedEmployees = [
      {
        employeeId: "EMP-003",
        name: "Emily Davis",
        role: "CNA",
        restrictions: ["patient_assignments"],
        reason: "Onboarding incomplete",
        appliedDate: "2024-01-10T09:00:00Z",
        status: "active",
      },
      {
        employeeId: "EMP-004",
        name: "Robert Wilson",
        role: "LPN",
        restrictions: ["scheduling", "payroll", "patient_assignments"],
        reason: "CEU requirements overdue",
        appliedDate: "2024-06-15T14:30:00Z",
        status: "active",
      },
    ]

    if (employeeId) {
      restrictedEmployees = restrictedEmployees.filter((emp) => emp.employeeId === employeeId)
    }

    if (status !== "all") {
      restrictedEmployees = restrictedEmployees.filter((emp) => emp.status === status)
    }

    return NextResponse.json({
      success: true,
      restrictedEmployees,
      summary: {
        total: restrictedEmployees.length,
        onboardingRestrictions: restrictedEmployees.filter((emp) => emp.reason.includes("onboarding")).length,
        complianceRestrictions: restrictedEmployees.filter((emp) => emp.reason.includes("CEU")).length,
      },
    })
  } catch (error) {
    console.error("Error fetching work restrictions:", error)
    return NextResponse.json({ error: "Failed to fetch work restrictions" }, { status: 500 })
  }
}
