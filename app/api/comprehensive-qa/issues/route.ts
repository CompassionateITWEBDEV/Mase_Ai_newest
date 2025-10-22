import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const severity = searchParams.get("severity")
    const status = searchParams.get("status")

    // Mock issues data
    const allIssues = [
      {
        id: "med-001",
        category: "Medication Safety",
        severity: "high",
        description: "Missing medication reconciliation for 3 medications",
        location: "MAR Section 2",
        suggestion: "Complete reconciliation with physician and pharmacy",
        impact: "Patient safety risk and regulatory non-compliance",
        resolved: false,
        regulatoryImpact: "FDA medication safety requirements",
        documentType: "medicationRecords",
      },
      {
        id: "clinical-001",
        category: "Documentation Quality",
        severity: "medium",
        description: "Some progress notes lack specific measurable outcomes",
        location: "Progress Notes 1/14-1/16",
        suggestion: "Include specific measurements and patient responses",
        impact: "Improved care continuity and compliance",
        resolved: false,
        regulatoryImpact: "Joint Commission standards",
        documentType: "clinicalNotes",
      },
      {
        id: "oasis-001",
        category: "Functional Assessment",
        severity: "medium",
        description: "M1800 Grooming score may be underreported",
        location: "Section M1800",
        suggestion: "Review patient's actual grooming capabilities",
        impact: "Potential revenue impact of $127 per episode",
        resolved: false,
        regulatoryImpact: "CMS reimbursement accuracy",
        documentType: "oasis",
      },
    ]

    // Filter issues based on query parameters
    let filteredIssues = allIssues

    if (severity && severity !== "all") {
      filteredIssues = filteredIssues.filter((issue) => issue.severity === severity)
    }

    if (status && status !== "all") {
      const isResolved = status === "resolved"
      filteredIssues = filteredIssues.filter((issue) => issue.resolved === isResolved)
    }

    return NextResponse.json({
      success: true,
      data: {
        issues: filteredIssues,
        total: filteredIssues.length,
        summary: {
          critical: filteredIssues.filter((i) => i.severity === "critical").length,
          high: filteredIssues.filter((i) => i.severity === "high").length,
          medium: filteredIssues.filter((i) => i.severity === "medium").length,
          low: filteredIssues.filter((i) => i.severity === "low").length,
          resolved: filteredIssues.filter((i) => i.resolved).length,
          unresolved: filteredIssues.filter((i) => !i.resolved).length,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching issues:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch issues" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { issueId, action, assignedTo, notes } = body

    // Simulate issue update
    await new Promise((resolve) => setTimeout(resolve, 500))

    const updatedIssue = {
      id: issueId,
      action,
      assignedTo,
      notes,
      updatedAt: new Date().toISOString(),
      updatedBy: "Current User",
    }

    return NextResponse.json({
      success: true,
      data: updatedIssue,
      message: `Issue ${action} successfully`,
    })
  } catch (error) {
    console.error("Error updating issue:", error)
    return NextResponse.json({ success: false, error: "Failed to update issue" }, { status: 500 })
  }
}
