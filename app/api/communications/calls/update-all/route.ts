import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// PUT - Update ALL calls from a specific caller with the caller's peer ID
// This is used for group calls where the caller needs to share their peer ID with all callees
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { callerId, callerPeerId } = body

    if (!callerId || !callerPeerId) {
      return NextResponse.json(
        { error: 'callerId and callerPeerId are required' },
        { status: 400 }
      )
    }

    console.log(`📞 Updating ALL calls from caller ${callerId} with peer ID: ${callerPeerId}`)

    // Update all ringing or accepted calls from this caller
    const { data: updatedCalls, error } = await supabase
      .from('call_sessions')
      .update({ caller_peer_id: callerPeerId })
      .eq('caller_id', callerId)
      .in('status', ['ringing', 'accepted'])
      .select('id, callee_id, status')

    if (error) {
      console.error('Error updating calls:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Updated ${updatedCalls?.length || 0} call records with caller peer ID`)

    return NextResponse.json({ 
      success: true, 
      updatedCount: updatedCalls?.length || 0,
      calls: updatedCalls 
    })

  } catch (error: any) {
    console.error('Error in PUT /api/communications/calls/update-all:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

