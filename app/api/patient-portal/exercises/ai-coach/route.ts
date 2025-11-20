import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// System prompt for AI Exercise Coach
const SYSTEM_PROMPT = `You are a supportive, encouraging AI Exercise Coach for physical therapy patients. Your role is to:

1. Provide personalized feedback on exercises
2. Answer questions about form and technique
3. Offer motivation and encouragement
4. Give safety reminders when appropriate
5. Celebrate progress and achievements

Keep responses:
- Warm, friendly, and encouraging
- Under 150 words
- Specific and actionable
- Safety-conscious
- Motivating and positive

Always prioritize patient safety and encourage them to consult their PT for serious concerns.`

// =====================================================
// POST: Get AI feedback or answer questions
// =====================================================
export async function POST(request: NextRequest) {
  console.log('[AI Coach API] POST request received')
  try {
    const body = await request.json()
    
    const { 
      type, // 'feedback', 'question', 'form-check', 'progress'
      exerciseName,
      question,
      completedExercises,
      totalExercises,
      progressData
    } = body

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.warn('⚠️ OpenAI API key not configured, using fallback')
      const fallbackResponse = getFallbackResponse(type, exerciseName)
      return NextResponse.json({ 
        success: true,
        response: fallbackResponse,
        fallback: true 
      })
    }

    console.log('[AI Coach API] Generating response for type:', type)

    // Build user prompt based on type
    let userPrompt = ''
    
    if (type === 'feedback') {
      userPrompt = `The patient just completed the ${exerciseName} exercise. Provide encouraging feedback and a tip for their next session. Keep it brief and motivating.`
    } else if (type === 'question') {
      userPrompt = `Patient question about ${exerciseName}: "${question}"

Answer their question with helpful, clear guidance. If it's a medical concern, advise them to consult their PT.`
    } else if (type === 'form-check') {
      userPrompt = `The patient wants form advice for ${exerciseName}. Provide 2-3 key points about proper form and common mistakes to avoid.`
    } else if (type === 'progress') {
      userPrompt = `The patient has completed ${completedExercises} out of ${totalExercises} exercises today. ${progressData || ''} Provide encouraging feedback on their progress and motivation to continue.`
    } else {
      userPrompt = `Provide general encouraging words for the patient's exercise session. Be brief and motivating.`
    }

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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.8, // More warm and encouraging
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      console.error("OpenAI API Error:", errorData)
      
      const fallbackResponse = getFallbackResponse(type, exerciseName)
      return NextResponse.json({ 
        success: true,
        response: fallbackResponse,
        fallback: true 
      })
    }

    const data = await openaiResponse.json()
    const response = data.choices[0]?.message?.content || ''

    if (!response) {
      throw new Error('Failed to generate AI response')
    }

    console.log('[AI Coach API] Successfully generated response')

    return NextResponse.json({
      success: true,
      response: response.trim(),
      usage: data.usage
    })

  } catch (error: any) {
    console.error('[AI Coach API] Error:', error)
    
    const body = await request.json().catch(() => ({}))
    const fallbackResponse = getFallbackResponse(body.type, body.exerciseName)
    
    return NextResponse.json({ 
      success: true,
      response: fallbackResponse,
      fallback: true 
    })
  }
}

// Fallback responses if OpenAI unavailable
function getFallbackResponse(type: string, exerciseName?: string): string {
  const exercise = exerciseName || 'your exercise'
  
  if (type === 'feedback') {
    return `Great work on completing ${exercise}! You're making excellent progress. Remember to focus on proper form and listen to your body. Keep up the fantastic effort! 💪`
  }
  
  if (type === 'question') {
    return `That's a great question about ${exercise}! For specific technique questions, I recommend consulting with your physical therapist who can provide personalized guidance. In the meantime, make sure you're following the form tips provided and stop if you feel any sharp pain.`
  }
  
  if (type === 'form-check') {
    return `For ${exercise}, remember these key points: 1) Maintain proper alignment and posture, 2) Move slowly and with control, 3) Breathe normally throughout the movement. If you're unsure about your form, consider recording yourself or asking your PT to observe during your next session.`
  }
  
  if (type === 'progress') {
    return `You're doing amazing! Every exercise you complete brings you closer to your recovery goals. Your dedication and consistency are truly impressive. Keep up this wonderful momentum! 🌟`
  }
  
  return `You're doing great! Keep focusing on proper form and breathing. Your effort is paying off. Stay consistent and you'll see continued improvement! 💪`
}

