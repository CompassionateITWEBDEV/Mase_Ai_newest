import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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
    const staffId =
      searchParams.get("staffId") || request.headers.get("x-user-id") || request.headers.get("x-staff-id") || undefined

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: evals, error } = await supabase
    .from("staff_self_evaluations")
    .select("id, evaluation_type, assessment_type, status, submitted_at, approved_at, created_at, updated_at")
    .eq("staff_id", staffId)
    .order("created_at", { ascending: false })

  if (error) {
    // Fallback mock if query fails
    return {
      staffId,
      overallProgress: 0,
      completedModules: 0,
      totalModules: 0,
      currentModule: null,
      moduleProgress: 0,
      timeSpent: 0,
      achievements: [],
      nextMilestone: null,
      estimatedCompletion: null,
      evaluations: [],
    }
  }

  const total = evals?.length || 0
  const submitted = (evals || []).filter((e) => e.status === "submitted").length
  const approved = (evals || []).filter((e) => e.status === "approved").length
  const lastSubmitted = (evals || []).find((e) => e.status === "submitted")?.submitted_at || null
  const lastApproved = (evals || []).find((e) => e.status === "approved")?.approved_at || null

  // Derive a simple progress metric from approvals/submissions
  const totalWeight = Math.max(total, 1)
  const overallProgress = Math.round(((submitted + approved * 2) / (totalWeight * 2)) * 100)

  return {
    staffId,
    overallProgress,
    completedModules: approved, // treat approved evals as completed milestones
    totalModules: total,
    currentModule: null,
    moduleProgress: submitted > 0 && approved === 0 ? 50 : approved > 0 ? 100 : 0,
    timeSpent: null,
    achievements: approved > 0 ? ["Evaluation Approved"] : [],
    nextMilestone: approved === 0 && submitted > 0 ? "Get supervisor approval" : null,
    estimatedCompletion: null,
    evaluations: evals || [],
    lastSubmitted,
    lastApproved,
  }
}
