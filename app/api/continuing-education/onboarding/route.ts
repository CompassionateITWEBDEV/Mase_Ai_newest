import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { employeeId, role } = await request.json()

    if (!employeeId || !role) {
      return NextResponse.json({ error: "Employee ID and role required" }, { status: 400 })
    }

    // Define role-specific onboarding modules
    const baseModules = [
      {
        id: "MOD-001",
        title: "Bloodborne Pathogens",
        description: "OSHA-required training on bloodborne pathogen exposure control",
        dueWithin: 7,
        category: "Safety",
        estimatedTime: 45,
        required: true,
        status: "assigned",
      },
      {
        id: "MOD-002",
        title: "Infection Control & Hand Hygiene",
        description: "CDC guidelines for infection prevention in healthcare settings",
        dueWithin: 7,
        category: "Safety",
        estimatedTime: 30,
        required: true,
        status: "assigned",
      },
      {
        id: "MOD-003",
        title: "HIPAA & Confidentiality",
        description: "Patient privacy and confidentiality requirements",
        dueWithin: 3,
        category: "Compliance",
        estimatedTime: 60,
        required: true,
        status: "assigned",
      },
      {
        id: "MOD-004",
        title: "Emergency Preparedness",
        description: "Emergency response procedures and protocols",
        dueWithin: 14,
        category: "Safety",
        estimatedTime: 45,
        required: true,
        status: "assigned",
      },
      {
        id: "MOD-005",
        title: "Patient Rights & Ethics",
        description: "Patient rights, ethical considerations, and professional conduct",
        dueWithin: 14,
        category: "Ethics",
        estimatedTime: 40,
        required: true,
        status: "assigned",
      },
      {
        id: "MOD-006",
        title: "Abuse, Neglect, and Exploitation Reporting",
        description: "Mandatory reporting requirements and procedures",
        dueWithin: 7,
        category: "Compliance",
        estimatedTime: 35,
        required: true,
        status: "assigned",
      },
      {
        id: "MOD-007",
        title: "Safety & Fire Procedures",
        description: "Workplace safety and fire prevention protocols",
        dueWithin: 14,
        category: "Safety",
        estimatedTime: 30,
        required: true,
        status: "assigned",
      },
    ]

    // Add role-specific modules
    const roleSpecificModules = []

    if (["HHA", "PT", "PTA"].includes(role)) {
      roleSpecificModules.push({
        id: "MOD-008",
        title: "Equipment Use & Maintenance",
        description: "Proper use and maintenance of medical equipment",
        dueWithin: 21,
        category: "Clinical",
        estimatedTime: 50,
        required: true,
        status: "assigned",
      })
    }

    if (["RN", "LPN"].includes(role)) {
      roleSpecificModules.push({
        id: "MOD-009",
        title: "Wound Documentation Standards",
        description: "Proper wound assessment and documentation procedures",
        dueWithin: 14,
        category: "Clinical",
        estimatedTime: 45,
        required: true,
        status: "assigned",
      })
    }

    const allModules = [...baseModules, ...roleSpecificModules]

    // Calculate due dates
    const today = new Date()
    const modulesWithDueDates = allModules.map((module) => ({
      ...module,
      assignedDate: today.toISOString(),
      dueDate: new Date(today.getTime() + module.dueWithin * 24 * 60 * 60 * 1000).toISOString(),
    }))

    // Create onboarding record
    const onboardingRecord = {
      employeeId,
      role,
      assignedDate: today.toISOString(),
      totalModules: modulesWithDueDates.length,
      completedModules: 0,
      status: "in_progress",
      modules: modulesWithDueDates,
      workRestrictions: ["patient_assignments"], // Restrict until onboarding complete
    }

    console.log(`Onboarding assigned to employee ${employeeId} (${role}): ${modulesWithDueDates.length} modules`)

    return NextResponse.json({
      success: true,
      onboarding: onboardingRecord,
      message: `${modulesWithDueDates.length} onboarding modules assigned`,
    })
  } catch (error) {
    console.error("Onboarding assignment error:", error)
    return NextResponse.json({ error: "Failed to assign onboarding" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { employeeId, moduleId, status, completionDate, notes } = await request.json()

    if (!employeeId || !moduleId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Mock module completion
    const moduleCompletion = {
      employeeId,
      moduleId,
      status,
      completionDate: completionDate || new Date().toISOString(),
      notes: notes || "",
      completedBy: "system", // In real implementation, get from auth
    }

    // Check if all modules are complete
    const mockCompletedModules = 8 // This would come from database
    const mockTotalModules = 9

    let onboardingStatus = "in_progress"
    let workRestrictions = ["patient_assignments"]

    if (mockCompletedModules >= mockTotalModules) {
      onboardingStatus = "completed"
      workRestrictions = [] // Remove restrictions when onboarding complete
      console.log(`Employee ${employeeId} completed onboarding - work restrictions lifted`)
    }

    return NextResponse.json({
      success: true,
      moduleCompletion,
      onboardingStatus,
      workRestrictions,
      message: status === "completed" ? "Module completed successfully" : "Module status updated",
    })
  } catch (error) {
    console.error("Module completion error:", error)
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 })
    }

    // Mock onboarding progress
    const onboardingProgress = {
      employeeId,
      role: "RN",
      assignedDate: "2024-01-10T09:00:00Z",
      totalModules: 9,
      completedModules: 7,
      status: "in_progress",
      workRestrictions: ["patient_assignments"],
      modules: [
        {
          id: "MOD-001",
          title: "Bloodborne Pathogens",
          status: "completed",
          completionDate: "2024-01-12T14:30:00Z",
          dueDate: "2024-01-17T09:00:00Z",
        },
        {
          id: "MOD-002",
          title: "Infection Control & Hand Hygiene",
          status: "completed",
          completionDate: "2024-01-13T10:15:00Z",
          dueDate: "2024-01-17T09:00:00Z",
        },
        {
          id: "MOD-003",
          title: "HIPAA & Confidentiality",
          status: "completed",
          completionDate: "2024-01-11T16:45:00Z",
          dueDate: "2024-01-13T09:00:00Z",
        },
        {
          id: "MOD-004",
          title: "Emergency Preparedness",
          status: "completed",
          completionDate: "2024-01-15T11:20:00Z",
          dueDate: "2024-01-24T09:00:00Z",
        },
        {
          id: "MOD-005",
          title: "Patient Rights & Ethics",
          status: "completed",
          completionDate: "2024-01-16T13:10:00Z",
          dueDate: "2024-01-24T09:00:00Z",
        },
        {
          id: "MOD-006",
          title: "Abuse, Neglect, and Exploitation Reporting",
          status: "completed",
          completionDate: "2024-01-14T15:30:00Z",
          dueDate: "2024-01-17T09:00:00Z",
        },
        {
          id: "MOD-007",
          title: "Safety & Fire Procedures",
          status: "completed",
          completionDate: "2024-01-18T09:45:00Z",
          dueDate: "2024-01-24T09:00:00Z",
        },
        {
          id: "MOD-009",
          title: "Wound Documentation Standards",
          status: "in_progress",
          completionDate: null,
          dueDate: "2024-01-24T09:00:00Z",
        },
        {
          id: "MOD-010",
          title: "Medication Administration Safety",
          status: "assigned",
          completionDate: null,
          dueDate: "2024-01-31T09:00:00Z",
        },
      ],
    }

    return NextResponse.json({
      success: true,
      onboarding: onboardingProgress,
    })
  } catch (error) {
    console.error("Error fetching onboarding progress:", error)
    return NextResponse.json({ error: "Failed to fetch onboarding progress" }, { status: 500 })
  }
}
