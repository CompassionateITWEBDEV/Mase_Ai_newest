import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let supabaseClient: ReturnType<typeof createClient> | null = null

function getServiceClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration for service role')
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  }
  return supabaseClient
}

// =====================================================
// GET: Get single program with exercises and goals
// =====================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  const { programId } = await params
  console.log('[PT Exercises API] GET single program:', programId)
  try {
    const supabase = getServiceClient()
    
    // Get program
    const { data: program, error: programError } = await supabase
      .from('pt_exercise_programs')
      .select('*')
      .eq('id', programId)
      .single()
    
    if (programError || !program) {
      console.error('Program not found:', programError)
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }
    
    // Get exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from('pt_exercises')
      .select('*')
      .eq('program_id', programId)
      .order('order_sequence', { ascending: true })
    
    // Get goals
    const { data: goals, error: goalsError } = await supabase
      .from('pt_weekly_goals')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true })
    
    return NextResponse.json({
      success: true,
      program,
      exercises: exercises || [],
      goals: goals || []
    })
    
  } catch (error: any) {
    console.error('[PT Exercises API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program: ' + error.message },
      { status: 500 }
    )
  }
}

// =====================================================
// PUT: Update program, exercises, and goals
// =====================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  const { programId } = await params
  console.log('[PT Exercises API] PUT program:', programId)
  try {
    const body = await request.json()
    const { programName, totalWeeks, totalSessions, nextSessionDate, notes, exercises, weeklyGoals } = body
    
    const supabase = getServiceClient()
    
    // Update program
    const { error: programError } = await supabase
      .from('pt_exercise_programs')
      .update({
        program_name: programName,
        total_weeks: totalWeeks,
        total_sessions: totalSessions,
        next_session_date: nextSessionDate || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', programId)
    
    if (programError) {
      console.error('Program update error:', programError)
      return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
    }
    
    // Delete existing exercises
    await supabase
      .from('pt_exercises')
      .delete()
      .eq('program_id', programId)
    
    // Insert updated exercises
    if (exercises && exercises.length > 0) {
      const exercisesToInsert = exercises.map((ex: any, index: number) => ({
        program_id: programId,
        name: ex.name,
        description: ex.description || null,
        duration: ex.duration || null,
        repetitions: ex.repetitions || null,
        sets: ex.sets || 3,
        difficulty: ex.difficulty || 'Moderate',
        video_url: ex.videoUrl || null,
        ai_tips: ex.aiTips || null,
        order_sequence: index + 1,
        completed: false
      }))
      
      const { error: exercisesError } = await supabase
        .from('pt_exercises')
        .insert(exercisesToInsert)
      
      if (exercisesError) {
        console.error('Exercises insert error:', exercisesError)
        return NextResponse.json({ error: 'Failed to update exercises' }, { status: 500 })
      }
    }
    
    // Delete existing goals
    await supabase
      .from('pt_weekly_goals')
      .delete()
      .eq('program_id', programId)
    
    // Insert updated goals
    if (weeklyGoals && weeklyGoals.length > 0) {
      // Get program to get patient_id
      const { data: program } = await supabase
        .from('pt_exercise_programs')
        .select('patient_id')
        .eq('id', programId)
        .single()
      
      if (program) {
        const goalsToInsert = weeklyGoals.map((goal: string, index: number) => ({
          program_id: programId,
          patient_id: program.patient_id,
          goal_text: goal,
          week_number: index + 1,
          completed: false
        }))
        
        await supabase
          .from('pt_weekly_goals')
          .insert(goalsToInsert)
      }
    }
    
    console.log('[PT Exercises API] Program updated successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Program updated successfully'
    })
    
  } catch (error: any) {
    console.error('[PT Exercises API] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update program: ' + error.message },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE: Delete program and all related data
// =====================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  const { programId } = await params
  console.log('[PT Exercises API] DELETE program:', programId)
  try {
    const supabase = getServiceClient()
    
    // Delete program (cascades to exercises, goals, completions due to ON DELETE CASCADE in schema)
    const { error: deleteError } = await supabase
      .from('pt_exercise_programs')
      .delete()
      .eq('id', programId)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
    }
    
    console.log('[PT Exercises API] Program deleted successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully'
    })
    
  } catch (error: any) {
    console.error('[PT Exercises API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete program: ' + error.message },
      { status: 500 }
    )
  }
}

