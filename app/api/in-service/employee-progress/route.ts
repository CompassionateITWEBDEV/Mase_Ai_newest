import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    // Mock employee progress data
    const employeeProgress = [
      {
        id: "EMP-001",
        name: "Sarah Johnson",
        role: "RN",
        department: "Home Health",
        hireDate: "2023-03-15",
        annualRequirement: 20,
        completedHours: 14.5,
        inProgressHours: 3.0,
        remainingHours: 2.5,
        complianceStatus: "on_track",
        lastTrainingDate: "2024-01-15",
        nextDeadline: "2024-06-30",
        completedTrainings: [
          {
            id: "IS-003",
            title: "Infection Control & Prevention",
            completionDate: "2024-01-15",
            score: 95,
            ceuHours: 1.25,
            certificate: "CERT-2024-001",
          },
          {
            id: "IS-004",
            title: "HIPAA Privacy & Security Update",
            completionDate: "2024-01-10",
            score: 98,
            ceuHours: 1.0,
            certificate: "CERT-2024-002",
          },
        ],
        inProgressTrainings: [
          {
            id: "IS-001",
            title: "Advanced Wound Care Management",
            startDate: "2024-01-20",
            progress: 75,
            estimatedCompletion: "2024-02-05",
            ceuHours: 2.0,
          },
        ],
        upcomingDeadlines: [
          { training: "Medication Safety", dueDate: "2024-06-30", priority: "high" },
          { training: "Wound Care Update", dueDate: "2024-12-31", priority: "medium" },
        ],
      },
      {
        id: "EMP-002",
        name: "Michael Chen",
        role: "PT",
        department: "Rehabilitation",
        hireDate: "2023-01-20",
        annualRequirement: 24,
        completedHours: 18.0,
        inProgressHours: 3.0,
        remainingHours: 3.0,
        complianceStatus: "on_track",
        lastTrainingDate: "2024-01-12",
        nextDeadline: "2024-08-15",
        completedTrainings: [
          {
            id: "IS-003",
            title: "Infection Control & Prevention",
            completionDate: "2024-01-12",
            score: 88,
            ceuHours: 1.25,
            certificate: "CERT-2024-003",
          },
          {
            id: "IS-004",
            title: "HIPAA Privacy & Security Update",
            completionDate: "2024-01-08",
            score: 92,
            ceuHours: 1.0,
            certificate: "CERT-2024-004",
          },
        ],
        inProgressTrainings: [
          {
            id: "IS-005",
            title: "Physical Therapy Techniques",
            startDate: "2024-01-18",
            progress: 40,
            estimatedCompletion: "2024-02-15",
            ceuHours: 3.0,
          },
        ],
        upcomingDeadlines: [{ training: "PT Techniques Advanced", dueDate: "2024-08-15", priority: "medium" }],
      },
      {
        id: "EMP-003",
        name: "Emily Davis",
        role: "CNA",
        department: "Home Health",
        hireDate: "2024-01-10",
        annualRequirement: 12,
        completedHours: 3.25,
        inProgressHours: 1.5,
        remainingHours: 7.25,
        complianceStatus: "behind",
        lastTrainingDate: "2024-01-10",
        nextDeadline: "2024-03-31",
        completedTrainings: [
          {
            id: "IS-004",
            title: "HIPAA Privacy & Security Update",
            completionDate: "2024-01-10",
            score: 85,
            ceuHours: 1.0,
            certificate: "CERT-2024-005",
          },
        ],
        inProgressTrainings: [
          {
            id: "IS-002",
            title: "Medication Administration Safety",
            startDate: "2024-01-22",
            progress: 25,
            estimatedCompletion: "2024-02-10",
            ceuHours: 1.5,
          },
        ],
        upcomingDeadlines: [
          { training: "Medication Safety", dueDate: "2024-06-30", priority: "high" },
          { training: "Infection Control", dueDate: "2024-03-31", priority: "urgent" },
        ],
      },
    ]

    let filteredProgress = employeeProgress

    // Apply filters
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
        Math.round(
          (employeeProgress.reduce((sum, emp) => sum + (emp.completedHours / emp.annualRequirement) * 100, 0) /
            employeeProgress.length) *
            10,
        ) / 10,
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
    const { employeeId, trainingId, action, data } = await request.json()

    if (!employeeId || !trainingId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let result = {}

    switch (action) {
      case "enroll":
        result = {
          employeeId,
          trainingId,
          enrollmentDate: new Date().toISOString(),
          status: "enrolled",
          progress: 0,
        }
        console.log(`Employee ${employeeId} enrolled in training ${trainingId}`)
        break

      case "start":
        result = {
          employeeId,
          trainingId,
          startDate: new Date().toISOString(),
          status: "in_progress",
          progress: 0,
        }
        console.log(`Employee ${employeeId} started training ${trainingId}`)
        break

      case "progress":
        result = {
          employeeId,
          trainingId,
          progress: data.progress || 0,
          lastAccessed: new Date().toISOString(),
          status: data.progress >= 100 ? "completed" : "in_progress",
        }
        console.log(`Employee ${employeeId} progress updated for training ${trainingId}: ${data.progress}%`)
        break

      case "complete":
        result = {
          employeeId,
          trainingId,
          completionDate: new Date().toISOString(),
          status: "completed",
          progress: 100,
          score: data.score || 0,
          ceuHours: data.ceuHours || 0,
          certificate: `CERT-${Date.now()}`,
        }
        console.log(`Employee ${employeeId} completed training ${trainingId} with score ${data.score}%`)
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
