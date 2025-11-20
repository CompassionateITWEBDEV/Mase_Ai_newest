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
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  }
  return supabaseClient
}

// =====================================================
// GET: Fetch all PT exercise programs for a therapist
// =====================================================
export async function GET(request: NextRequest) {
  console.log('[Staff PT Exercises API] GET request received')
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')
    const patientId = searchParams.get('patientId')

    if (!therapistId && !patientId) {
      return NextResponse.json(
        { error: 'Either Therapist ID or Patient ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('pt_exercise_programs')
      .select(`
        *,
        patient:patients(id, name, medical_record_number),
        therapist:staff(id, name, credentials)
      `)
      .order('created_at', { ascending: false })

    if (therapistId) {
      query = query.eq('therapist_id', therapistId)
    }

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data: programs, error } = await query

    if (error) {
      console.error('[Staff PT Exercises API] Error fetching programs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exercise programs: ' + error.message },
        { status: 500 }
      )
    }

    console.log('[Staff PT Exercises API] Successfully fetched programs')
    return NextResponse.json({
      success: true,
      programs: programs || []
    })

  } catch (error) {
    console.error('[Staff PT Exercises API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// POST: Create a new PT exercise program
// =====================================================
export async function POST(request: NextRequest) {
  console.log('[Staff PT Exercises API] POST request received')
  try {
    const supabase = getServiceClient()
    const body = await request.json()
    
    const { 
      patientId, 
      therapistId, 
      programName,
      totalWeeks, 
      totalSessions,
      nextSessionDate,
      notes,
      exercises,
      weeklyGoals
    } = body

    if (!patientId || !therapistId || !programName || !totalWeeks || !totalSessions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[Staff PT Exercises API] Creating program for patient:', patientId)

    // Create the program
    const { data: program, error: programError } = await supabase
      .from('pt_exercise_programs')
      .insert({
        patient_id: patientId,
        therapist_id: therapistId,
        program_name: programName,
        total_weeks: totalWeeks,
        total_sessions: totalSessions,
        next_session_date: nextSessionDate || null,
        notes: notes || null,
        status: 'active'
      })
      .select()
      .single()

    if (programError) {
      console.error('[Staff PT Exercises API] Error creating program:', programError)
      return NextResponse.json(
        { error: 'Failed to create program: ' + programError.message },
        { status: 500 }
      )
    }

    // Insert exercises if provided
    if (exercises && exercises.length > 0) {
      const exercisesToInsert = exercises.map((ex: any, index: number) => ({
        program_id: program.id,
        name: ex.name,
        description: ex.description,
        duration: ex.duration,
        repetitions: ex.repetitions,
        sets: ex.sets,
        difficulty: ex.difficulty,
        video_url: ex.videoUrl || null,
        ai_tips: ex.aiTips || null,
        order_sequence: index + 1
      }))

      const { error: exercisesError } = await supabase
        .from('pt_exercises')
        .insert(exercisesToInsert)

      if (exercisesError) {
        console.error('[Staff PT Exercises API] Error creating exercises:', exercisesError)
        // Continue even if exercises fail - program is created
      }
    }

    // Insert weekly goals if provided
    if (weeklyGoals && weeklyGoals.length > 0) {
      const goalsToInsert = weeklyGoals.map((goal: string) => ({
        program_id: program.id,
        patient_id: patientId,
        goal_text: goal,
        week_number: 1
      }))

      const { error: goalsError } = await supabase
        .from('pt_weekly_goals')
        .insert(goalsToInsert)

      if (goalsError) {
        console.error('[Staff PT Exercises API] Error creating goals:', goalsError)
        // Continue even if goals fail
      }
    }

    console.log('[Staff PT Exercises API] Program created successfully')
    return NextResponse.json({
      success: true,
      program,
      message: 'Exercise program created successfully'
    })

  } catch (error) {
    console.error('[Staff PT Exercises API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to create program: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// PATCH: Update an existing PT exercise program
// =====================================================
export async function PATCH(request: NextRequest) {
  console.log('[Staff PT Exercises API] PATCH request received')
  try {
    const supabase = getServiceClient()
    const body = await request.json()
    
    const { programId, updates } = body

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      )
    }

    const { data: program, error } = await supabase
      .from('pt_exercise_programs')
      .update(updates)
      .eq('id', programId)
      .select()
      .single()

    if (error) {
      console.error('[Staff PT Exercises API] Error updating program:', error)
      return NextResponse.json(
        { error: 'Failed to update program: ' + error.message },
        { status: 500 }
      )
    }

    console.log('[Staff PT Exercises API] Program updated successfully')
    return NextResponse.json({
      success: true,
      program,
      message: 'Program updated successfully'
    })

  } catch (error) {
    console.error('[Staff PT Exercises API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to update program: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

