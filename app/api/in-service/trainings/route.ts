import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const role = searchParams.get("role")
    const mandatory = searchParams.get("mandatory")

    // Mock in-service training data
    const trainings = [
      {
        id: "IS-001",
        title: "Advanced Wound Care Management",
        category: "Clinical Skills",
        type: "video_course",
        duration: 120,
        ceuHours: 2.0,
        description:
          "Comprehensive training on advanced wound assessment, treatment protocols, and documentation requirements",
        targetRoles: ["RN", "LPN"],
        difficulty: "Advanced",
        prerequisites: ["Basic Wound Care"],
        accreditation: "ANCC",
        expiryMonths: 24,
        mandatory: true,
        status: "active",
        enrolledCount: 45,
        completedCount: 32,
        averageScore: 87,
        createdDate: "2024-01-01",
        lastUpdated: "2024-01-15",
      },
      {
        id: "IS-002",
        title: "Medication Administration Safety",
        category: "Patient Safety",
        type: "interactive_course",
        duration: 90,
        ceuHours: 1.5,
        description: "Essential training on safe medication practices, error prevention, and documentation",
        targetRoles: ["RN", "LPN", "CNA"],
        difficulty: "Intermediate",
        prerequisites: [],
        accreditation: "Joint Commission",
        expiryMonths: 12,
        mandatory: true,
        status: "active",
        enrolledCount: 78,
        completedCount: 65,
        averageScore: 92,
        createdDate: "2024-01-01",
        lastUpdated: "2024-01-10",
      },
      {
        id: "IS-003",
        title: "Infection Control & Prevention",
        category: "Safety & Compliance",
        type: "blended_learning",
        duration: 75,
        ceuHours: 1.25,
        description: "Updated CDC guidelines for infection prevention in healthcare settings",
        targetRoles: ["All"],
        difficulty: "Basic",
        prerequisites: [],
        accreditation: "CDC",
        expiryMonths: 12,
        mandatory: true,
        status: "active",
        enrolledCount: 156,
        completedCount: 142,
        averageScore: 89,
        createdDate: "2023-12-01",
        lastUpdated: "2024-01-05",
      },
      {
        id: "IS-004",
        title: "HIPAA Privacy & Security Update",
        category: "Compliance",
        type: "online_course",
        duration: 60,
        ceuHours: 1.0,
        description: "Annual HIPAA training with latest privacy and security requirements",
        targetRoles: ["All"],
        difficulty: "Basic",
        prerequisites: [],
        accreditation: "HHS",
        expiryMonths: 12,
        mandatory: true,
        status: "active",
        enrolledCount: 156,
        completedCount: 156,
        averageScore: 94,
        createdDate: "2023-11-01",
        lastUpdated: "2024-01-01",
      },
      {
        id: "IS-005",
        title: "Physical Therapy Techniques",
        category: "Clinical Skills",
        type: "hands_on_workshop",
        duration: 180,
        ceuHours: 3.0,
        description: "Advanced physical therapy techniques and patient mobility training",
        targetRoles: ["PT", "PTA"],
        difficulty: "Advanced",
        prerequisites: ["Basic PT Principles"],
        accreditation: "APTA",
        expiryMonths: 24,
        mandatory: false,
        status: "active",
        enrolledCount: 12,
        completedCount: 8,
        averageScore: 85,
        createdDate: "2024-01-15",
        lastUpdated: "2024-01-20",
      },
    ]

    let filteredTrainings = trainings

    // Apply filters
    if (category && category !== "all") {
      filteredTrainings = filteredTrainings.filter((t) => t.category === category)
    }

    if (role && role !== "all") {
      filteredTrainings = filteredTrainings.filter((t) => t.targetRoles.includes(role) || t.targetRoles.includes("All"))
    }

    if (mandatory !== null) {
      const isMandatory = mandatory === "true"
      filteredTrainings = filteredTrainings.filter((t) => t.mandatory === isMandatory)
    }

    return NextResponse.json({
      success: true,
      trainings: filteredTrainings,
      total: filteredTrainings.length,
      summary: {
        totalTrainings: trainings.length,
        activeTrainings: trainings.filter((t) => t.status === "active").length,
        mandatoryTrainings: trainings.filter((t) => t.mandatory).length,
        totalEnrolled: trainings.reduce((sum, t) => sum + t.enrolledCount, 0),
        totalCompleted: trainings.reduce((sum, t) => sum + t.completedCount, 0),
        averageCompletionRate:
          Math.round(
            (trainings.reduce((sum, t) => sum + (t.completedCount / t.enrolledCount) * 100, 0) / trainings.length) * 10,
          ) / 10,
      },
    })
  } catch (error) {
    console.error("Error fetching trainings:", error)
    return NextResponse.json({ error: "Failed to fetch trainings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const trainingData = await request.json()

    // Validate required fields
    const requiredFields = ["title", "category", "duration", "ceuHours", "description", "targetRoles"]
    for (const field of requiredFields) {
      if (!trainingData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create new training
    const newTraining = {
      id: `IS-${Date.now()}`,
      ...trainingData,
      status: "draft",
      enrolledCount: 0,
      completedCount: 0,
      averageScore: 0,
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      modules: trainingData.modules || [],
      quiz: trainingData.quiz || {
        questions: 10,
        passingScore: 80,
        attempts: 3,
      },
    }

    console.log(`New in-service training created: ${newTraining.title} (${newTraining.id})`)

    return NextResponse.json({
      success: true,
      training: newTraining,
      message: "Training created successfully",
    })
  } catch (error) {
    console.error("Error creating training:", error)
    return NextResponse.json({ error: "Failed to create training" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { trainingId, ...updateData } = await request.json()

    if (!trainingId) {
      return NextResponse.json({ error: "Training ID required" }, { status: 400 })
    }

    // Mock update logic
    const updatedTraining = {
      id: trainingId,
      ...updateData,
      lastUpdated: new Date().toISOString(),
    }

    console.log(`Training updated: ${trainingId}`)

    return NextResponse.json({
      success: true,
      training: updatedTraining,
      message: "Training updated successfully",
    })
  } catch (error) {
    console.error("Error updating training:", error)
    return NextResponse.json({ error: "Failed to update training" }, { status: 500 })
  }
}
