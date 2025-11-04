import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('🔵 [Save AI Assessment] Request received')
  
  try {
    const body = await request.json()
    const { aiAssessmentId, competencyEvaluationId } = body

    console.log('🔵 [Save AI Assessment] Parameters:', { aiAssessmentId, competencyEvaluationId })

    if (!aiAssessmentId || !competencyEvaluationId) {
      console.error('❌ [Save AI Assessment] Missing parameters:', { aiAssessmentId, competencyEvaluationId })
      return NextResponse.json({ 
        success: false,
        error: "Missing aiAssessmentId or competencyEvaluationId" 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get AI assessment with all details
    console.log('🔵 [Save AI Assessment] Fetching AI assessment...')
    const { data: assessment, error: assessmentError } = await supabase
      .from('staff_ai_assessments')
      .select(`
        *,
        scores:staff_ai_assessment_scores(*)
      `)
      .eq('id', aiAssessmentId)
      .single()

    if (assessmentError || !assessment) {
      console.error('❌ [Save AI Assessment] Assessment not found:', assessmentError)
      return NextResponse.json({ 
        success: false,
        error: `AI assessment not found: ${assessmentError?.message || 'Unknown error'}` 
      }, { status: 404 })
    }

    console.log('✅ [Save AI Assessment] Assessment found:', {
      id: assessment.id,
      staffId: assessment.staff_id,
      scoresCount: assessment.scores?.length || 0
    })

    // Get or create competency evaluation areas
    console.log('🔵 [Save AI Assessment] Checking competency areas...')
    let { data: areas, error: areasError } = await supabase
      .from('staff_competency_areas')
      .select('id, category_name, evaluation_id')
      .eq('evaluation_id', competencyEvaluationId)

    if (areasError) {
      console.error('❌ [Save AI Assessment] Error loading areas:', areasError)
      return NextResponse.json({ 
        success: false,
        error: `Failed to load competency areas: ${areasError.message}` 
      }, { status: 500 })
    }

    // If no areas exist, create them from AI scores
    if (!areas || areas.length === 0) {
      console.log('🔵 [Save AI Assessment] No areas found, creating from AI scores...')
      
      // Group scores by unique category to avoid duplicates
      const categoryMap = new Map<string, { scores: any[], totalScore: number, count: number }>()
      
      for (const aiScore of assessment.scores || []) {
        const category = aiScore.category
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { scores: [], totalScore: 0, count: 0 })
        }
        const categoryData = categoryMap.get(category)!
        categoryData.scores.push(aiScore)
        categoryData.totalScore += parseFloat(aiScore.score?.toString() || '0')
        categoryData.count++
      }
      
      const uniqueCategories = Array.from(categoryMap.keys())
      const totalCategories = uniqueCategories.length
      
      console.log(`🔵 [Save AI Assessment] Found ${uniqueCategories.length} unique categories from ${assessment.scores?.length || 0} scores`)
      
      const newAreas = []
      
      for (const category of uniqueCategories) {
        const categoryData = categoryMap.get(category)!
        const avgScore = categoryData.count > 0 ? categoryData.totalScore / categoryData.count : 0
        
        // Calculate weight as integer percentage (0-100)
        // Each category gets equal weight, so 100 / number of categories
        const weightPercentage = totalCategories > 0 ? Math.round(100 / totalCategories) : 100
        
        const { data: newArea, error: areaError } = await supabase
          .from('staff_competency_areas')
          .insert({
            evaluation_id: competencyEvaluationId,
            category_name: category,
            description: `AI assessed ${category} (${categoryData.count} scores)`,
            weight: weightPercentage, // INTEGER percentage (0-100)
            category_score: Math.round(avgScore)
          })
          .select()
          .single()

        if (areaError) {
          console.error(`❌ [Save AI Assessment] Error creating area ${category}:`, areaError)
        } else {
          console.log(`✅ [Save AI Assessment] Created area: ${category} (weight: ${weightPercentage}%, score: ${Math.round(avgScore)})`)
          newAreas.push(newArea)
        }
      }

      areas = newAreas
      console.log(`✅ [Save AI Assessment] Created ${newAreas.length} competency areas`)
    }

    console.log(`✅ [Save AI Assessment] Found ${areas?.length || 0} competency areas`)

    // Map AI scores to competency skills
    // Group scores by category to create one skill per category area (using average score)
    let skillsCreated = 0
    let skillsUpdated = 0
    
    // Group scores by category first
    const categoryScoreMap = new Map<string, { scores: any[], totalScore: number, totalConfidence: number, count: number }>()
    
    for (const aiScore of assessment.scores || []) {
      const category = aiScore.category
      if (!categoryScoreMap.has(category)) {
        categoryScoreMap.set(category, { scores: [], totalScore: 0, totalConfidence: 0, count: 0 })
      }
      const catData = categoryScoreMap.get(category)!
      catData.scores.push(aiScore)
      catData.totalScore += parseFloat(aiScore.score?.toString() || '0')
      catData.totalConfidence += parseFloat(aiScore.confidence?.toString() || '0')
      catData.count++
    }
    
    // Create or update one skill per unique category
    for (const [category, catData] of categoryScoreMap.entries()) {
      // Find matching area by category name
      const matchingArea = areas?.find(area => 
        area.category_name.toLowerCase() === category.toLowerCase() ||
        area.category_name.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(area.category_name.toLowerCase())
      )

      if (!matchingArea) {
        console.warn(`⚠️ [Save AI Assessment] No matching area found for: ${category}`)
        continue
      }

      const avgScore = catData.count > 0 ? catData.totalScore / catData.count : 0
      const avgConfidence = catData.count > 0 ? catData.totalConfidence / catData.count : 0

      console.log(`🔵 [Save AI Assessment] Processing category ${category} (Area ID: ${matchingArea.id}, avg score: ${Math.round(avgScore)}%, ${catData.count} scores)`)

      // Check if skill already exists for this area
      const { data: existingSkills, error: skillsCheckError } = await supabase
        .from('staff_competency_skills')
        .select('id')
        .eq('area_id', matchingArea.id)
        .limit(1)

      if (skillsCheckError) {
        console.error(`❌ [Save AI Assessment] Error checking skills:`, skillsCheckError)
        continue
      }

      if (existingSkills && existingSkills.length === 0) {
        // Create new skill entry from averaged AI scores
        const { error: insertError } = await supabase
          .from('staff_competency_skills')
          .insert({
            area_id: matchingArea.id,
            skill_name: `${category} - AI Assessment`,
            description: `AI-assessed competency in ${category} with ${Math.round(avgConfidence)}% average confidence (${catData.count} assessments)`,
            required: true,
            assessment_method: 'simulation',
            passing_score: 80,
            supervisor_assessment_score: Math.round(avgScore),
            final_score: Math.round(avgScore),
            status: avgScore >= 80 ? 'competent' : avgScore >= 70 ? 'needs-improvement' : 'not-competent',
            last_assessed: assessment.completed_at || new Date().toISOString().split("T")[0],
            evidence: [`AI Assessment (Avg Confidence: ${Math.round(avgConfidence)}%, ${catData.count} scores)`],
            notes: `Score from AI assessment conducted on ${new Date(assessment.completed_at || assessment.created_at).toLocaleDateString()}`
          })

        if (insertError) {
          console.error(`❌ [Save AI Assessment] Error creating skill for ${category}:`, insertError)
        } else {
          console.log(`✅ [Save AI Assessment] Created skill for ${category}: ${Math.round(avgScore)}%`)
          skillsCreated++
        }
      } else {
        // Update existing skill with averaged AI score
        const { error: updateError } = await supabase
          .from('staff_competency_skills')
          .update({
            supervisor_assessment_score: Math.round(avgScore),
            final_score: Math.round(avgScore),
            status: avgScore >= 80 ? 'competent' : avgScore >= 70 ? 'needs-improvement' : 'not-competent',
            last_assessed: assessment.completed_at || new Date().toISOString().split("T")[0],
            evidence: [`AI Assessment (Avg Confidence: ${Math.round(avgConfidence)}%, ${catData.count} scores)`],
            notes: `Updated with AI assessment score from ${new Date(assessment.completed_at || assessment.created_at).toLocaleDateString()}`
          })
          .eq('area_id', matchingArea.id)
          .limit(1)

        if (updateError) {
          console.error(`❌ [Save AI Assessment] Error updating skill for ${category}:`, updateError)
        } else {
          console.log(`✅ [Save AI Assessment] Updated skill for ${category}: ${Math.round(avgScore)}%`)
          skillsUpdated++
        }
      }
    }

    console.log(`✅ [Save AI Assessment] Skills processed: ${skillsCreated} created, ${skillsUpdated} updated`)

    // Update competency evaluation overall score
    const { data: allSkills, error: allSkillsError } = await supabase
      .from('staff_competency_skills')
      .select('final_score')
      .in('area_id', (areas || []).map(a => a.id))

    if (allSkillsError) {
      console.error('❌ [Save AI Assessment] Error fetching all skills:', allSkillsError)
    } else if (allSkills && allSkills.length > 0) {
      const avgScore = allSkills.reduce((sum, skill) => sum + (parseFloat(skill.final_score?.toString() || '0')), 0) / allSkills.length
      
      console.log(`🔵 [Save AI Assessment] Updating evaluation overall score: ${Math.round(avgScore)}%`)
      
      const { error: updateEvalError } = await supabase
        .from('staff_competency_evaluations')
        .update({
          overall_score: Math.round(avgScore),
          status: avgScore >= 85 ? 'completed' : avgScore >= 70 ? 'needs-improvement' : 'not-competent'
        })
        .eq('id', competencyEvaluationId)

      if (updateEvalError) {
        console.error('❌ [Save AI Assessment] Error updating evaluation score:', updateEvalError)
      } else {
        console.log(`✅ [Save AI Assessment] Updated evaluation overall score: ${Math.round(avgScore)}%`)
      }
    }

    // Update AI assessment to link to competency evaluation
    console.log('🔵 [Save AI Assessment] Linking assessment to evaluation...')
    const { error: linkError } = await supabase
      .from('staff_ai_assessments')
      .update({ competency_evaluation_id: competencyEvaluationId })
      .eq('id', aiAssessmentId)

    if (linkError) {
      console.error('❌ [Save AI Assessment] Error linking assessment:', linkError)
      return NextResponse.json({ 
        success: false,
        error: `Failed to link assessment: ${linkError.message}` 
      }, { status: 500 })
    }

    console.log('✅ [Save AI Assessment] Successfully linked assessment to evaluation')
    console.log('✅ [Save AI Assessment] Summary:', {
      skillsCreated,
      skillsUpdated,
      areasProcessed: areas?.length || 0
    })

    return NextResponse.json({
      success: true,
      message: `AI assessment results saved successfully (${skillsCreated} created, ${skillsUpdated} updated)`,
      details: {
        skillsCreated,
        skillsUpdated,
        areasProcessed: areas?.length || 0
      }
    })
  } catch (error: any) {
    console.error('❌ [Save AI Assessment] Unexpected error:', error)
    console.error('❌ [Save AI Assessment] Error stack:', error.stack)
    return NextResponse.json({ 
      success: false,
      error: error.message || "Failed to save AI assessment",
      details: error.toString()
    }, { status: 500 })
  }
}

