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
// GET: Get detailed exercise progress for patient
// =====================================================
export async function GET(request: NextRequest) {
  console.log('[Progress API] GET request received')
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const programId = searchParams.get('programId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Get exercise program
    let programQuery = supabase
      .from('pt_exercise_programs')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single()

    if (programId) {
      programQuery = supabase
        .from('pt_exercise_programs')
        .select('*')
        .eq('id', programId)
        .single()
    }

    const { data: program, error: programError } = await programQuery

    if (programError) {
      console.error('Error fetching program:', programError)
      return NextResponse.json(
        { error: 'No active exercise program found' },
        { status: 404 }
      )
    }

    // Get all exercises for this program
    const { data: exercises, error: exercisesError } = await supabase
      .from('pt_exercises')
      .select('*')
      .eq('program_id', program.id)
      .order('order_sequence', { ascending: true })

    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError)
      return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
    }

    // Get completion history for each exercise
    const { data: completions, error: completionsError } = await supabase
      .from('pt_exercise_completions')
      .select('*')
      .eq('patient_id', patientId)
      .in('exercise_id', exercises.map((ex: any) => ex.id))
      .order('completed_at', { ascending: false })

    if (completionsError) {
      console.error('Error fetching completions:', completionsError)
      return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 })
    }

    // Calculate statistics
    const totalExercises = exercises.length
    
    // Count unique exercises that have at least one completion
    const uniqueCompletedExercises = new Set(completions.map((c: any) => c.exercise_id))
    const completedExercises = uniqueCompletedExercises.size
    const completionRate = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

    console.log('[Progress API] Exercise completion:', {
      totalExercises,
      uniqueCompletedExercises: Array.from(uniqueCompletedExercises),
      completedExercises,
      totalCompletionRecords: completions.length
    })

    // Calculate total time spent
    const totalTimeSpent = completions.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0)

    // Calculate completion by day
    const completionsByDay: { [key: string]: number } = {}
    completions.forEach((completion: any) => {
      const date = new Date(completion.completed_at).toISOString().split('T')[0]
      completionsByDay[date] = (completionsByDay[date] || 0) + 1
    })

    // Get last 7 days of activity
    const last7Days: any[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completions: completionsByDay[dateStr] || 0
      })
    }

    // Calculate streak
    let currentStreak = 0
    let checkDate = new Date()
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (completionsByDay[dateStr] && completionsByDay[dateStr] > 0) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // Calculate week progress (current week)
    const weekStart = new Date(program.created_at)
    const weeksPassed = Math.floor((today.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const currentWeek = Math.min(weeksPassed + 1, program.total_weeks)

    // Get goals completion
    const { data: goals, error: goalsError } = await supabase
      .from('pt_weekly_goals')
      .select('*')
      .eq('program_id', program.id)
      .eq('patient_id', patientId)
      .order('week_number', { ascending: true })

    const totalGoals = goals?.length || 0
    const completedGoals = goals?.filter((g: any) => g.completed).length || 0
    const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0

    // Calculate consistency score (exercises per week)
    const expectedWeeklySessions = program.total_sessions / program.total_weeks
    const actualWeeklySessions = completions.filter((c: any) => {
      const completedDate = new Date(c.completed_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return completedDate >= weekAgo
    }).length
    const consistencyScore = Math.min(100, (actualWeeklySessions / expectedWeeklySessions) * 100)

    // Exercise-specific stats
    const exerciseStats = exercises.map((exercise: any) => {
      const exerciseCompletions = completions.filter((c: any) => c.exercise_id === exercise.id)
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        totalCompletions: exerciseCompletions.length,
        lastCompleted: exerciseCompletions.length > 0 ? exerciseCompletions[0].completed_at : null,
        averageDuration: exerciseCompletions.length > 0
          ? Math.round(exerciseCompletions.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0) / exerciseCompletions.length)
          : 0,
        completed: exerciseCompletions.length > 0 // Mark as completed if has any completion records
      }
    })

    console.log('[Progress API] Successfully calculated progress')
    console.log('[Progress API] Stats:', {
      totalExercises,
      completedExercises,
      completionRate: Math.round(completionRate),
      totalCompletions: completions.length,
      currentStreak,
      consistencyScore: Math.round(consistencyScore)
    })

    return NextResponse.json({
      success: true,
      program: {
        id: program.id,
        name: program.program_name,
        currentWeek: currentWeek,
        totalWeeks: program.total_weeks,
        completedSessions: program.completed_sessions,
        totalSessions: program.total_sessions,
        status: program.status
      },
      statistics: {
        totalExercises,
        completedExercises,
        completionRate: Math.round(completionRate),
        totalTimeSpent, // in seconds
        totalTimeSpentFormatted: formatDuration(totalTimeSpent),
        currentStreak,
        consistencyScore: Math.round(consistencyScore),
        totalGoals,
        completedGoals,
        goalCompletionRate: Math.round(goalCompletionRate)
      },
      activityData: {
        last7Days,
        completionsByDay
      },
      exerciseStats,
      totalCompletions: completions.length,
      lastActivity: completions.length > 0 ? completions[0].completed_at : null
    })

  } catch (error: any) {
    console.error('[Progress API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress: ' + error.message },
      { status: 500 }
    )
  }
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

