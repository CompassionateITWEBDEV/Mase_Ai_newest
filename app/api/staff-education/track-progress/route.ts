import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { staffId, moduleId, progress, completed, timeSpent } = await request.json()

    // Update progress in database
    const progressUpdate = await updateModuleProgress({
      staffId,
      moduleId,
      progress,
      completed,
      timeSpent,
      timestamp: new Date().toISOString(),
    })

    // Check if improvement plan milestones are met
    const milestoneCheck = await checkMilestones(staffId)

    // Update staff performance metrics
    const performanceUpdate = await updatePerformanceMetrics(staffId)

    // Generate recommendations if needed
    const recommendations = await generateProgressRecommendations(staffId, progressUpdate)

    return NextResponse.json({
      success: true,
      data: {
        progressUpdate,
        milestoneCheck,
        performanceUpdate,
        recommendations,
      },
    })
  } catch (error) {
    console.error("Error tracking education progress:", error)
    return NextResponse.json({ success: false, error: "Failed to track progress" }, { status: 500 })
  }
}

async function updateModuleProgress(data: any) {
  // In real implementation, update database
  console.log("Updating module progress:", data)

  return {
    staffId: data.staffId,
    moduleId: data.moduleId,
    progress: data.progress,
    completed: data.completed,
    timeSpent: data.timeSpent,
    updatedAt: data.timestamp,
  }
}

async function checkMilestones(staffId: string) {
  // Check if staff has reached any milestones
  const milestones = [
    {
      id: "first-module-complete",
      name: "First Module Completed",
      description: "Successfully completed first education module",
      achieved: true,
      achievedDate: new Date().toISOString(),
    },
    {
      id: "50-percent-progress",
      name: "50% Plan Progress",
      description: "Reached 50% completion of improvement plan",
      achieved: false,
      targetDate: "2024-01-25",
    },
  ]

  return milestones
}

async function updatePerformanceMetrics(staffId: string) {
  // Calculate updated performance metrics based on education progress
  const metrics = {
    documentationScore: 91, // Improved from 89
    improvementTrend: "+7.3%", // Improved from +5.2%
    consistencyScore: 82, // Improved from 78
    clinicalAccuracy: 94, // Improved from 92
    lastUpdated: new Date().toISOString(),
  }

  return metrics
}

async function generateProgressRecommendations(staffId: string, progressData: any) {
  const recommendations = []

  if (progressData.progress < 50) {
    recommendations.push({
      type: "encouragement",
      message: "Keep up the great work! You're making steady progress.",
      action: "Continue with current modules",
    })
  }

  if (progressData.completed) {
    recommendations.push({
      type: "achievement",
      message: "Congratulations on completing this module!",
      action: "Apply learned concepts in your next documentation",
    })
  }

  return recommendations
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    if (!staffId) {
      return NextResponse.json({ success: false, error: "Staff ID is required" }, { status: 400 })
    }

    // Get staff education progress
    const progress = await getStaffEducationProgress(staffId)

    return NextResponse.json({
      success: true,
      data: progress,
    })
  } catch (error) {
    console.error("Error getting education progress:", error)
    return NextResponse.json({ success: false, error: "Failed to get progress" }, { status: 500 })
  }
}

async function getStaffEducationProgress(staffId: string) {
  // In real implementation, fetch from database
  return {
    staffId,
    overallProgress: 67,
    completedModules: 3,
    totalModules: 5,
    currentModule: "medication-documentation-mastery",
    moduleProgress: 45,
    timeSpent: 180, // minutes
    achievements: ["First Module Completed", "Clinical Writing Excellence Certified"],
    nextMilestone: "50% Plan Progress",
    estimatedCompletion: "2024-02-08",
  }
}
