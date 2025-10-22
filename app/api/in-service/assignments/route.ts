import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { trainingId, assignTo, dueDate, notes, priority } = await request.json()

    if (!trainingId || !assignTo || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Mock assignment logic
    let assignedEmployees = []

    switch (assignTo) {
      case "all":
        assignedEmployees = ["EMP-001", "EMP-002", "EMP-003"] // All employees
        break
      case "role-rn":
        assignedEmployees = ["EMP-001"] // All RNs
        break
      case "role-lpn":
        assignedEmployees = ["EMP-004"] // All LPNs
        break
      case "role-cna":
        assignedEmployees = ["EMP-003"] // All CNAs
        break
      case "role-pt":
        assignedEmployees = ["EMP-002"] // All PTs
        break
      default:
        if (Array.isArray(assignTo)) {
          assignedEmployees = assignTo
        } else {
          assignedEmployees = [assignTo]
        }
    }

    const assignment = {
      id: `ASSIGN-${Date.now()}`,
      trainingId,
      assignedEmployees,
      assignedBy: "admin", // In real app, get from auth
      assignedDate: new Date().toISOString(),
      dueDate,
      notes: notes || "",
      priority: priority || "medium",
      status: "active",
      completionStats: {
        total: assignedEmployees.length,
        completed: 0,
        inProgress: 0,
        notStarted: assignedEmployees.length,
      },
    }

    // Send notifications to assigned employees
    const notifications = assignedEmployees.map((empId) => ({
      employeeId: empId,
      type: "training_assignment",
      title: "New Training Assignment",
      message: `You have been assigned a new training module. Due date: ${dueDate}`,
      trainingId,
      assignmentId: assignment.id,
      createdDate: new Date().toISOString(),
      read: false,
    }))

    console.log(`Training ${trainingId} assigned to ${assignedEmployees.length} employees`)
    console.log(`Notifications sent: ${notifications.length}`)

    return NextResponse.json({
      success: true,
      assignment,
      notifications,
      message: `Training assigned to ${assignedEmployees.length} employees`,
    })
  } catch (error) {
    console.error("Error creating assignment:", error)
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const trainingId = searchParams.get("trainingId")

    // Mock assignment data
    const assignments = [
      {
        id: "ASSIGN-001",
        trainingId: "IS-002",
        trainingTitle: "Medication Administration Safety",
        assignedEmployees: ["EMP-001", "EMP-002", "EMP-003"],
        assignedBy: "admin",
        assignedDate: "2024-01-15T09:00:00Z",
        dueDate: "2024-06-30T23:59:59Z",
        notes: "Mandatory annual training for all clinical staff",
        priority: "high",
        status: "active",
        completionStats: {
          total: 78,
          completed: 65,
          inProgress: 8,
          notStarted: 5,
        },
      },
      {
        id: "ASSIGN-002",
        trainingId: "IS-001",
        trainingTitle: "Advanced Wound Care Management",
        assignedEmployees: ["EMP-001"],
        assignedBy: "admin",
        assignedDate: "2024-01-10T09:00:00Z",
        dueDate: "2024-12-31T23:59:59Z",
        notes: "Advanced training for RNs only",
        priority: "medium",
        status: "active",
        completionStats: {
          total: 45,
          completed: 32,
          inProgress: 10,
          notStarted: 3,
        },
      },
      {
        id: "ASSIGN-003",
        trainingId: "IS-004",
        trainingTitle: "HIPAA Privacy & Security Update",
        assignedEmployees: ["EMP-001", "EMP-002", "EMP-003"],
        assignedBy: "admin",
        assignedDate: "2024-01-01T09:00:00Z",
        dueDate: "2024-12-31T23:59:59Z",
        notes: "Annual HIPAA compliance training for all staff",
        priority: "high",
        status: "completed",
        completionStats: {
          total: 156,
          completed: 156,
          inProgress: 0,
          notStarted: 0,
        },
      },
    ]

    let filteredAssignments = assignments

    if (status && status !== "all") {
      filteredAssignments = filteredAssignments.filter((a) => a.status === status)
    }

    if (trainingId) {
      filteredAssignments = filteredAssignments.filter((a) => a.trainingId === trainingId)
    }

    return NextResponse.json({
      success: true,
      assignments: filteredAssignments,
      total: filteredAssignments.length,
      summary: {
        totalAssignments: assignments.length,
        activeAssignments: assignments.filter((a) => a.status === "active").length,
        completedAssignments: assignments.filter((a) => a.status === "completed").length,
        totalEmployeesAssigned: assignments.reduce((sum, a) => sum + a.completionStats.total, 0),
        totalCompletions: assignments.reduce((sum, a) => sum + a.completionStats.completed, 0),
      },
    })
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { assignmentId, action, data } = await request.json()

    if (!assignmentId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let result = {}

    switch (action) {
      case "extend_deadline":
        result = {
          assignmentId,
          newDueDate: data.dueDate,
          reason: data.reason || "",
          extendedBy: "admin",
          extendedDate: new Date().toISOString(),
        }
        console.log(`Assignment ${assignmentId} deadline extended to ${data.dueDate}`)
        break

      case "add_employees":
        result = {
          assignmentId,
          addedEmployees: data.employees || [],
          addedBy: "admin",
          addedDate: new Date().toISOString(),
        }
        console.log(`${data.employees?.length || 0} employees added to assignment ${assignmentId}`)
        break

      case "remove_employees":
        result = {
          assignmentId,
          removedEmployees: data.employees || [],
          removedBy: "admin",
          removedDate: new Date().toISOString(),
          reason: data.reason || "",
        }
        console.log(`${data.employees?.length || 0} employees removed from assignment ${assignmentId}`)
        break

      case "cancel":
        result = {
          assignmentId,
          status: "cancelled",
          cancelledBy: "admin",
          cancelledDate: new Date().toISOString(),
          reason: data.reason || "",
        }
        console.log(`Assignment ${assignmentId} cancelled`)
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
