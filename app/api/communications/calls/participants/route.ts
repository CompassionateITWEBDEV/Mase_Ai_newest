import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Fetch all participants in a group call (by peer_session_id)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const peerSessionId = searchParams.get('peerSessionId')

    if (!peerSessionId) {
      return NextResponse.json({ error: 'peerSessionId is required' }, { status: 400 })
    }

    // Fetch all calls with this peer_session_id
    const { data: calls, error } = await supabase
      .from('call_sessions')
      .select(`
        id,
        status,
        caller_id,
        callee_id,
        caller:staff!call_sessions_caller_id_fkey(id, name, email, department),
        callee:staff!call_sessions_callee_id_fkey(id, name, email, department)
      `)
      .eq('peer_session_id', peerSessionId)

    if (error) {
      console.error('Error fetching call participants:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Extract unique participants from all calls
    const participantsMap = new Map()
    
    calls?.forEach(call => {
      // Add caller
      if (call.caller) {
        participantsMap.set(call.caller.id, {
          ...call.caller,
          role: 'caller',
          status: 'connected'
        })
      }
      // Add callee with their status
      if (call.callee) {
        const existingCallee = participantsMap.get(call.callee.id)
        participantsMap.set(call.callee.id, {
          ...call.callee,
          role: 'participant',
          status: call.status === 'accepted' ? 'connected' : call.status
        })
      }
    })

    const participants = Array.from(participantsMap.values())
    
    console.log(`📞 Found ${participants.length} participants in group call ${peerSessionId}`)

    return NextResponse.json({ 
      participants,
      totalCalls: calls?.length || 0
    })

  } catch (error: any) {
    console.error('Error in GET /api/communications/calls/participants:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

