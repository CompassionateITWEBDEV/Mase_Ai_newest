import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// =====================================================
// POST: Generate AI Coach Tips for Exercise
// =====================================================
export async function POST(request: NextRequest) {
  console.log('[AI Tips API] POST request received')
  try {
    const body = await request.json()
    
    const { exerciseName, description, difficulty, repetitions, sets } = body

    if (!exerciseName) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.warn('⚠️ OpenAI API key not configured, using fallback tips')
      const fallbackTips = getFallbackTips(exerciseName, difficulty)
      return NextResponse.json({ 
        success: true,
        aiTips: fallbackTips,
        fallback: true 
      })
    }

    console.log('[AI Tips API] Generating tips for:', exerciseName)

    // Create prompt for OpenAI
    const systemPrompt = "You are an experienced physical therapist providing exercise coaching tips. Be concise, specific, and encouraging."
    
    const userPrompt = `Generate concise, helpful coaching tips for the following exercise.

Exercise: ${exerciseName}
${description ? `Description: ${description}` : ''}
${difficulty ? `Difficulty: ${difficulty}` : ''}
${repetitions ? `Repetitions: ${repetitions}` : ''}
${sets ? `Sets: ${sets}` : ''}

Provide 2-3 short, actionable coaching tips that:
1. Focus on proper form and technique
2. Include safety considerations
3. Are encouraging and motivational
4. Are written in a friendly, conversational tone

Format: Write as a single paragraph, 2-3 sentences maximum. Be specific and practical.`

    // Call OpenAI API directly (same as facility portal)
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
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      console.error("OpenAI API Error:", errorData)
      
      // Use fallback if OpenAI fails
      const fallbackTips = getFallbackTips(exerciseName, difficulty)
      return NextResponse.json({ 
        success: true,
        aiTips: fallbackTips,
        fallback: true 
      })
    }

    const data = await openaiResponse.json()
    const aiTips = data.choices[0]?.message?.content || ''

    if (!aiTips) {
      throw new Error('Failed to generate AI tips')
    }

    console.log('[AI Tips API] Successfully generated tips')

    return NextResponse.json({
      success: true,
      aiTips: aiTips.trim(),
      usage: data.usage
    })

  } catch (error: any) {
    console.error('[AI Tips API] Error:', error)
    
    // Use fallback on any error
    const body = await request.json().catch(() => ({}))
    const fallbackTips = getFallbackTips(body.exerciseName || 'exercise', body.difficulty)
    
    return NextResponse.json({ 
      success: true,
      aiTips: fallbackTips,
      fallback: true 
    })
  }
}

// Fallback tips if OpenAI is unavailable
function getFallbackTips(exerciseName: string, difficulty?: string): string {
  const exerciseLower = exerciseName.toLowerCase()
  
  // Exercise-specific tips
  if (exerciseLower.includes('ankle')) {
    return "Keep movements slow and controlled. Focus on full range of motion to improve circulation. Stop if you feel sharp pain."
  }
  
  if (exerciseLower.includes('leg') || exerciseLower.includes('knee')) {
    return "Maintain proper form throughout each repetition. Breathe normally and avoid holding your breath. Progress gradually to avoid injury."
  }
  
  if (exerciseLower.includes('arm') || exerciseLower.includes('shoulder')) {
    return "Start with small movements and gradually increase range. Keep shoulders relaxed and avoid tensing your neck. Focus on smooth, controlled motions."
  }
  
  if (exerciseLower.includes('balance')) {
    return "Use a chair or wall for support if needed. Focus on a fixed point ahead to help maintain balance. Practice daily for best results."
  }
  
  if (exerciseLower.includes('stretch')) {
    return "Hold each stretch for 15-30 seconds without bouncing. Breathe deeply and relax into the stretch. Never stretch to the point of pain."
  }
  
  // Difficulty-based generic tips
  if (difficulty === 'Easy') {
    return "Focus on proper form rather than speed. This exercise helps build foundation strength. Listen to your body and take breaks as needed."
  }
  
  if (difficulty === 'Hard') {
    return "Challenge yourself while maintaining good form. Stop if you experience sharp pain. Progress gradually and celebrate your achievements."
  }
  
  // Generic fallback
  return "Perform this exercise slowly and with control. Focus on proper form and breathing. Stop if you feel any sharp pain and consult your therapist."
}

