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
// PATCH: Toggle goal completion status
// =====================================================
export async function PATCH(request: NextRequest) {
  console.log('[PT Goals API] PATCH request received')
  try {
    const supabase = getServiceClient()
    const body = await request.json()
    
    const { goalId, completed } = body

    if (!goalId || completed === undefined) {
      return NextResponse.json(
        { error: 'Goal ID and completed status are required' },
        { status: 400 }
      )
    }

    console.log('[PT Goals API] Updating goal:', goalId, 'completed:', completed)

    // Update goal
    const { data: goal, error: updateError } = await supabase
      .from('pt_weekly_goals')
      .update({
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', goalId)
      .select()
      .single()

    if (updateError) {
      console.error('[PT Goals API] Error updating goal:', updateError)
      return NextResponse.json(
        { error: 'Failed to update goal: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('[PT Goals API] Goal updated successfully')
    return NextResponse.json({
      success: true,
      goal,
      message: 'Goal updated successfully'
    })

  } catch (error) {
    console.error('[PT Goals API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to update goal: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

