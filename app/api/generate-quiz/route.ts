import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content, numberOfQuestions = 5 } = await request.json()

    // Validate content length - very lenient, AI can work with minimal content
    const contentLength = content?.trim().length || 0
    if (contentLength < 20) {
      return NextResponse.json(
        { 
          error: `Content is too short (${contentLength} characters). Need at least 20 characters (module title and description) to generate questions.`,
          questions: [],
          isFallback: false,
        },
        { status: 400 }
      )
    }
    
    console.log(`📊 Generating quiz from ${contentLength} characters of content`)

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error("❌ OpenAI API key not configured - quiz generation requires API key")
      return NextResponse.json(
        { 
          error: "OpenAI API key not configured. Please configure OPENAI_API_KEY environment variable to generate quiz questions from module content.",
          questions: [],
          isFallback: false,
        },
        { status: 500 }
      )
    }

    // Call OpenAI API to generate questions
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert MEDICAL training assessment creator specializing in healthcare education. Your task is to generate ${numberOfQuestions} MEDICAL multiple-choice questions based on the ACTUAL MEDICAL CONTENT provided.

CRITICAL REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:

1. **MANDATORY: Use ACTUAL FILE CONTENT as PRIMARY source**
   - If you see "ACTUAL FILE CONTENT" in the input, you MUST use that content to create MEDICAL questions
   - IGNORE module title, description, and other metadata if ACTUAL FILE CONTENT is present
   - Extract SPECIFIC medical facts, numbers, procedures, protocols, definitions, medications, dosages, and clinical details from the ACTUAL FILE CONTENT
   - Questions MUST reference specific MEDICAL information from the ACTUAL FILE CONTENT
   - ALL questions must be about MEDICAL/HEALTHCARE topics, procedures, protocols, medications, patient care, safety, or clinical information

2. **MEDICAL Question Requirements:**
   - Questions MUST be based on SPECIFIC MEDICAL information from the ACTUAL FILE CONTENT
   - Focus on: medical procedures, protocols, medications, dosages, patient care, safety guidelines, clinical protocols, diagnostic information, treatment guidelines, medical terminology
   - DO NOT create generic questions about the topic
   - DO NOT create questions about video frames, image quality, or technical aspects
   - DO NOT create questions based on module title or description if ACTUAL FILE CONTENT exists
   - Extract exact medical facts, figures, procedures, protocols, and clinical concepts from the ACTUAL FILE CONTENT
   - Each question should test understanding of SPECIFIC MEDICAL content from the file

3. **If ACTUAL FILE CONTENT is NOT provided:**
   - Only then use module title/description to create MEDICAL questions
   - Make reasonable inferences about the medical topic
   - Focus on practical medical application

4. **Format Requirements:**
   - NEVER return error messages saying content is insufficient
   - ALWAYS return a valid JSON array of MEDICAL questions
   - Provide 4 options per question
   - Include the correct answer index (0-3)
   - Provide a brief MEDICAL explanation for the correct answer based on the ACTUAL FILE CONTENT
   - Questions should be clear, unambiguous, and MEDICAL in nature

5. **MEDICAL Examples:**
   - If ACTUAL FILE CONTENT says "Handwashing should last 20 seconds", create: "How long should handwashing last according to infection control protocols?" with "20 seconds" as correct answer
   - If ACTUAL FILE CONTENT says "Use PPE when entering isolation rooms", create: "When should healthcare workers use PPE?" with "When entering isolation rooms" as correct answer
   - If ACTUAL FILE CONTENT mentions "Aspirin 325mg daily", create: "What is the recommended daily dosage of Aspirin mentioned in the training?" with "325mg" as correct answer
   - DO NOT create generic questions like "What is handwashing?" if the ACTUAL FILE CONTENT has specific medical details
   - DO NOT create questions about video quality, frame analysis, or technical aspects

Return ONLY a valid JSON array of questions in this exact format (no other text, no error messages):
[
  {
    "id": "q1",
    "question": "Question text here based on ACTUAL FILE CONTENT?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct based on ACTUAL FILE CONTENT"
  }
]`,
          },
          {
            role: "user",
            content: `Generate ${numberOfQuestions} MEDICAL multiple-choice quiz questions from the EXTRACTED VIDEO CONTENT below.

🚨 CRITICAL INSTRUCTIONS - READ CAREFULLY:

**THIS IS EXTRACTED VIDEO CONTENT - INCLUDES AUDIO TRANSCRIPT (SPOKEN WORDS) AND VISUAL TEXT (FROM FRAMES)**

The content below was extracted from a MEDICAL training video:
- **AUDIO TRANSCRIPT**: What was actually SPOKEN/SAID in the video (speech-to-text)
- **VISUAL CONTENT**: Text from slides, visual aids, diagrams shown in the video frames

1. **MANDATORY: Use ONLY the extracted VIDEO CONTENT below (audio + visual text)**
   - The content below contains what was SPOKEN in the video (audio transcript) and what TEXT was SHOWN (visual content from frames)
   - IGNORE any module title, description, or training metadata
   - Extract SPECIFIC MEDICAL facts, numbers, procedures, protocols, medications, dosages, definitions from what was SPOKEN or SHOWN in the video
   - Create MEDICAL questions based ONLY on what was actually SAID or SHOWN in the video
   - Each question must reference specific MEDICAL information from the AUDIO TRANSCRIPT or VISUAL CONTENT
   - ALL questions must be about MEDICAL/HEALTHCARE topics that were discussed or shown in the video
   - DO NOT create generic questions - use exact MEDICAL details from what was spoken or shown

2. **MEDICAL Question Creation Rules - Based on VIDEO CONTENT:**
   - Use what was SPOKEN: If audio transcript says "Handwashing should last 20 seconds" → "How long should handwashing last according to infection control protocols? Answer: 20 seconds"
   - Use what was SHOWN: If visual content shows "Wear gloves before patient contact" → "When should healthcare workers wear gloves? Answer: Before patient contact"
   - Use spoken definitions: If audio says "PPE means Personal Protective Equipment" → "What does PPE stand for in healthcare? Answer: Personal Protective Equipment"
   - Use shown medications: If visual content shows "Aspirin 325mg daily" → "What is the recommended daily dosage of Aspirin? Answer: 325mg"
   - Use spoken protocols: If audio mentions "Check patient ID before medication administration" → "When should healthcare workers check patient ID? Answer: Before medication administration"
   - Use specific medical numbers, dates, medication names, dosages, and clinical details from what was SPOKEN or SHOWN in the video

3. **DO NOT:**
   - Create generic questions about the topic
   - Create questions about video frames, image quality, video format, or technical aspects
   - Create questions about the extraction process or how content was analyzed
   - Use module title/description (not provided - use only extracted video content)
   - Say content is insufficient - ALWAYS generate MEDICAL questions from what was spoken or shown
   - Create questions that could apply to any training
   - Make assumptions based on topic - use ONLY what was actually SPOKEN or SHOWN in the video
   - Create non-medical questions

4. **EXTRACTED VIDEO CONTENT (Use ONLY this - what was SPOKEN and SHOWN):**
${content.substring(0, 12000)}

Remember: Generate ALL ${numberOfQuestions} questions based on SPECIFIC information from what was SPOKEN (audio transcript) or SHOWN (visual text) in the video above. Questions must be about the MEDICAL CONTENT that was actually discussed or displayed, not about the video itself. Return ONLY the JSON array, no other text.`,
          },
        ],
        temperature: 0.3, // Lower temperature for more focused, content-based questions
        max_tokens: 3000, // Increased for longer content analysis
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("❌ OpenAI API error:", errorText)
      console.error("❌ Content length:", content.length)
      console.error("❌ Content preview:", content.substring(0, 200))
      
      // Return error instead of fallback - force proper content-based generation
      return NextResponse.json(
        {
          error: `Failed to generate quiz from content. OpenAI API error: ${errorText.substring(0, 200)}`,
          questions: [],
          isFallback: false,
        },
        { status: 500 }
      )
    }

    const openaiData = await openaiResponse.json()
    const generatedText = openaiData.choices[0]?.message?.content || ""

    // Check if OpenAI returned an error message instead of JSON
    if (generatedText.toLowerCase().includes("sorry") || 
        generatedText.toLowerCase().includes("not enough") ||
        generatedText.toLowerCase().includes("insufficient") ||
        generatedText.toLowerCase().includes("cannot generate") ||
        (!generatedText.includes("[") && !generatedText.includes("{"))) {
      console.error("❌ OpenAI returned error message instead of JSON:", generatedText.substring(0, 200))
      return NextResponse.json(
        {
          error: `Insufficient content for quiz generation. OpenAI response: ${generatedText.substring(0, 300)}. Please ensure the module has detailed content, description, or file content for AI to analyze.`,
          questions: [],
          isFallback: false,
        },
        { status: 400 }
      )
    }

    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let jsonText = generatedText.trim()
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "")
      }

      // Try to find JSON array or object in the text
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/) || jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }

      const questions = JSON.parse(jsonText)

      // Validate the structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid questions format")
      }

      // Ensure all questions have required fields
      const validatedQuestions = questions.map((q, index) => ({
        id: q.id || `q${index + 1}`,
        question: q.question || "Question not available",
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < 4
          ? q.correctAnswer
          : 0,
        explanation: q.explanation || "No explanation provided",
      }))

      return NextResponse.json({
        questions: validatedQuestions,
        isFallback: false,
      })
    } catch (parseError) {
      console.error("❌ Error parsing OpenAI response:", parseError)
      console.error("❌ Generated text:", generatedText.substring(0, 500))
      console.error("❌ Content that was analyzed:", content.substring(0, 500))
      
      // Check if OpenAI returned an error message
      const lowerText = generatedText.toLowerCase()
      if (lowerText.includes("sorry") || 
          lowerText.includes("not enough") ||
          lowerText.includes("insufficient") ||
          lowerText.includes("cannot generate") ||
          lowerText.includes("not coherent")) {
        return NextResponse.json(
          {
            error: `Insufficient content for quiz generation. The AI could not generate questions from the provided content. Please ensure the module has detailed description, content, or file content (PDF/Video) for analysis. Content provided: ${contentLength} characters.`,
            questions: [],
            isFallback: false,
          },
          { status: 400 }
        )
      }
      
      // Try to extract JSON from text if it's embedded
      try {
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/) || generatedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const extractedJson = JSON.parse(jsonMatch[0])
          if (Array.isArray(extractedJson) && extractedJson.length > 0) {
            console.log("✅ Successfully extracted JSON from text response")
            const validatedQuestions = extractedJson.map((q: any, index: number) => ({
              id: q.id || `q${index + 1}`,
              question: q.question || "Question not available",
              options: Array.isArray(q.options) && q.options.length === 4
                ? q.options
                : ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < 4
                ? q.correctAnswer
                : 0,
              explanation: q.explanation || "No explanation provided",
            }))
            return NextResponse.json({
              questions: validatedQuestions,
              isFallback: false,
            })
          }
        }
      } catch (extractError) {
        console.error("❌ Failed to extract JSON from text:", extractError)
      }
      
      // Return error instead of fallback - force proper content-based generation
      return NextResponse.json(
        {
          error: `Failed to parse quiz questions from AI response. The AI may have returned an error message instead of JSON. Please ensure the module has sufficient content (title, description, or file content) for question generation.`,
          questions: [],
          isFallback: false,
          debug: process.env.NODE_ENV === 'development' ? { 
            parseError: String(parseError), 
            generatedText: generatedText.substring(0, 500),
            contentLength: contentLength 
          } : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("❌ Error generating quiz:", error)
    console.error("❌ Content provided:", content?.substring(0, 200))
    
    // Return error instead of fallback - force proper content-based generation
    return NextResponse.json(
      { 
        error: `Failed to generate quiz from module content: ${error.message || "Unknown error"}. Please ensure the module has content and OpenAI API is properly configured.`,
        questions: [],
        isFallback: false,
      },
      { status: 500 }
    )
  }
}

/**
 * REMOVED: generateFallbackQuestions function
 * 
 * NO HARDCODED QUESTIONS - All questions must be generated from extracted data
 * If content extraction or quiz generation fails, the system will return an error
 * This ensures questions are ALWAYS based on actual file content, never hardcoded
 * 
 * The system will:
 * 1. Extract content from files (PDF, video, PowerPoint) using PDF.co
 * 2. Send extracted content to OpenAI for analysis
 * 3. Generate questions based ONLY on extracted content
 * 4. If extraction fails, return error (no fallback questions)
 */

