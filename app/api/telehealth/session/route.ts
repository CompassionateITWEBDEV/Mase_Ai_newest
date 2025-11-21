import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from '@/lib/supabase/service'
import OpenTok from 'opentok'

const apiKey = process.env.VONAGE_API_KEY || ''
const apiSecret = process.env.VONAGE_API_SECRET || ''

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const consultationId = searchParams.get('consultationId')

    if (!consultationId) {
      return NextResponse.json({ error: "Consultation ID is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get existing session for this consultation
    const { data: session, error } = await supabase
      .from('telehealth_sessions')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !session) {
      console.log('⚠️ [SESSION] No session found for consultation:', consultationId)
      return NextResponse.json({ 
        success: false,
        error: 'No session found' 
      }, { status: 404 })
    }

    console.log('✅ [SESSION] Found existing session:', session.id)

    // Generate nurse token for existing session
    let nurseToken = ''
    
    if (apiKey && apiSecret && session.session_id) {
      try {
        const opentok = new OpenTok(apiKey, apiSecret)
        nurseToken = opentok.generateToken(session.session_id, {
          role: 'publisher',
          data: JSON.stringify({ role: 'nurse' })
        })
        console.log('✅ [SESSION] Generated nurse token')
      } catch (error) {
        console.error('❌ [SESSION] Error generating token:', error)
      }
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        session_id: session.session_id,
        consultation_id: session.consultation_id,
        status: session.status
      },
      nurseToken,
      usingMockSession: !apiKey || !apiSecret
    })
  } catch (error: any) {
    console.error("❌ [SESSION] Error:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message || "Failed to fetch session" 
    }, { status: 500 })
  }
}

