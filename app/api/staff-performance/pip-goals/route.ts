import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    if (!staffId) {
      return NextResponse.json({ success: false, message: "Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Resolve staff_id if not UUID
    let staffIdUuid = staffId
    const isValidUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(str)
    }

    if (!isValidUUID(staffId)) {
      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .or(`user_id.eq.${staffId},email.eq.${staffId}`)
        .maybeSingle()
      
      if (staff?.id && isValidUUID(staff.id)) {
        staffIdUuid = staff.id
      } else {
        return NextResponse.json({ success: false, message: "Staff not found" }, { status: 404 })
      }
    }

    // Get all PIPs for this staff member with their goals
    const { data: pips, error: pipError } = await supabase
      .from('staff_pip')
      .select(`
        id,
        start_date,
        target_completion_date,
        progress,
        status,
        supervisor_name,
        review_dates,
        evaluation_id,
        goals:staff_pip_goals (
          id,
          description,
          target_date,
          completed,
          progress,
          actions,
          notes
        )
      `)
      .eq('staff_id', staffIdUuid)
      .eq('status', 'active') // Only active PIPs
      .order('created_at', { ascending: false })

    if (pipError) {
      console.error('Error fetching PIPs:', pipError)
      return NextResponse.json({ success: false, message: "Error fetching PIPs", error: pipError.message }, { status: 500 })
    }

    // Get the evaluation type for each PIP to help categorize goals
    const pipsWithEvalType = await Promise.all(
      (pips || []).map(async (pip: any) => {
        if (pip.evaluation_id) {
          const { data: evaluation } = await supabase
            .from('staff_competency_evaluations')
            .select('evaluation_type')
            .eq('id', pip.evaluation_id)
            .maybeSingle()
          
          return {
            ...pip,
            evaluation_type: evaluation?.evaluation_type || 'competency'
          }
        }
        return {
          ...pip,
          evaluation_type: 'competency' // Default if no evaluation linked
        }
      })
    )

    // Separate goals into performance and competency
    const allPerformanceGoals: any[] = []
    const allCompetencyGoals: any[] = []

    pipsWithEvalType.forEach((pip: any) => {
      if (pip.goals && Array.isArray(pip.goals)) {
        pip.goals.forEach((goal: any) => {
          const goalLower = (goal.description || '').toLowerCase()
          
          // Determine if goal is competency-related
          // Goals from competency evaluations or skills assessment are competency goals
          const isCompetencyGoal = goalLower.includes('certification') ||
                                  goalLower.includes('competency') ||
                                  goalLower.includes('skill') ||
                                  goalLower.includes('validation') ||
                                  goalLower.includes('training') ||
                                  goalLower.includes('wound care') ||
                                  goalLower.includes('iv therapy') ||
                                  goalLower.includes('clinical') ||
                                  goalLower.includes('documentation') ||
                                  goalLower.includes('medication') ||
                                  goalLower.includes('assessment') ||
                                  pip.evaluation_type === 'competency' ||
                                  pip.evaluation_type === 'skills-validation' ||
                                  pip.evaluation_type === 'performance-improvement'
          
          const goalWithMeta = {
            id: goal.id,
            description: goal.description,
            targetDate: goal.target_date,
            completed: goal.completed || false,
            progress: goal.progress || 0,
            actions: Array.isArray(goal.actions) ? goal.actions : [],
            notes: goal.notes || null,
            pipId: pip.id,
            pipStatus: pip.status,
            supervisor: pip.supervisor_name,
            source: isCompetencyGoal ? 'competency-pip' : 'performance-pip'
          }

          if (isCompetencyGoal) {
            allCompetencyGoals.push(goalWithMeta)
          } else {
            allPerformanceGoals.push(goalWithMeta)
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      performanceGoals: allPerformanceGoals,
      competencyGoals: allCompetencyGoals,
      totalPips: pips?.length || 0
    })
  } catch (error: any) {
    console.error("Error retrieving PIP goals:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    }, { status: 500 })
  }
}

