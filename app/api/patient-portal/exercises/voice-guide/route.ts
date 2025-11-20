import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// =====================================================
// POST: Generate voice guide script for exercise
// =====================================================
export async function POST(request: NextRequest) {
  console.log('[Voice Guide API] POST request received')
  try {
    const body = await request.json()
    
    const { exerciseName, description, duration, repetitions, sets, aiTips } = body

    if (!exerciseName) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.warn('⚠️ OpenAI API key not configured, using fallback script')
      const fallbackScript = generateFallbackScript(exerciseName, description, repetitions, sets)
      return NextResponse.json({ 
        success: true,
        script: fallbackScript,
        fallback: true 
      })
    }

    console.log('[Voice Guide API] Generating voice script for:', exerciseName)

    // Create prompt for conversational voice guide
    const systemPrompt = "You are a friendly, encouraging physical therapy coach providing voice-guided exercise instructions. Speak in a warm, conversational tone as if you're right there with the patient, coaching them through the exercise."
    
    const userPrompt = `Create a complete voice-guided script for coaching a patient through this exercise. The script will be read aloud, so make it conversational and encouraging.

Exercise: ${exerciseName}
${description ? `Description: ${description}` : ''}
${duration ? `Duration: ${duration}` : ''}
${repetitions ? `Repetitions: ${repetitions}` : ''}
${sets ? `Sets: ${sets}` : ''}
${aiTips ? `Coaching Tips: ${aiTips}` : ''}

Create a script with these sections:
1. Welcome & Introduction (brief, friendly greeting)
2. Setup Instructions (how to position themselves)
3. Step-by-step Guide (counting and coaching through the exercise)
4. Encouragement & Closing (positive reinforcement)

Keep it:
- Conversational and friendly
- Clear and easy to follow
- Under 250 words
- Include countdowns or counts when relevant
- Motivating and encouraging

Format as a continuous script that flows naturally when read aloud.`

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 400,
        temperature: 0.8, // More creative for conversational tone
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      console.error("OpenAI API Error:", errorData)
      
      const fallbackScript = generateFallbackScript(exerciseName, description, repetitions, sets)
      return NextResponse.json({ 
        success: true,
        script: fallbackScript,
        fallback: true 
      })
    }

    const data = await openaiResponse.json()
    const script = data.choices[0]?.message?.content || ''

    if (!script) {
      throw new Error('Failed to generate voice script')
    }

    console.log('[Voice Guide API] Successfully generated script')

    return NextResponse.json({
      success: true,
      script: script.trim(),
      usage: data.usage
    })

  } catch (error: any) {
    console.error('[Voice Guide API] Error:', error)
    
    const body = await request.json().catch(() => ({}))
    const fallbackScript = generateFallbackScript(
      body.exerciseName || 'exercise',
      body.description,
      body.repetitions,
      body.sets
    )
    
    return NextResponse.json({ 
      success: true,
      script: fallbackScript,
      fallback: true 
    })
  }
}

// Fallback script generator
function generateFallbackScript(
  exerciseName: string, 
  description?: string,
  repetitions?: string,
  sets?: number
): string {
  const repsNum = repetitions ? repetitions.split('-')[0] : '10'
  const setsNum = sets || 3
  
  return `Welcome! Let's do the ${exerciseName} exercise together.

${description || `This exercise will help improve your strength and mobility.`}

Get into position and make yourself comfortable. When you're ready, we'll begin.

Let's start with set 1. Ready? Begin. One... two... three... four... five... six... seven... eight... nine... ten. Good job! Take a short break.

Now for set 2. Remember to breathe normally and maintain good form. Ready? Begin. One... two... three... four... five... six... seven... eight... nine... ten. Excellent! You're doing great.

Final set, number ${setsNum}. Stay focused on your form. Ready? Begin. One... two... three... four... five... six... seven... eight... nine... ten. 

Perfect! You've completed all ${setsNum} sets. Great work today! Remember to listen to your body and stop if you feel any sharp pain. Keep up the excellent progress!`
}

