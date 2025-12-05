import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// In-memory store for meeting participants (for meeting-style joining)
// In production, this should be in Redis or database
const meetingParticipants = new Map<string, Map<string, { peerId: string, name: string, joinedAt: Date }>>()

// Cleanup old meeting rooms periodically (remove if not accessed for 2 hours)
setInterval(() => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  meetingParticipants.forEach((participants, roomId) => {
    participants.forEach((p, oderId) => {
      if (p.joinedAt < twoHoursAgo) {
        participants.delete(oderId)
      }
    })
    if (participants.size === 0) {
      meetingParticipants.delete(roomId)
    }
  })
}, 60000) // Check every minute

// GET - Fetch all participants in a group call (by peer_session_id or callId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const peerSessionId = searchParams.get('peerSessionId')
    const callId = searchParams.get('callId')
    const meetingRoomId = searchParams.get('meetingRoomId')

    // For meeting-style joining - simple room-based discovery
    if (meetingRoomId) {
      const roomParticipants = meetingParticipants.get(meetingRoomId)
      const participants = roomParticipants 
        ? Array.from(roomParticipants.entries()).map(([oderId, data]) => ({
            user_id: oderId,
            peer_id: data.peerId,
            name: data.name,
            status: 'connected'
          }))
        : []
      
      console.log(`🏠 [MEETING] Room ${meetingRoomId} has ${participants.length} participants`)
      
      return NextResponse.json({ 
        success: true,
        participants,
        roomId: meetingRoomId
      })
    }

    if (!peerSessionId && !callId) {
      return NextResponse.json({ error: 'peerSessionId, callId, or meetingRoomId is required' }, { status: 400 })
    }

    let calls: any[] = []

    if (callId) {
      // Get the call and its peer_session_id
      const { data: call, error: callError } = await supabase
        .from('call_sessions')
        .select('peer_session_id')
        .eq('id', callId)
        .single()

      if (callError) {
        console.error('Error fetching call:', callError)
        return NextResponse.json({ error: callError.message }, { status: 500 })
      }

      if (call?.peer_session_id) {
        // Fetch all calls with this peer_session_id
        const { data, error } = await supabase
          .from('call_sessions')
          .select(`
            id,
            status,
            caller_id,
            callee_id,
            caller_peer_id,
            callee_peer_id,
            caller:staff!call_sessions_caller_id_fkey(id, name, email, department),
            callee:staff!call_sessions_callee_id_fkey(id, name, email, department)
          `)
          .eq('peer_session_id', call.peer_session_id)

        if (error) {
          console.error('Error fetching calls:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        calls = data || []
      }
    } else if (peerSessionId) {
      // Fetch all calls with this peer_session_id
      const { data, error } = await supabase
        .from('call_sessions')
        .select(`
          id,
          status,
          caller_id,
          callee_id,
          caller_peer_id,
          callee_peer_id,
          caller:staff!call_sessions_caller_id_fkey(id, name, email, department),
          callee:staff!call_sessions_callee_id_fkey(id, name, email, department)
        `)
        .eq('peer_session_id', peerSessionId)

      if (error) {
        console.error('Error fetching call participants:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      calls = data || []
    }

    // Extract unique participants from all calls with their peer IDs
    const participantsMap = new Map()
    
    calls?.forEach(call => {
      // Add caller with their peer ID
      if (call.caller) {
        const existing = participantsMap.get(call.caller.id)
        participantsMap.set(call.caller.id, {
          ...call.caller,
          role: 'caller',
          status: 'connected',
          user_id: call.caller.id,
          peer_id: call.caller_peer_id || existing?.peer_id
        })
      }
      // Add callee with their peer ID and status
      if (call.callee) {
        const existing = participantsMap.get(call.callee.id)
        participantsMap.set(call.callee.id, {
          ...call.callee,
          role: 'participant',
          status: call.status === 'accepted' ? 'connected' : call.status,
          user_id: call.callee.id,
          peer_id: call.callee_peer_id || existing?.peer_id
        })
      }
    })

    const participants = Array.from(participantsMap.values())
    
    console.log(`📞 Found ${participants.length} participants in group call`)

    return NextResponse.json({ 
      success: true,
      participants,
      totalCalls: calls?.length || 0
    })

  } catch (error: any) {
    console.error('Error in GET /api/communications/calls/participants:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Store a participant's peer ID in the database (or meeting room)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callId, oderId, peerId, meetingRoomId, userName } = body

    // For meeting-style joining - register in meeting room
    if (meetingRoomId && oderId && peerId) {
      console.log(`🏠 [MEETING] User ${userName || oderId} joining room ${meetingRoomId} with peer ${peerId}`)
      
      if (!meetingParticipants.has(meetingRoomId)) {
        meetingParticipants.set(meetingRoomId, new Map())
      }
      
      meetingParticipants.get(meetingRoomId)!.set(oderId, {
        peerId,
        name: userName || oderId,
        joinedAt: new Date()
      })
      
      const roomSize = meetingParticipants.get(meetingRoomId)!.size
      console.log(`✅ [MEETING] Room now has ${roomSize} participant(s)`)
      
      return NextResponse.json({ 
        success: true,
        message: 'Joined meeting room',
        roomSize
      })
    }

    // Legacy call-based registration
    if (!callId || !oderId || !peerId) {
      return NextResponse.json({ 
        error: 'callId/meetingRoomId, oderId, and peerId are required' 
      }, { status: 400 })
    }

    console.log(`📞 Storing peer ID for user ${oderId} in call ${callId}`)

    // Get the call and its peer_session_id
    const { data: call, error: callError } = await supabase
      .from('call_sessions')
      .select('peer_session_id, caller_id, callee_id')
      .eq('id', callId)
      .single()

    if (callError) {
      console.error('Error fetching call:', callError)
      return NextResponse.json({ error: callError.message }, { status: 500 })
    }

    if (!call?.peer_session_id) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Find all calls where this user is a participant
    const { data: userCalls, error: userCallsError } = await supabase
      .from('call_sessions')
      .select('id, caller_id, callee_id')
      .eq('peer_session_id', call.peer_session_id)
      .or(`caller_id.eq.${oderId},callee_id.eq.${oderId}`)

    if (userCallsError) {
      console.error('Error fetching user calls:', userCallsError)
      return NextResponse.json({ error: userCallsError.message }, { status: 500 })
    }

    // Update all calls where this user is involved
    const updatePromises = userCalls?.map(async (userCall) => {
      const field = userCall.caller_id === oderId ? 'caller_peer_id' : 'callee_peer_id'
      return supabase
        .from('call_sessions')
        .update({ [field]: peerId })
        .eq('id', userCall.id)
    }) || []

    await Promise.all(updatePromises)

    console.log(`✅ Updated ${updatePromises.length} call(s) with peer ID`)

    return NextResponse.json({ 
      success: true,
      message: 'Peer ID stored successfully',
      updatedCalls: updatePromises.length
    })

  } catch (error: any) {
    console.error('Error in POST /api/communications/calls/participants:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove a participant from a meeting room (when they leave)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const meetingRoomId = searchParams.get('meetingRoomId')
    const oderId = searchParams.get('oderId')

    if (meetingRoomId && oderId) {
      const roomParticipants = meetingParticipants.get(meetingRoomId)
      if (roomParticipants) {
        roomParticipants.delete(oderId)
        console.log(`🚪 [MEETING] User ${oderId} left room ${meetingRoomId}. ${roomParticipants.size} remaining`)
        
        // Clean up empty rooms
        if (roomParticipants.size === 0) {
          meetingParticipants.delete(meetingRoomId)
        }
      }
      
      return NextResponse.json({ success: true, message: 'Left meeting room' })
    }

    return NextResponse.json({ error: 'meetingRoomId and oderId required' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in DELETE /api/communications/calls/participants:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

