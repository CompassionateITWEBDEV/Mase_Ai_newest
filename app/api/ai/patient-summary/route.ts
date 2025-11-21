import { type NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, patientName, consultation } = body

    const systemPrompt = `You are an expert AI Medical Summarizer. Your role is to create concise, clinically relevant patient summaries for physicians.

GUIDELINES:
- Highlight the most clinically significant information
- Identify key risk factors and red flags
- Note medication interactions and contraindications
- Provide actionable clinical recommendations
- Use clear, professional medical terminology
- Prioritize patient safety

Format your response as structured JSON.`

    const prompt = `Generate a comprehensive AI patient summary for a telehealth consultation:

PATIENT INFORMATION:
- Name: ${patientName || 'Unknown'}
- ID: ${patientId || 'N/A'}

CURRENT CONSULTATION:
- Chief Complaint: ${consultation?.reason_for_consult || 'Not specified'}
- Urgency Level: ${consultation?.urgency_level || 'medium'}
- Symptoms: ${JSON.stringify(consultation?.symptoms || [])}
- Vital Signs: ${JSON.stringify(consultation?.vital_signs || {})}

Generate a structured summary including:
1. Demographics (age, gender if available from context)
2. Clinical Summary (2-3 sentence overview of patient's current condition)
3. Key Risk Factors (array of {factor, severity} objects)
4. Current Medications (if mentioned, array of {name, dosage, interactions})
5. Medical History Highlights (array of important past conditions/procedures)
6. AI Recommendations (array of specific clinical suggestions)

Format as JSON with keys: demographics, clinicalSummary, riskFactors, medications, historyHighlights, recommendations

If information is not available, use empty arrays or "N/A" but always provide clinicalSummary and recommendations based on the consultation details.`

    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI service not configured'
      }, { status: 503 })
    }

    try {
      // Call OpenAI API directly (same method as facility portal)
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      })

      if (!openaiResponse.ok) {
        return NextResponse.json({
          success: false,
          error: 'AI service temporarily unavailable'
        }, { status: 503 })
      }

      const data = await openaiResponse.json()
      const text = data.choices[0]?.message?.content || ""

      // Parse AI response
      let summary
      try {
        summary = JSON.parse(text)
      } catch {
        // Fallback if JSON parsing fails
        summary = {
          demographics: { age: 'N/A', gender: 'N/A' },
          clinicalSummary: text,
          riskFactors: [],
          medications: [],
          historyHighlights: [],
          recommendations: ['Review consultation details manually']
        }
      }

      return NextResponse.json({
        success: true,
        summary
      })
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: 'AI service temporarily unavailable'
      }, { status: 503 })
    }
  } catch (error: any) {
    // Request parsing error - fail silently
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid request'
      },
      { status: 400 }
    )
  }
}

