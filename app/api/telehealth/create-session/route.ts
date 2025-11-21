import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Note: Vonage Video API (OpenTok) will be used when credentials are configured
// For now, we'll create a mock implementation that can be easily replaced

export async function POST(request: NextRequest) {
  try {
    const { consultationId, nurseId, doctorId } = await request.json()

    if (!consultationId || !nurseId || !doctorId) {
      return NextResponse.json(
        { error: 'Missing required fields: consultationId, nurseId, doctorId' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Check if Vonage credentials are configured
    const hasVonageCredentials = process.env.VONAGE_VIDEO_API_KEY && process.env.VONAGE_VIDEO_API_SECRET

    let sessionId: string
    let nurseToken: string
    let doctorToken: string

    if (hasVonageCredentials) {
      // Real Vonage implementation
      try {
        const OpenTok = (await import('opentok')).default
        const opentok = new OpenTok(
          process.env.VONAGE_VIDEO_API_KEY!,
          process.env.VONAGE_VIDEO_API_SECRET!
        )

        // Create session
        sessionId = await new Promise<string>((resolve, reject) => {
          opentok.createSession({ mediaMode: 'routed' }, (err: any, session: any) => {
            if (err) reject(err)
            else resolve(session.sessionId)
          })
        })

        // Generate tokens
        nurseToken = opentok.generateToken(sessionId, {
          role: 'publisher',
          data: `nurseId=${nurseId}`,
          expireTime: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours
        })

        doctorToken = opentok.generateToken(sessionId, {
          role: 'publisher',
          data: `doctorId=${doctorId}`,
          expireTime: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours
        })
      } catch (error) {
        console.error('Vonage API error:', error)
        return NextResponse.json(
          { error: 'Failed to create Vonage video session' },
          { status: 500 }
        )
      }
    } else {
      // Mock implementation for development
      sessionId = `mock-session-${Date.now()}`
      nurseToken = `mock-nurse-token-${Date.now()}`
      doctorToken = `mock-doctor-token-${Date.now()}`
      
      console.warn('⚠️ Using mock video session - Configure VONAGE_VIDEO_API_KEY and VONAGE_VIDEO_API_SECRET for production')
    }

    // Save session to database
    const { data: session, error: sessionError } = await supabase
      .from('telehealth_sessions')
      .insert({
        consultation_id: consultationId,
        session_id: sessionId,
        nurse_token: nurseToken,
        doctor_token: doctorToken,
        nurse_id: nurseId,
        doctor_id: doctorId,
        status: 'created',
        recording_enabled: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Database error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to save video session to database' },
        { status: 500 }
      )
    }

    // Update consultation status to in_progress
    await supabase
      .from('telehealth_consultations')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', consultationId)

    return NextResponse.json({
      success: true,
      sessionId,
      nurseToken,
      doctorToken,
      sessionData: session,
      usingMockSession: !hasVonageCredentials
    })

  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve existing session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const consultationId = searchParams.get('consultationId')

    if (!consultationId) {
      return NextResponse.json(
        { error: 'consultationId is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: session, error } = await supabase
      .from('telehealth_sessions')
      .select('*')
      .eq('consultation_id', consultationId)
      .eq('status', 'created')
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      session
    })

  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

