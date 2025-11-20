import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for video processing

// =====================================================
// POST: Analyze exercise form from video frames
// =====================================================
export async function POST(request: NextRequest) {
  console.log('[Form Analysis API] POST request received')
  try {
    const body = await request.json()
    
    const { 
      videoFrames, // Array of base64 encoded frames
      exerciseName,
      exerciseDescription,
      expectedReps,
      expectedSets
    } = body

    if (!videoFrames || videoFrames.length === 0) {
      return NextResponse.json(
        { error: 'No video frames provided' },
        { status: 400 }
      )
    }

    if (!exerciseName) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.warn('⚠️ OpenAI API key not configured, using fallback')
      const fallbackAnalysis = getFallbackAnalysis(exerciseName)
      return NextResponse.json({ 
        success: true,
        analysis: fallbackAnalysis,
        fallback: true 
      })
    }

    console.log(`[Form Analysis API] Analyzing ${videoFrames.length} frames for ${exerciseName}`)

    // Build prompt for video analysis
    const systemPrompt = `You are an expert physical therapist analyzing patient exercise form from video frames. 

Your task:
1. Carefully examine all frames to identify the exercise being performed
2. Check if the patient is actually performing the correct exercise
3. Analyze body positioning, alignment, and movement patterns
4. Count repetitions performed
5. Identify form issues and mistakes
6. Provide specific, actionable feedback

Be thorough, specific, and safety-conscious in your analysis.`

    const userPrompt = `Analyze this patient performing: ${exerciseName}

Exercise Details:
${exerciseDescription ? `Description: ${exerciseDescription}` : ''}
${expectedReps ? `Expected Reps: ${expectedReps}` : ''}
${expectedSets ? `Expected Sets: ${expectedSets}` : ''}

Please analyze the video frames and provide:

1. **Exercise Identification**: Is the patient actually doing ${exerciseName}? (Yes/No and explain)

2. **Repetition Count**: How many repetitions did they complete?

3. **Form Analysis**:
   - Overall form quality (Excellent/Good/Fair/Poor)
   - What they're doing correctly
   - What needs improvement
   - Specific mistakes observed

4. **Body Positioning**:
   - Alignment issues
   - Joint positioning
   - Movement quality

5. **Safety Concerns**: Any risks or issues to address immediately?

6. **Actionable Feedback**: 3-5 specific tips to improve their form

Be encouraging but honest. Prioritize safety.`

    // Prepare messages with video frames
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: [
          {
            type: "text",
            text: userPrompt
          },
          // Add video frames as images
          ...videoFrames.map((frame: string) => ({
            type: "image_url",
            image_url: {
              url: frame, // base64 data URL
              detail: "high" // High detail for better analysis
            }
          }))
        ]
      }
    ]

    console.log('[Form Analysis API] Calling OpenAI Vision API...')

    // Call OpenAI Vision API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // GPT-4 with vision
        messages: messages,
        max_tokens: 800,
        temperature: 0.3, // Lower temperature for more accurate analysis
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      console.error("OpenAI API Error:", errorData)
      
      const fallbackAnalysis = getFallbackAnalysis(exerciseName)
      return NextResponse.json({ 
        success: true,
        analysis: fallbackAnalysis,
        fallback: true 
      })
    }

    const data = await openaiResponse.json()
    const analysis = data.choices[0]?.message?.content || ''

    if (!analysis) {
      throw new Error('Failed to generate analysis')
    }

    console.log('[Form Analysis API] Successfully analyzed form')

    return NextResponse.json({
      success: true,
      analysis: analysis.trim(),
      usage: data.usage,
      framesAnalyzed: videoFrames.length
    })

  } catch (error: any) {
    console.error('[Form Analysis API] Error:', error)
    
    const body = await request.json().catch(() => ({}))
    const fallbackAnalysis = getFallbackAnalysis(body.exerciseName || 'your exercise')
    
    return NextResponse.json({ 
      success: true,
      analysis: fallbackAnalysis,
      fallback: true,
      error: error.message
    })
  }
}

// Fallback analysis if OpenAI unavailable
function getFallbackAnalysis(exerciseName: string): string {
  return `**Form Analysis for ${exerciseName}**

⚠️ Note: This is a basic analysis. For detailed AI-powered video analysis, please configure OpenAI API key.

**General Observations:**
Your exercise session has been recorded. Here are general tips for ${exerciseName}:

**Form Checklist:**
✓ Maintain proper body alignment throughout
✓ Control your movements - avoid rushing
✓ Breathe normally and consistently
✓ Complete full range of motion
✓ Focus on quality over quantity

**Recommendations:**
1. Record yourself from multiple angles for better self-assessment
2. Compare your form with the demonstration video
3. Ask your physical therapist to review your technique during your next session
4. Start slow and gradually increase intensity
5. Stop immediately if you experience sharp pain

**Safety Reminders:**
• Listen to your body
• Don't push through pain
• Maintain proper form even when tired
• Consult your PT if unsure about technique

Keep up the great work! Consistency is key to recovery. 💪`
}

