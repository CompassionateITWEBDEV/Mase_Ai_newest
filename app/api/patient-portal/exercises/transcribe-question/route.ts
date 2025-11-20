import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// =====================================================
// POST: Transcribe voice question using OpenAI Whisper
// =====================================================
export async function POST(request: NextRequest) {
  console.log('[Transcribe API] POST request received')
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const exerciseName = formData.get('exerciseName') as string

    if (!audioFile) {
      console.error('[Transcribe API] No audio file provided')
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    console.log('[Transcribe API] Audio file received:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    })

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.error('⚠️ OpenAI API key not configured')
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to .env.local and restart the server.' },
        { status: 500 }
      )
    }

    console.log(`[Transcribe API] Transcribing audio for ${exerciseName}`)

    // Convert to buffer for better handling
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Create a new File-like object with proper format
    const audioBlob = new Blob([buffer], { type: 'audio/webm' })
    
    // Prepare form data for OpenAI Whisper API
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioBlob, 'question.webm')
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'en') // English
    whisperFormData.append('prompt', `Patient asking question about physical therapy exercise: ${exerciseName}`)

    // Call OpenAI Whisper API
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: whisperFormData,
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      const errorData = JSON.parse(errorText).catch(() => ({ message: errorText }))
      console.error('OpenAI Whisper API Error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorData
      })
      
      return NextResponse.json(
        { 
          error: 'Failed to transcribe audio. ' + (errorData.error?.message || errorData.message || 'Unknown error'),
          details: errorData
        },
        { status: openaiResponse.status }
      )
    }

    const data = await openaiResponse.json()
    const transcription = data.text || ''

    if (!transcription) {
      return NextResponse.json(
        { error: 'No transcription returned from API' },
        { status: 500 }
      )
    }

    console.log('[Transcribe API] Successfully transcribed:', transcription)

    return NextResponse.json({
      success: true,
      transcription: transcription.trim(),
      exerciseName: exerciseName
    })

  } catch (error: any) {
    console.error('[Transcribe API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio: ' + error.message },
      { status: 500 }
    )
  }
}

