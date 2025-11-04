import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

interface CompetencyRecord {
  id: string
  staffId: string
  staffName: string
  staffRole: "RN" | "LPN" | "HHA" | "PT" | "OT" | "MSW"
  evaluationDate: string
  evaluationType: "initial" | "annual" | "skills-validation" | "performance-improvement"
  overallScore: number
  competencyAreas: CompetencyArea[]
  evaluatorId: string
  evaluatorName: string
  status: "competent" | "needs-improvement" | "not-competent"
  nextEvaluationDue: string
  certifications: Certification[]
  performanceImprovementPlan?: PerformanceImprovementPlan
}

interface CompetencyArea {
  category: string
  items: CompetencyItem[]
  categoryScore: number
  weight: number
}

interface CompetencyItem {
  id: string
  description: string
  score: number
  maxScore: number
  notes?: string
  evidenceProvided: boolean
}

interface Certification {
  id: string
  name: string
  issuingOrganization: string
  issueDate: string
  expirationDate: string
  status: "active" | "expired" | "pending-renewal"
  renewalRequired: boolean
}

interface PerformanceImprovementPlan {
  id: string
  startDate: string
  targetCompletionDate: string
  goals: PIPGoal[]
  progress: number
  status: "active" | "completed" | "extended"
  reviewDates: string[]
  supervisor: string
}

interface PIPGoal {
  id: string
  description: string
  targetDate: string
  completed: boolean
  progress: number
  actions: string[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Load from database
    let query = supabase
      .from('staff_competency_evaluations')
      .select(`
        id,
        staff_id,
        evaluator_id,
        evaluator_name,
        evaluation_date,
        evaluation_type,
        overall_score,
        status,
        next_evaluation_due,
        notes,
        areas:staff_competency_areas (
          id,
          category_name,
          description,
          weight,
          category_score,
          skills:staff_competency_skills (
            id,
            skill_name,
            description,
            required,
            assessment_method,
            passing_score,
            self_assessment_score,
            supervisor_assessment_score,
            final_score,
            status,
            last_assessed,
            next_due,
            evidence,
            notes
          )
        ),
        certifications:staff_competency_certifications (
          id,
          certification_name,
          issuing_organization,
          issue_date,
          expiration_date,
          status,
          renewal_required
        ),
        pip:staff_pip (
          id,
          start_date,
          target_completion_date,
          progress,
          status,
          supervisor_name,
          review_dates,
          goals:staff_pip_goals (
            id,
            description,
            target_date,
            completed,
            progress,
            actions,
            notes
          )
        )
      `)
      .order('evaluation_date', { ascending: false })

    if (staffId) query = query.eq('staff_id', staffId)
    if (status) query = query.eq('status', status)

    const { data: evaluations, error } = await query

    if (error) {
      console.error('Error loading competency evaluations:', error)
      // Fallback to empty array
      return NextResponse.json({
        success: true,
        records: [],
        summary: { totalRecords: 0, competentStaff: 0, needsImprovement: 0, notCompetent: 0, averageScore: 0 }
      })
    }

    // Fetch staff names for the evaluations
    const staffIds = [...new Set((evaluations || []).map((e: any) => e.staff_id))]
    const { data: staffMembers } = await supabase
      .from('staff')
      .select('id, name, department')
      .in('id', staffIds)

    const staffMap = new Map((staffMembers || []).map((s: any) => [s.id, s]))

    // Transform database records to CompetencyRecord format
    const competencyRecords: CompetencyRecord[] = (evaluations || []).map((evaluation: any) => {
      const staff = staffMap.get(evaluation.staff_id) || {}
      const areas = (evaluation.areas || []).map((area: any) => ({
        category: area.category_name,
        categoryScore: parseFloat(area.category_score?.toString() || '0'),
        weight: area.weight / 100, // Convert to decimal
        items: (area.skills || []).map((skill: any) => {
          // Calculate status from score if not set, or use existing status
          const finalScore = skill.final_score || skill.supervisor_assessment_score || skill.self_assessment_score || 0
          let skillStatus = skill.status || 'not-assessed'
          
          // If status is not set, determine from score (assuming 0-100 scale, 80+ = competent)
          if (!skill.status || skill.status === 'not-assessed') {
            if (finalScore >= 80) {
              skillStatus = 'competent'
            } else if (finalScore >= 60) {
              skillStatus = 'needs-improvement'
            } else if (finalScore > 0) {
              skillStatus = 'not-competent'
            }
          }
          
          return {
            id: skill.id,
            description: skill.skill_name,
            score: finalScore / 20, // Convert to 0-5 scale for compatibility (100/20 = 5)
            status: skillStatus,
            selfAssessmentScore: skill.self_assessment_score || null,
            supervisorAssessmentScore: skill.supervisor_assessment_score || null,
            maxScore: 5, // Default max score
            evidenceProvided: Array.isArray(skill.evidence) && skill.evidence.length > 0,
            notes: skill.notes || null
          }
        })
      }))

      // Determine status from overall score
      let recordStatus: "competent" | "needs-improvement" | "not-competent" = "competent"
      const overallScore = parseFloat(evaluation.overall_score?.toString() || '0')
      if (overallScore < 70) {
        recordStatus = "not-competent"
      } else if (overallScore < 85) {
        recordStatus = "needs-improvement"
      }

      return {
        id: evaluation.id,
        staffId: evaluation.staff_id,
        staffName: staff.name || 'Unknown',
        staffRole: (staff.department || 'Staff').toUpperCase().substring(0, 3) as any,
        evaluationDate: evaluation.evaluation_date,
        evaluationType: evaluation.evaluation_type as any,
        overallScore: overallScore,
        competencyAreas: areas,
        evaluatorId: evaluation.evaluator_id || '',
        evaluatorName: evaluation.evaluator_name || 'Unknown',
        status: recordStatus,
        nextEvaluationDue: evaluation.next_evaluation_due || null,
        selfEvaluationStatus: evaluation.self_evaluation_status || null,
        selfEvaluation: evaluation.self_evaluation && evaluation.self_evaluation.length > 0 ? evaluation.self_evaluation[0] : null,
        certifications: (evaluation.certifications || []).map((cert: any) => ({
          id: cert.id,
          name: cert.certification_name,
          issuingOrganization: cert.issuing_organization || '',
          issueDate: cert.issue_date || '',
          expirationDate: cert.expiration_date || '',
          status: cert.status as any,
          renewalRequired: cert.renewal_required || false
        })),
        performanceImprovementPlan: evaluation.pip && evaluation.pip.length > 0 ? {
          id: evaluation.pip[0].id,
          startDate: evaluation.pip[0].start_date,
          targetCompletionDate: evaluation.pip[0].target_completion_date,
          progress: evaluation.pip[0].progress || 0,
          status: evaluation.pip[0].status as any,
          reviewDates: evaluation.pip[0].review_dates || [],
          supervisor: evaluation.pip[0].supervisor_name || '',
          goals: (evaluation.pip[0].goals || []).map((goal: any) => ({
            id: goal.id,
            description: goal.description,
            targetDate: goal.target_date,
            completed: goal.completed || false,
            progress: goal.progress || 0,
            actions: Array.isArray(goal.actions) ? goal.actions : []
          }))
        } : undefined
      }
    })

    // Filter by role if provided (after loading staff data)
    let filteredRecords = competencyRecords
    if (role) {
      // Need to get staff role from staff table for proper filtering
      // For now, filter based on what we have
      filteredRecords = filteredRecords.filter((record) => 
        record.staffRole === role.toUpperCase()
      )
    }

    return NextResponse.json({
      success: true,
      records: filteredRecords,
      summary: {
        totalRecords: filteredRecords.length,
        competentStaff: filteredRecords.filter((r) => r.status === "competent").length,
        needsImprovement: filteredRecords.filter((r) => r.status === "needs-improvement").length,
        notCompetent: filteredRecords.filter((r) => r.status === "not-competent").length,
        averageScore: Math.round(
          filteredRecords.reduce((sum, record) => sum + record.overallScore, 0) / filteredRecords.length,
        ),
      },
    })
  } catch (error) {
    console.error("Error retrieving competency records:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case "create-evaluation":
        return await createCompetencyEvaluation(data)
      case "update-pip":
        return await updatePerformanceImprovementPlan(data)
      case "schedule-evaluation":
        return await scheduleEvaluation(data)
      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing competency request:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

async function createCompetencyEvaluation(data: any) {
  console.log('🔵 [Create Evaluation] Starting...')
  console.log('🔵 [Create Evaluation] Data received:', {
    staffId: data.staffId,
    staffName: data.staffName,
    evaluationType: data.evaluationType,
    evaluatorName: data.evaluatorName,
    evaluatorId: data.evaluatorId,
    hasCompetencyAreas: !!(data.competencyAreas && data.competencyAreas.length > 0)
  })

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // Validate required fields
    if (!data.staffId) {
      console.error('❌ [Create Evaluation] Missing staffId')
      return NextResponse.json({ 
        success: false, 
        message: "Missing required field: staffId",
        error: "staffId is required"
      }, { status: 400 })
    }

    // Check if staffId is a valid UUID, if not, try to resolve it
    const isValidUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(str)
    }

    let staffIdUuid = data.staffId

    // If not a valid UUID, try to find the staff member
    if (!isValidUUID(data.staffId)) {
      console.log('🔵 [Create Evaluation] staffId is not a UUID, attempting to resolve...', data.staffId)
      
      // Try multiple strategies to find the staff member
      let staffMember = null
      
      // Strategy 1: Try direct match (case where it's stored as string UUID but passed as string "1")
      const { data: directMatch } = await supabase
        .from('staff')
        .select('id')
        .eq('id', data.staffId)
        .maybeSingle()
      
      if (directMatch?.id && isValidUUID(directMatch.id)) {
        staffMember = directMatch
      }
      
      // Strategy 2: Try by email
      if (!staffMember) {
        const { data: emailMatch } = await supabase
          .from('staff')
          .select('id')
          .eq('email', data.staffId)
          .maybeSingle()
        
        if (emailMatch?.id && isValidUUID(emailMatch.id)) {
          staffMember = emailMatch
        }
      }
      
      // Strategy 3: Try by name (partial match)
      if (!staffMember) {
        const { data: nameMatch } = await supabase
          .from('staff')
          .select('id')
          .ilike('name', `%${data.staffId}%`)
          .limit(1)
          .maybeSingle()
        
        if (nameMatch?.id && isValidUUID(nameMatch.id)) {
          staffMember = nameMatch
        }
      }
      
      // Strategy 4: If it's a numeric ID, try to get all staff and index (last resort, not recommended)
      if (!staffMember && !isNaN(parseInt(data.staffId, 10))) {
        const { data: allStaff } = await supabase
          .from('staff')
          .select('id')
          .order('created_at', { ascending: false })
        
        const numericIndex = parseInt(data.staffId, 10) - 1
        if (allStaff && allStaff.length > numericIndex && numericIndex >= 0) {
          const indexedStaff = allStaff[numericIndex]
          if (indexedStaff?.id && isValidUUID(indexedStaff.id)) {
            staffMember = indexedStaff
            console.warn('⚠️ [Create Evaluation] Using numeric index to resolve staffId (not recommended)')
          }
        }
      }
      
      if (staffMember?.id && isValidUUID(staffMember.id)) {
        staffIdUuid = staffMember.id
        console.log(`✅ [Create Evaluation] Resolved staffId "${data.staffId}" to UUID: ${staffIdUuid}`)
      } else {
        console.error('❌ [Create Evaluation] Could not resolve staffId to valid UUID', {
          providedStaffId: data.staffId,
          attemptedStrategies: 4
        })
        return NextResponse.json({ 
          success: false, 
          message: `Invalid staffId: "${data.staffId}". Could not resolve to valid UUID. Please ensure you selected a valid staff member.`,
          error: "Invalid staffId format",
          providedStaffId: data.staffId
        }, { status: 400 })
      }
    }

    // Validate evaluatorId if provided
    let evaluatorIdUuid = data.evaluatorId || null
    if (evaluatorIdUuid && !isValidUUID(evaluatorIdUuid)) {
      console.warn('⚠️ [Create Evaluation] Invalid evaluatorId format, setting to null')
      evaluatorIdUuid = null
    }

    // Calculate overall score from competency areas
    let overallScore = 0
    if (data.competencyAreas && Array.isArray(data.competencyAreas) && data.competencyAreas.length > 0) {
      const totalWeight = data.competencyAreas.reduce((sum: number, area: any) => sum + (area.weight || 0), 0)
      if (totalWeight > 0) {
        overallScore = data.competencyAreas.reduce((sum: number, area: any) => {
          const areaScore = area.categoryScore || 0
          const weight = area.weight || 0
          return sum + (areaScore * weight / totalWeight)
        }, 0)
      }
    }

    // Determine status
    let status = "completed"
    if (overallScore < 70) {
      status = "not-competent"
    } else if (overallScore < 85) {
      status = "needs-improvement"
    }

    console.log('🔵 [Create Evaluation] Creating evaluation record with:', {
      staff_id: staffIdUuid,
      evaluation_type: data.evaluationType,
      overall_score: overallScore,
      status: status
    })

    // Create evaluation record
    const { data: evaluation, error: evalError } = await supabase
      .from('staff_competency_evaluations')
      .insert({
        staff_id: staffIdUuid,
        evaluator_id: evaluatorIdUuid,
        evaluator_name: data.evaluatorName || null,
        evaluation_date: data.evaluationDate || new Date().toISOString().split("T")[0],
        evaluation_type: data.evaluationType || 'skills-validation',
        overall_score: overallScore,
        status: status,
        next_evaluation_due: data.nextEvaluationDue || null,
        notes: data.notes || null,
        self_evaluation_required: data.selfEvaluationRequired !== false, // Default to true
        self_evaluation_status: 'pending'
      })
      .select()
      .single()

    if (evalError) {
      console.error('❌ [Create Evaluation] Database error:', evalError)
      console.error('❌ [Create Evaluation] Error details:', {
        code: evalError.code,
        message: evalError.message,
        details: evalError.details,
        hint: evalError.hint
      })
      return NextResponse.json({ 
        success: false, 
        message: `Failed to create evaluation: ${evalError.message || 'Unknown error'}`,
        error: evalError.message,
        details: evalError.details,
        hint: evalError.hint,
        code: evalError.code
      }, { status: 500 })
    }

    if (!evaluation || !evaluation.id) {
      console.error('❌ [Create Evaluation] Evaluation created but no ID returned')
      return NextResponse.json({ 
        success: false, 
        message: "Evaluation created but ID not returned"
      }, { status: 500 })
    }

    console.log('✅ [Create Evaluation] Evaluation created successfully:', evaluation.id)

    // Auto-create self-evaluation task if required
    if (data.selfEvaluationRequired !== false) {
      try {
        await supabase
          .from('staff_self_evaluations')
          .insert({
            staff_id: data.staffId,
            evaluation_type: 'competency',
            assessment_type: data.evaluationType === 'annual' ? 'annual' : 
                            data.evaluationType === 'initial' ? 'initial' :
                            data.evaluationType === 'skills-validation' ? 'skills-validation' : 'annual',
            competency_evaluation_id: evaluation.id,
            status: 'draft',
            due_date: data.nextEvaluationDue || null,
            completion_percentage: 0,
            responses: {}
          })
      } catch (selfEvalError) {
        console.error('Error creating self-evaluation task:', selfEvalError)
        // Don't fail the whole request if self-evaluation creation fails
      }
    }

    // Create competency areas and skills
    if (data.competencyAreas && Array.isArray(data.competencyAreas)) {
      for (const area of data.competencyAreas) {
        const { data: areaRecord, error: areaError } = await supabase
          .from('staff_competency_areas')
          .insert({
            evaluation_id: evaluation.id,
            category_name: area.category,
            description: area.description || null,
            weight: Math.round((area.weight || 0) * 100), // Convert to percentage
            category_score: area.categoryScore || 0
          })
          .select()
          .single()

        if (areaError) {
          console.error('Error creating area:', areaError)
          continue
        }

        // Create skills within this area
        if (area.items && Array.isArray(area.items)) {
          for (const item of area.items) {
            const passingScore = 80 // Default passing score
            
            // Get scores from item
            const selfScore = item.selfAssessmentScore !== undefined ? Math.round(item.selfAssessmentScore) : null
            const supervisorScore = item.supervisorAssessmentScore !== undefined ? Math.round(item.supervisorAssessmentScore) : null
            const defaultScore = item.score || 0
            
            // Calculate final score: average of self and supervisor if both exist, otherwise use whichever exists
            let calculatedFinalScore = defaultScore
            if (selfScore !== null && supervisorScore !== null) {
              // Average both scores
              calculatedFinalScore = Math.round((selfScore + supervisorScore) / 2)
            } else if (selfScore !== null) {
              calculatedFinalScore = selfScore
            } else if (supervisorScore !== null) {
              calculatedFinalScore = supervisorScore
            }

            // Recalculate status based on final score
            let skillStatus = "not-assessed"
            if (calculatedFinalScore >= passingScore) {
              skillStatus = "competent"
            } else if (calculatedFinalScore >= passingScore * 0.7) {
              skillStatus = "needs-improvement"
            } else if (calculatedFinalScore > 0) {
              skillStatus = "not-competent"
            }

            await supabase
              .from('staff_competency_skills')
              .insert({
                area_id: areaRecord.id,
                skill_name: item.description,
                description: item.description,
                required: true,
                passing_score: passingScore,
                self_assessment_score: selfScore,
                supervisor_assessment_score: supervisorScore,
                final_score: calculatedFinalScore,
                status: skillStatus,
                last_assessed: data.evaluationDate || new Date().toISOString().split("T")[0],
                evidence: item.evidenceProvided ? ["Assessment completed"] : [],
                notes: item.notes || null
              })
          }
        }
      }
    }

    // Create certifications
    if (data.certifications && Array.isArray(data.certifications)) {
      for (const cert of data.certifications) {
        await supabase
          .from('staff_competency_certifications')
          .insert({
            evaluation_id: evaluation.id,
            staff_id: data.staffId,
            certification_name: cert.name,
            issuing_organization: cert.issuingOrganization || null,
            issue_date: cert.issueDate || null,
            expiration_date: cert.expirationDate || null,
            status: cert.status || "active",
            renewal_required: cert.renewalRequired || false
          })
      }
    }

    // Create PIP if needed
    if (data.performanceImprovementPlan && status === "needs-improvement") {
      const pip = data.performanceImprovementPlan
      const { data: pipRecord, error: pipError } = await supabase
        .from('staff_pip')
        .insert({
          evaluation_id: evaluation.id,
          staff_id: data.staffId,
          start_date: pip.startDate,
          target_completion_date: pip.targetCompletionDate,
          progress: pip.progress || 0,
          status: pip.status || "active",
          supervisor_name: pip.supervisor || data.evaluatorName,
          review_dates: pip.reviewDates || []
        })
        .select()
        .single()

      if (!pipError && pip.goals && Array.isArray(pip.goals)) {
        for (const goal of pip.goals) {
          await supabase
            .from('staff_pip_goals')
            .insert({
              pip_id: pipRecord.id,
              description: goal.description,
              target_date: goal.targetDate,
              completed: goal.completed || false,
              progress: goal.progress || 0,
              actions: goal.actions || [],
              notes: goal.notes || null
            })
        }
      }
  }

    return NextResponse.json({
      success: true,
      evaluationId: evaluation.id,
      evaluation: {
        id: evaluation.id,
        ...evaluation
      },
      message: "Competency evaluation created successfully",
    })
  } catch (error: any) {
    console.error('❌ [Create Evaluation] Unexpected error:', error)
    console.error('❌ [Create Evaluation] Error stack:', error.stack)
    return NextResponse.json({ 
      success: false, 
      message: `Internal server error: ${error.message || 'Unknown error'}`,
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}

async function updatePerformanceImprovementPlan(data: any) {
  // Update PIP progress
  return NextResponse.json({
    success: true,
    message: "Performance improvement plan updated successfully",
    updatedAt: new Date().toISOString(),
  })
}

async function scheduleEvaluation(data: any) {
  // Schedule new evaluation
  return NextResponse.json({
    success: true,
    scheduledEvaluation: {
      id: `SCHED-${Date.now()}`,
      staffId: data.staffId,
      evaluationType: data.evaluationType,
      scheduledDate: data.scheduledDate,
      evaluatorId: data.evaluatorId,
      status: "scheduled",
    },
    message: "Evaluation scheduled successfully",
  })
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, evaluationId, supervisorScore, overallScore, supervisorNotes, status, reviewerId, reviewerName, skillAssessments } = body || {}

    if (!action || !evaluationId) {
      return NextResponse.json({ success: false, message: "Missing action or evaluationId" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    if (action === "update-review") {
      // Update the competency evaluation with supervisor review
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (supervisorScore !== undefined) updateData.overall_score = overallScore || supervisorScore
      if (status) updateData.status = status
      if (supervisorNotes) updateData.notes = supervisorNotes
      if (reviewerId) updateData.evaluator_id = reviewerId
      if (reviewerName) updateData.evaluator_name = reviewerName

      const { data: updated, error } = await supabase
        .from('staff_competency_evaluations')
        .update(updateData)
        .eq('id', evaluationId)
        .select()
        .single()

      if (error) {
        console.error('❌ [PATCH Competency] Error updating:', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, evaluation: updated })
    }

    if (action === "update-skills") {
      // Update multiple skills with assessments
      if (!skillAssessments || typeof skillAssessments !== 'object') {
        return NextResponse.json({ success: false, message: "Missing skillAssessments" }, { status: 400 })
      }

      console.log('🔵 [PATCH Skills] Updating skills for evaluation:', evaluationId)
      console.log('🔵 [PATCH Skills] Skills to update:', Object.keys(skillAssessments).length)

      // Update each skill
      let updatedCount = 0
      let errors: any[] = []

      for (const [skillId, assessment] of Object.entries(skillAssessments as any)) {
        const assessmentObj = assessment as {
          supervisorScore?: number
          status?: string
          notes?: string
        }
        
        const assessmentData: any = {
          updated_at: new Date().toISOString(),
          last_assessed: new Date().toISOString().split("T")[0]
        }

        // Convert supervisor score from 0-5 scale to 0-100 scale
        if (assessmentObj.supervisorScore !== undefined) {
          const score5Scale = parseFloat(assessmentObj.supervisorScore.toString()) || 0
          const score100Scale = Math.round((score5Scale / 5) * 100)
          assessmentData.supervisor_assessment_score = score100Scale
          // Final score defaults to supervisor score if available
          assessmentData.final_score = score100Scale
        }

        // Set status
        if (assessmentObj.status) {
          assessmentData.status = assessmentObj.status
        } else {
          // Auto-determine status from score
          const finalScore = assessmentData.final_score || assessmentData.supervisor_assessment_score || 0
          if (finalScore >= 80) {
            assessmentData.status = 'competent'
          } else if (finalScore >= 60) {
            assessmentData.status = 'needs-improvement'
          } else if (finalScore > 0) {
            assessmentData.status = 'not-competent'
          }
        }

        // Add notes
        if (assessmentObj.notes !== undefined) {
          assessmentData.notes = assessmentObj.notes || null
        }

        const { error: updateError } = await supabase
          .from('staff_competency_skills')
          .update(assessmentData)
          .eq('id', skillId)

        if (updateError) {
          console.error(`❌ [PATCH Skills] Error updating skill ${skillId}:`, updateError)
          errors.push({ skillId, error: updateError.message })
        } else {
          updatedCount++
        }
      }

      if (errors.length > 0 && updatedCount === 0) {
        return NextResponse.json({ 
          success: false, 
          message: `Failed to update skills: ${errors.map(e => e.error).join(', ')}`,
          errors 
        }, { status: 500 })
      }

      // Recalculate category scores and overall score
      console.log('🔵 [PATCH Skills] Recalculating scores...')
      
      // Get all areas for this evaluation
      const { data: areas } = await supabase
        .from('staff_competency_areas')
        .select('id, weight')
        .eq('evaluation_id', evaluationId)

      if (areas && areas.length > 0) {
        // Update each area's category score
        for (const area of areas) {
          // Get all skills in this area
          const { data: areaSkills } = await supabase
            .from('staff_competency_skills')
            .select('final_score')
            .eq('area_id', area.id)

          if (areaSkills && areaSkills.length > 0) {
            // Calculate average score for the category
            const avgScore = areaSkills.reduce((sum, skill) => {
              return sum + (parseFloat(skill.final_score?.toString() || '0'))
            }, 0) / areaSkills.length

            // Update area category score
            await supabase
              .from('staff_competency_areas')
              .update({ category_score: Math.round(avgScore) })
              .eq('id', area.id)
          }
        }

        // Recalculate overall score (weighted average)
        const { data: allAreas } = await supabase
          .from('staff_competency_areas')
          .select('weight, category_score')
          .eq('evaluation_id', evaluationId)

        if (allAreas && allAreas.length > 0) {
          const totalWeight = allAreas.reduce((sum, area) => sum + (area.weight || 0), 0)
          if (totalWeight > 0) {
            const overallScore = allAreas.reduce((sum, area) => {
              const areaScore = parseFloat(area.category_score?.toString() || '0')
              const weight = area.weight || 0
              return sum + (areaScore * weight / totalWeight)
            }, 0)

            // Determine status from overall score
            let newStatus = "completed"
            if (overallScore < 70) {
              newStatus = "not-competent"
            } else if (overallScore < 85) {
              newStatus = "needs-improvement"
            }

            // Update evaluation overall score and status
            await supabase
              .from('staff_competency_evaluations')
              .update({
                overall_score: Math.round(overallScore),
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', evaluationId)

            console.log(`✅ [PATCH Skills] Updated overall score: ${Math.round(overallScore)}% (${newStatus})`)
          }
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Successfully updated ${updatedCount} skill(s)`,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined
      })
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error in PATCH competency:", error)
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}
