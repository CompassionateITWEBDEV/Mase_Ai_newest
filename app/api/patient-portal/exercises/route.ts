import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Singleton Supabase client for service role operations
let supabaseClient: ReturnType<typeof createClient> | null = null

function getServiceClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }
    
    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY environment variable')
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  }
  return supabaseClient
}

// =====================================================
// GET: Fetch PT exercise program for a patient
// =====================================================
export async function GET(request: NextRequest) {
  console.log('[PT Exercises API] GET request received')
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    console.log('[PT Exercises API] Fetching program for patient:', patientId)

    // Fetch active exercise program for the patient
    const { data: program, error: programError } = await supabase
      .from('pt_exercise_programs')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (programError && programError.code !== 'PGRST116') {
      console.error('[PT Exercises API] Error fetching program:', programError)
      return NextResponse.json(
        { error: 'Failed to fetch exercise program: ' + programError.message },
        { status: 500 }
      )
    }

    // If no active program found, return empty data
    if (!program) {
      console.log('[PT Exercises API] No active program found for patient')
      return NextResponse.json({
        hasProgram: false,
        program: null,
        exercises: [],
        weeklyGoals: [],
        message: 'No active exercise program found'
      })
    }

    // Fetch exercises for the program
    const { data: exercises, error: exercisesError } = await supabase
      .from('pt_exercises')
      .select('*')
      .eq('program_id', program.id)
      .eq('is_active', true)
      .order('order_sequence', { ascending: true })

    if (exercisesError) {
      console.error('[PT Exercises API] Error fetching exercises:', exercisesError)
      return NextResponse.json(
        { error: 'Failed to fetch exercises: ' + exercisesError.message },
        { status: 500 }
      )
    }

    // Fetch completions for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: completions, error: completionsError } = await supabase
      .from('pt_exercise_completions')
      .select('exercise_id, completed_at')
      .eq('patient_id', patientId)
      .eq('program_id', program.id)
      .gte('completed_at', today.toISOString())

    if (completionsError) {
      console.error('[PT Exercises API] Error fetching completions:', completionsError)
    }

    // Mark exercises as completed if they have a completion today
    const completedExerciseIds = new Set(completions?.map(c => c.exercise_id) || [])
    const exercisesWithStatus = exercises?.map(exercise => ({
      ...exercise,
      completed: completedExerciseIds.has(exercise.id)
    })) || []

    // Fetch weekly goals
    const { data: weeklyGoals, error: goalsError } = await supabase
      .from('pt_weekly_goals')
      .select('*')
      .eq('program_id', program.id)
      .eq('week_number', program.current_week)
      .order('created_at', { ascending: true })

    if (goalsError) {
      console.error('[PT Exercises API] Error fetching goals:', goalsError)
    }

    console.log('[PT Exercises API] Successfully fetched program data')
    return NextResponse.json({
      hasProgram: true,
      program: {
        id: program.id,
        programName: program.program_name,
        currentWeek: program.current_week,
        totalWeeks: program.total_weeks,
        completedSessions: program.completed_sessions,
        totalSessions: program.total_sessions,
        nextSession: program.next_session_date,
        status: program.status,
        notes: program.notes
      },
      exercises: exercisesWithStatus,
      weeklyGoals: weeklyGoals || [],
      completionsToday: completions?.length || 0
    })

  } catch (error) {
    console.error('[PT Exercises API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise data: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// POST: Mark an exercise as complete
// =====================================================
export async function POST(request: NextRequest) {
  console.log('[PT Exercises API] POST request received')
  try {
    const supabase = getServiceClient()
    const body = await request.json()
    
    const { exerciseId, patientId, programId, durationSeconds, notes, painLevel } = body

    if (!exerciseId || !patientId || !programId) {
      return NextResponse.json(
        { error: 'Exercise ID, Patient ID, and Program ID are required' },
        { status: 400 }
      )
    }

    console.log('[PT Exercises API] Marking exercise as complete:', exerciseId)

    // First, verify the exercise exists
    const { data: exercise, error: exerciseCheckError } = await supabase
      .from('pt_exercises')
      .select('id, name')
      .eq('id', exerciseId)
      .single()

    if (exerciseCheckError || !exercise) {
      console.error('[PT Exercises API] Exercise not found:', exerciseId)
      return NextResponse.json(
        { error: 'Exercise not found. The program may have been updated. Please refresh the page.' },
        { status: 404 }
      )
    }

    console.log('[PT Exercises API] Exercise verified:', exercise.name)

    // Insert completion record
    const { data: completion, error: completionError } = await supabase
      .from('pt_exercise_completions')
      .insert({
        exercise_id: exerciseId,
        patient_id: patientId,
        program_id: programId,
        duration_seconds: durationSeconds || null,
        notes: notes || null,
        pain_level: painLevel || null
      })
      .select()
      .single()

    if (completionError) {
      console.error('[PT Exercises API] Error inserting completion:', completionError)
      return NextResponse.json(
        { error: 'Failed to mark exercise as complete: ' + completionError.message },
        { status: 500 }
      )
    }

    // Update program completed sessions count
    // Get total number of completions for this program
    const { data: allCompletions, count: totalCompletionsCount } = await supabase
      .from('pt_exercise_completions')
      .select('id', { count: 'exact' })
      .eq('program_id', programId)
      .eq('patient_id', patientId)

    console.log('[PT Exercises API] Total completions:', totalCompletionsCount)

    // Update the program's completed_sessions to match total completions
    if (totalCompletionsCount !== null) {
      const { data: program } = await supabase
        .from('pt_exercise_programs')
        .select('total_sessions')
        .eq('id', programId)
        .single()

      if (program) {
        const newCompletedSessions = Math.min(totalCompletionsCount, program.total_sessions)
        
        await supabase
          .from('pt_exercise_programs')
          .update({ 
            completed_sessions: newCompletedSessions,
            updated_at: new Date().toISOString()
          })
          .eq('id', programId)

        console.log('[PT Exercises API] Updated completed_sessions to:', newCompletedSessions)
      }
    }

    console.log('[PT Exercises API] Exercise marked as complete successfully')
    return NextResponse.json({
      success: true,
      completion,
      message: 'Exercise marked as complete'
    })

  } catch (error) {
    console.error('[PT Exercises API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to complete exercise: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

