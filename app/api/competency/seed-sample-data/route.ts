import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log('🌱 [Seed Competency Data] Starting...')

    // Get first staff member as test subject
    const { data: staffMembers, error: staffError } = await supabase
      .from('staff')
      .select('id, name, department')
      .limit(2)

    if (staffError) {
      console.error('❌ [Seed] Error fetching staff:', staffError)
      return NextResponse.json({ 
        success: false, 
        message: `Failed to fetch staff: ${staffError.message}` 
      }, { status: 500 })
    }

    if (!staffMembers || staffMembers.length === 0) {
      // Create test staff if none exist
      console.log('📝 [Seed] No staff found, creating test staff...')
      const { data: newStaff, error: createError } = await supabase
        .from('staff')
        .insert([
          { 
            email: 'sarah.johnson@test.com', 
            name: 'Sarah Johnson', 
            department: 'RN', 
            is_active: true 
          },
          { 
            email: 'lisa.garcia@test.com', 
            name: 'Lisa Garcia', 
            department: 'LPN', 
            is_active: true 
          }
        ])
        .select()

      if (createError || !newStaff || newStaff.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: `Failed to create test staff: ${createError?.message || 'Unknown error'}` 
        }, { status: 500 })
      }

      staffMembers.push(...newStaff)
    }

    const testStaffId = staffMembers[0].id
    const evaluatorId = staffMembers.length > 1 ? staffMembers[1].id : staffMembers[0].id
    const staffName = staffMembers[0].name

    console.log(`✅ [Seed] Using staff: ${staffName} (${testStaffId})`)

    // Create evaluation
    const { data: evaluation, error: evalError } = await supabase
      .from('staff_competency_evaluations')
      .insert({
        staff_id: testStaffId,
        evaluator_id: evaluatorId,
        evaluator_name: 'Dr. Martinez',
        evaluation_date: new Date().toISOString().split('T')[0],
        evaluation_type: 'annual',
        overall_score: 91.0,
        status: 'completed',
        next_evaluation_due: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 6 months from now
      })
      .select()
      .single()

    if (evalError || !evaluation) {
      console.error('❌ [Seed] Error creating evaluation:', evalError)
      return NextResponse.json({ 
        success: false, 
        message: `Failed to create evaluation: ${evalError?.message || 'Unknown error'}` 
      }, { status: 500 })
    }

    console.log(`✅ [Seed] Created evaluation: ${evaluation.id}`)

    // Define competency areas with their skills
    const competencyAreas = [
      {
        category: 'Safety & Compliance',
        description: 'Demonstrates knowledge and adherence to safety protocols',
        weight: 25,
        categoryScore: 100.0,
        skills: [
          { name: 'Hand hygiene protocols', description: 'Follows proper hand hygiene procedures', score: 95 },
          { name: 'Infection control measures', description: 'Implements infection control protocols correctly', score: 90 },
          { name: 'Safety equipment usage', description: 'Uses safety equipment appropriately', score: 100 }
        ]
      },
      {
        category: 'Communication Skills',
        description: 'Effective communication with patients and team',
        weight: 20,
        categoryScore: 100.0,
        skills: [
          { name: 'Patient communication', description: 'Communicates clearly with patients', score: 95 },
          { name: 'Team communication', description: 'Effectively communicates with team members', score: 90 }
        ]
      },
      {
        category: 'Documentation',
        description: 'Accurate and timely documentation practices',
        weight: 15,
        categoryScore: 95.0,
        skills: [
          { name: 'Chart documentation', description: 'Completes charts accurately', score: 95 },
          { name: 'Progress notes', description: 'Writes clear progress notes', score: 90 },
          { name: 'Medication records', description: 'Maintains accurate medication records', score: 95 },
          { name: 'Incident reporting', description: 'Completes incident reports properly', score: 100 }
        ]
      },
      {
        category: 'Clinical Assessment',
        description: 'Performs clinical assessments accurately',
        weight: 25,
        categoryScore: 95.0,
        skills: [
          { name: 'Vital signs measurement', description: 'Accurately measures vital signs', score: 95 },
          { name: 'Physical assessment', description: 'Performs thorough physical assessments', score: 90 },
          { name: 'Pain assessment', description: 'Conducts proper pain assessments', score: 95 },
          { name: 'Wound assessment', description: 'Assesses wounds correctly', score: 90 },
          { name: 'Medication assessment', description: 'Assesses medication effectiveness', score: 100 }
        ]
      },
      {
        category: 'Supervision & Delegation',
        description: 'Effectively supervises and delegates tasks',
        weight: 15,
        categoryScore: 90.0,
        skills: [
          { name: 'Task delegation', description: 'Delegates tasks appropriately', score: 90 },
          { name: 'Staff supervision', description: 'Supervises staff effectively', score: 85 },
          { name: 'Performance feedback', description: 'Provides constructive feedback', score: 95 }
        ]
      }
    ]

    // Create areas and skills
    for (const area of competencyAreas) {
      const { data: areaRecord, error: areaError } = await supabase
        .from('staff_competency_areas')
        .insert({
          evaluation_id: evaluation.id,
          category_name: area.category,
          description: area.description,
          weight: area.weight,
          category_score: area.categoryScore
        })
        .select()
        .single()

      if (areaError || !areaRecord) {
        console.error(`❌ [Seed] Error creating area ${area.category}:`, areaError)
        continue
      }

      console.log(`✅ [Seed] Created area: ${area.category}`)

      // Create skills for this area
      for (const skill of area.skills) {
        const skillStatus = skill.score >= 80 ? 'competent' : skill.score >= 60 ? 'needs-improvement' : 'not-competent'
        
        const { error: skillError } = await supabase
          .from('staff_competency_skills')
          .insert({
            area_id: areaRecord.id,
            skill_name: skill.name,
            description: skill.description,
            required: true,
            assessment_method: 'observation',
            passing_score: 80,
            supervisor_assessment_score: skill.score,
            final_score: skill.score,
            status: skillStatus,
            last_assessed: new Date().toISOString().split('T')[0]
          })

        if (skillError) {
          console.error(`❌ [Seed] Error creating skill ${skill.name}:`, skillError)
        }
      }

      console.log(`✅ [Seed] Created ${area.skills.length} skills for ${area.category}`)
    }

    // Verify what was created
    const { data: verification, error: verifyError } = await supabase
      .from('staff_competency_evaluations')
      .select(`
        id,
        overall_score,
        staff_id,
        areas:staff_competency_areas (
          id,
          category_name,
          weight,
          skills:staff_competency_skills (
            id,
            skill_name,
            status
          )
        )
      `)
      .eq('id', evaluation.id)
      .single()

    if (verifyError) {
      console.warn('⚠️ [Seed] Could not verify data:', verifyError)
    }

    const totalAreas = verification?.areas?.length || 0
    const totalSkills = verification?.areas?.reduce((sum: number, area: any) => 
      sum + (area.skills?.length || 0), 0) || 0
    const competentSkills = verification?.areas?.reduce((sum: number, area: any) => 
      sum + (area.skills?.filter((s: any) => s.status === 'competent')?.length || 0), 0) || 0

    console.log('✅ [Seed] Sample data created successfully!')
    console.log(`   - Evaluation ID: ${evaluation.id}`)
    console.log(`   - Staff: ${staffName}`)
    console.log(`   - Areas: ${totalAreas}`)
    console.log(`   - Skills: ${totalSkills} (${competentSkills} competent)`)

    return NextResponse.json({
      success: true,
      message: 'Sample competency data created successfully',
      data: {
        evaluationId: evaluation.id,
        staffId: testStaffId,
        staffName: staffName,
        totalAreas,
        totalSkills,
        competentSkills
      }
    })

  } catch (error: any) {
    console.error('❌ [Seed] Unexpected error:', error)
    return NextResponse.json({ 
      success: false, 
      message: `Internal server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 })
  }
}


