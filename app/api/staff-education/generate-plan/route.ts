import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { staffId, documentationPatterns, recentErrors, performanceData } = await request.json()

    // AI-powered analysis of staff documentation patterns
    const analysisResult = await analyzeDocumentationPatterns({
      staffId,
      documentationPatterns,
      recentErrors,
      performanceData,
    })

    // Generate personalized improvement plan
    const improvementPlan = await generatePersonalizedPlan(analysisResult)

    // Create education assignments
    const educationAssignments = await createEducationAssignments(staffId, improvementPlan)

    return NextResponse.json({
      success: true,
      data: {
        analysisResult,
        improvementPlan,
        educationAssignments,
      },
    })
  } catch (error) {
    console.error("Error generating staff education plan:", error)
    return NextResponse.json({ success: false, error: "Failed to generate education plan" }, { status: 500 })
  }
}

async function analyzeDocumentationPatterns(data: any) {
  // AI analysis of documentation patterns
  const analysis = {
    strengths: [],
    weaknesses: [],
    patterns: {},
    riskFactors: [],
    improvementOpportunities: [],
  }

  // Analyze documentation style
  if (data.documentationPatterns) {
    // Check note length consistency
    if (data.documentationPatterns.averageNoteLength < 200) {
      analysis.weaknesses.push("Notes tend to be too brief, missing important details")
      analysis.improvementOpportunities.push("Increase documentation detail level")
    }

    // Check clinical accuracy
    if (data.documentationPatterns.clinicalAccuracy < 90) {
      analysis.weaknesses.push("Clinical accuracy needs improvement")
      analysis.riskFactors.push("High risk for compliance issues")
    }

    // Check consistency
    if (data.documentationPatterns.consistencyScore < 80) {
      analysis.weaknesses.push("Inconsistent documentation format and style")
      analysis.improvementOpportunities.push("Standardize documentation approach")
    }
  }

  // Analyze recent errors
  if (data.recentErrors && data.recentErrors.length > 0) {
    const errorTypes = data.recentErrors.reduce((acc: any, error: any) => {
      acc[error.errorType] = (acc[error.errorType] || 0) + 1
      return acc
    }, {})

    analysis.patterns.commonErrors = errorTypes

    // Identify most frequent error types
    const mostCommonError = Object.keys(errorTypes).reduce((a, b) => (errorTypes[a] > errorTypes[b] ? a : b))

    analysis.riskFactors.push(`Recurring ${mostCommonError} errors`)
  }

  return analysis
}

async function generatePersonalizedPlan(analysis: any) {
  const plan = {
    duration: "30 days",
    phases: [],
    goals: [],
    milestones: [],
    recommendedModules: [],
    targetMetrics: {},
  }

  // Phase 1: Address critical issues
  if (analysis.riskFactors.length > 0) {
    plan.phases.push({
      phase: 1,
      name: "Critical Issue Resolution",
      duration: "Week 1-2",
      focus: "Address high-risk documentation gaps",
      modules: ["clinical-writing-101", "documentation-compliance"],
    })
  }

  // Phase 2: Skill building
  plan.phases.push({
    phase: 2,
    name: "Skill Enhancement",
    duration: "Week 2-3",
    focus: "Build on strengths and improve weak areas",
    modules: ["advanced-assessment", "patient-response-documentation"],
  })

  // Phase 3: Mastery and consistency
  plan.phases.push({
    phase: 3,
    name: "Mastery & Consistency",
    duration: "Week 3-4",
    focus: "Achieve consistent high-quality documentation",
    modules: ["documentation-mastery", "quality-assurance"],
  })

  // Set goals based on analysis
  plan.goals = [
    "Achieve 95% documentation accuracy",
    "Reduce error rate by 50%",
    "Improve consistency score to 90%",
    "Complete all assigned education modules",
  ]

  // Set target metrics
  plan.targetMetrics = {
    documentationScore: 95,
    clinicalAccuracy: 95,
    consistencyScore: 90,
    completeness: 95,
    timeliness: 90,
  }

  return plan
}

async function createEducationAssignments(staffId: string, plan: any) {
  const assignments = []

  for (const phase of plan.phases) {
    for (const moduleId of phase.modules) {
      assignments.push({
        staffId,
        moduleId,
        phase: phase.phase,
        assignedDate: new Date().toISOString(),
        dueDate: calculateDueDate(phase.duration),
        priority: phase.phase === 1 ? "High" : "Medium",
        status: "Assigned",
      })
    }
  }

  // In real implementation, save to database
  console.log(`Created ${assignments.length} education assignments for staff ${staffId}`)

  return assignments
}

function calculateDueDate(duration: string): string {
  const days = duration.includes("Week 1-2") ? 14 : duration.includes("Week 2-3") ? 21 : 28
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + days)
  return dueDate.toISOString().split("T")[0]
}
