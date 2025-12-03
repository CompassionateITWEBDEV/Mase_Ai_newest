import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Check for incoming calls for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const callId = searchParams.get('callId')
    const callerId = searchParams.get('callerId') // For group calls - find accepted calls
    const peerSessionId = searchParams.get('peerSessionId') // For group calls - find by session

    // For GROUP CALLS: Find any accepted call for this caller
    // Check this FIRST before callId to enable group call discovery
    if (callerId || peerSessionId) {
      let query = supabase
        .from('call_sessions')
        .select(`
          *,
          caller:staff!call_sessions_caller_id_fkey(id, name, email, department),
          callee:staff!call_sessions_callee_id_fkey(id, name, email, department)
        `)
        .eq('status', 'accepted')
        .order('answered_at', { ascending: false })
        .limit(1)

      if (callerId) {
        query = query.eq('caller_id', callerId)
      }
      if (peerSessionId) {
        query = query.eq('peer_session_id', peerSessionId)
      }

      const { data: acceptedCalls, error } = await query

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ acceptedCall: null })
        }
        console.error('Error fetching accepted calls:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const acceptedCall = acceptedCalls && acceptedCalls.length > 0 ? acceptedCalls[0] : null
      
      console.log('🔍 Group call check - callerId:', callerId, 'peerSessionId:', peerSessionId)
      console.log('🔍 Found accepted calls:', acceptedCalls?.length || 0)
      
      if (acceptedCall) {
        console.log('🔍 Found accepted call:', acceptedCall?.id, 'callee_peer_id:', acceptedCall?.callee_peer_id, 'callee:', acceptedCall?.callee?.name)
        return NextResponse.json({ acceptedCall, call: acceptedCall })
      }
      console.log('🔍 No accepted call found, falling back to callId check')
      // If no accepted call found, fall through to callId check
    }

    // If callId is provided, get specific call details
    if (callId) {
      const { data: call, error } = await supabase
        .from('call_sessions')
        .select(`
          *,
          caller:staff!call_sessions_caller_id_fkey(id, name, email, department),
          callee:staff!call_sessions_callee_id_fkey(id, name, email, department)
        `)
        .eq('id', callId)
        .single()

      if (error) {
        // If table doesn't exist, return null call
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return NextResponse.json({ call: null })
        }
        console.error('Error fetching call:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ call })
    }

    // Get incoming calls for a user (ringing status)
    if (userId) {
      // Query only recent ringing calls (within last 60 seconds)
      const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString()
      
      const { data: incomingCalls, error } = await supabase
        .from('call_sessions')
        .select(`
          *,
          caller:staff!call_sessions_caller_id_fkey(id, name, email, department)
        `)
        .eq('callee_id', userId)
        .eq('status', 'ringing')
        .gte('started_at', sixtySecondsAgo)
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist, return empty array (user needs to run SQL setup)
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('call_sessions table not found - returning empty array')
          return NextResponse.json({ incomingCalls: [] })
        }
        console.error('Error fetching incoming calls:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ incomingCalls: incomingCalls || [] })
    }

    return NextResponse.json({ error: 'userId or callId required' }, { status: 400 })

  } catch (error: any) {
    console.error('Error in GET /api/communications/calls:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new call (initiate call)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callerId, calleeId, conversationId, callType = 'direct', groupSessionId } = body

    if (!callerId || !calleeId) {
      return NextResponse.json(
        { error: 'callerId and calleeId are required' },
        { status: 400 }
      )
    }

    // Use group session ID if provided, otherwise generate a unique peer session ID
    const peerSessionId = groupSessionId || `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Check if there's already an active call between these users
    const { data: existingCall } = await supabase
      .from('call_sessions')
      .select('id')
      .eq('caller_id', callerId)
      .eq('callee_id', calleeId)
      .eq('status', 'ringing')
      .single()

    if (existingCall) {
      // Update existing call
      const { data: updatedCall, error } = await supabase
        .from('call_sessions')
        .update({ started_at: new Date().toISOString() })
        .eq('id', existingCall.id)
        .select(`
          *,
          caller:staff!call_sessions_caller_id_fkey(id, name, email, department),
          callee:staff!call_sessions_callee_id_fkey(id, name, email, department)
        `)
        .single()

      if (error) throw error
      return NextResponse.json({ call: updatedCall, peerSessionId: updatedCall.peer_session_id })
    }

    // Create new call session
    const { data: call, error } = await supabase
      .from('call_sessions')
      .insert({
        caller_id: callerId,
        callee_id: calleeId,
        conversation_id: conversationId,
        call_type: callType,
        peer_session_id: peerSessionId,
        status: 'ringing'
      })
      .select(`
        *,
        caller:staff!call_sessions_caller_id_fkey(id, name, email, department),
        callee:staff!call_sessions_callee_id_fkey(id, name, email, department)
      `)
      .single()

    if (error) {
      // If table doesn't exist, return a helpful error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error('call_sessions table not found - please run the SQL setup script')
        return NextResponse.json({ 
          error: 'Call sessions table not set up. Please run the SQL script: scripts/setup-call-sessions-table.sql',
          peerSessionId 
        }, { status: 500 })
      }
      console.error('Error creating call:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('📞 Call created:', call.id, 'from', callerId, 'to', calleeId, 'type:', callType)

    return NextResponse.json({ call, peerSessionId })

  } catch (error: any) {
    console.error('Error in POST /api/communications/calls:', error)
    // Return a peerSessionId anyway so the caller can at least start their side
    const fallbackPeerSessionId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return NextResponse.json({ 
      error: error.message,
      peerSessionId: fallbackPeerSessionId 
    }, { status: 500 })
  }
}

// PUT - Update call status (accept, reject, end) or store peer ID
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { callId, action, userId, callerPeerId, calleePeerId } = body

    if (!callId) {
      return NextResponse.json(
        { error: 'callId is required' },
        { status: 400 }
      )
    }

    let updateData: any = {}

    // Handle peer ID storage
    if (callerPeerId) {
      updateData.caller_peer_id = callerPeerId
    }
    if (calleePeerId) {
      updateData.callee_peer_id = calleePeerId
    }

    // Handle action-based updates
    if (action) {
      switch (action) {
        case 'accept':
          updateData.status = 'accepted'
          updateData.answered_at = new Date().toISOString()
          break
        case 'reject':
          updateData.status = 'rejected'
          updateData.ended_at = new Date().toISOString()
          break
        case 'end':
          updateData.status = 'ended'
          updateData.ended_at = new Date().toISOString()
          break
        case 'miss':
          updateData.status = 'missed'
          updateData.ended_at = new Date().toISOString()
          break
        default:
          if (!callerPeerId && !calleePeerId) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
          }
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 })
    }

    const { data: call, error } = await supabase
      .from('call_sessions')
      .update(updateData)
      .eq('id', callId)
      .select(`
        *,
        caller:staff!call_sessions_caller_id_fkey(id, name, email, department),
        callee:staff!call_sessions_callee_id_fkey(id, name, email, department)
      `)
      .single()

    if (error) {
      console.error('❌ Error updating call:', error)
      // Check if it's a column not found error
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.error('⚠️ Missing columns! Run: ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS caller_peer_id VARCHAR(100); ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS callee_peer_id VARCHAR(100);')
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('📞 Call', callId, 'updated:', {
      action,
      callerPeerId: updateData.caller_peer_id || 'not changed',
      calleePeerId: updateData.callee_peer_id || 'not changed',
      status: call?.status
    })

    return NextResponse.json({ call })

  } catch (error: any) {
    console.error('Error in PUT /api/communications/calls:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Cancel a call
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('callId')

    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', callId)

    if (error) {
      console.error('Error cancelling call:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('📞 Call', callId, 'cancelled')

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in DELETE /api/communications/calls:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

