import { type NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, consultation, patientData, query, chatHistory } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Handle different AI actions
    switch (action) {
      case 'analyze':
        return await analyzeConsultation(consultation, patientData)
      
      case 'chat':
        return await chatWithAI(query, consultation, patientData, chatHistory)
      
      case 'generate_notes':
        return await generateClinicalNotes(consultation, patientData)
      
      case 'suggest_icd10':
        return await suggestICD10Codes(consultation)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    // Request parsing or routing error - fail silently
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid request'
      },
      { status: 400 }
    )
  }
}

async function analyzeConsultation(consultation: any, patientData: any) {
  const systemPrompt = `You are an expert AI Clinical Assistant for telehealth consultations. 
Your role is to provide evidence-based clinical decision support to physicians.

CAPABILITIES:
- Triage assessment and urgency evaluation
- Differential diagnosis suggestions
- Risk factor identification
- Treatment recommendations
- Medication considerations
- Clinical documentation assistance

GUIDELINES:
- Base recommendations on evidence-based medicine
- Consider patient safety first
- Flag potential drug interactions
- Identify red flags requiring immediate attention
- Provide clear, actionable suggestions
- Include reasoning for recommendations

Always format your response as a structured JSON object.`

  const prompt = `Analyze this telehealth consultation and provide clinical decision support:

CONSULTATION DETAILS:
- Patient: ${consultation?.patient_name || 'Unknown'}
- Chief Complaint: ${consultation?.reason_for_consult || 'Not specified'}
- Urgency Level: ${consultation?.urgency_level || 'medium'}
- Symptoms: ${JSON.stringify(consultation?.symptoms || [])}
- Vital Signs: ${JSON.stringify(consultation?.vital_signs || {})}

${patientData ? `PATIENT HISTORY:
- Age: ${patientData.age || 'Unknown'}
- Known Conditions: ${patientData.conditions || 'None listed'}
- Current Medications: ${patientData.medications || 'None listed'}
- Allergies: ${patientData.allergies || 'None listed'}` : ''}

Provide a comprehensive analysis including:
1. Suggested urgency level (critical/high/medium/low) with reasoning
2. Top 3 differential diagnoses with likelihood and reasoning
3. Key risk factors to monitor
4. Recommended clinical actions
5. Medication considerations (if applicable)
6. Draft clinical documentation

Format as JSON with keys: suggestedUrgency, urgencyReasoning, differentialDiagnoses (array of {condition, likelihood, reasoning}), riskFactors (array), recommendedActions (array), medicationSuggestions (array of {medication, indication, warning}), documentationDraft`

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
        max_tokens: 2000,
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
    let analysis
    try {
      analysis = JSON.parse(text)
    } catch {
      // If not valid JSON, create structured response
      analysis = {
        suggestedUrgency: consultation?.urgency_level || 'medium',
        urgencyReasoning: text,
        differentialDiagnoses: [],
        riskFactors: ['Unable to parse AI response'],
        recommendedActions: ['Review consultation details manually'],
        medicationSuggestions: [],
        documentationDraft: text
      }
    }

    return NextResponse.json({
      success: true,
      analysis
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'AI service temporarily unavailable'
    }, { status: 503 })
  }
}

async function chatWithAI(query: string, consultation: any, patientData: any, chatHistory: any[]) {
  const systemPrompt = `You are an expert AI Clinical Assistant helping a physician during a telehealth consultation.

CONSULTATION CONTEXT:
- Patient: ${consultation?.patient_name || 'Unknown'}
- Chief Complaint: ${consultation?.reason_for_consult || 'Not specified'}
- Urgency: ${consultation?.urgency_level || 'medium'}

${patientData ? `PATIENT INFO:
- Age: ${patientData.age || 'Unknown'}
- Conditions: ${patientData.conditions || 'None'}
- Medications: ${patientData.medications || 'None'}
- Allergies: ${patientData.allergies || 'None'}` : ''}

Provide concise, evidence-based clinical guidance. Be specific and actionable.
If asked about medications, check for interactions and contraindications.
Always prioritize patient safety.`

  // Build conversation history
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt }
  ]

  // Add chat history
  if (chatHistory && Array.isArray(chatHistory)) {
    chatHistory.slice(-5).forEach((msg: any) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    })
  }

  // Add current query
  messages.push({ role: "user", content: query })

  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    return NextResponse.json({
      success: false,
      error: 'AI service not configured'
    }, { status: 503 })
  }

  try {
    // Call OpenAI API directly
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 500,
        temperature: 0.4,
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

    return NextResponse.json({
      success: true,
      response: text
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'AI service temporarily unavailable'
    }, { status: 503 })
  }
}

async function generateClinicalNotes(consultation: any, patientData: any) {
  const systemPrompt = `You are a medical documentation specialist. Generate professional clinical notes in SOAP format.`

  const prompt = `Generate clinical documentation for this telehealth consultation:

CONSULTATION:
- Patient: ${consultation?.patient_name || 'Unknown'}
- Chief Complaint: ${consultation?.reason_for_consult || 'Not specified'}
- Symptoms: ${JSON.stringify(consultation?.symptoms || [])}
- Vital Signs: ${JSON.stringify(consultation?.vital_signs || {})}
- Urgency: ${consultation?.urgency_level || 'medium'}

${patientData ? `PATIENT HISTORY:
- Age: ${patientData.age || 'Unknown'}
- Conditions: ${patientData.conditions || 'None'}
- Medications: ${patientData.medications || 'None'}` : ''}

Generate professional clinical notes in SOAP format:
- Subjective: Patient's complaints and history
- Objective: Vital signs and observations
- Assessment: Clinical impression and differential diagnoses
- Plan: Treatment recommendations and follow-up

Keep it concise but comprehensive.`

  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    return NextResponse.json({
      success: false,
      error: 'AI service not configured'
    }, { status: 503 })
  }

  try {
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
        max_tokens: 800,
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

    return NextResponse.json({
      success: true,
      notes: text
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'AI service temporarily unavailable'
    }, { status: 503 })
  }
}

async function suggestICD10Codes(consultation: any) {
  const systemPrompt = `You are a medical coding specialist. Suggest appropriate ICD-10 codes based on clinical information.`

  const prompt = `Suggest ICD-10 codes for this consultation:

Chief Complaint: ${consultation?.reason_for_consult || 'Not specified'}
Symptoms: ${JSON.stringify(consultation?.symptoms || [])}
Urgency: ${consultation?.urgency_level || 'medium'}

Provide:
1. Primary ICD-10 code with description
2. Secondary codes (if applicable)
3. Brief justification for each code

Format as JSON with array of {code, description, justification}`

  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    return NextResponse.json({
      success: false,
      error: 'AI service not configured'
    }, { status: 503 })
  }

  try {
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
        max_tokens: 500,
        temperature: 0.2,
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

    let codes
    try {
      codes = JSON.parse(text)
    } catch {
      codes = [{ code: 'Z00.00', description: 'Unable to parse AI response', justification: text }]
    }

    return NextResponse.json({
      success: true,
      codes
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'AI service temporarily unavailable'
    }, { status: 503 })
  }
}

