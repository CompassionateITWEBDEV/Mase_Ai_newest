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
            content: `You are an expert medical training assessment creator. Your task is to generate ${numberOfQuestions} multiple-choice questions based on the ACTUAL CONTENT provided.

CRITICAL REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:

1. **MANDATORY: Use ACTUAL FILE CONTENT as PRIMARY source**
   - If you see "ACTUAL FILE CONTENT" in the input, you MUST use that content to create questions
   - IGNORE module title, description, and other metadata if ACTUAL FILE CONTENT is present
   - Extract SPECIFIC facts, numbers, procedures, definitions, and details from the ACTUAL FILE CONTENT
   - Questions MUST reference specific information from the ACTUAL FILE CONTENT

2. **Question Requirements:**
   - Questions MUST be based on SPECIFIC information from the ACTUAL FILE CONTENT
   - DO NOT create generic questions about the topic
   - DO NOT create questions based on module title or description if ACTUAL FILE CONTENT exists
   - Extract exact facts, figures, procedures, and concepts from the ACTUAL FILE CONTENT
   - Each question should test understanding of SPECIFIC content from the file

3. **If ACTUAL FILE CONTENT is NOT provided:**
   - Only then use module title/description to create questions
   - Make reasonable inferences about the topic
   - Focus on practical application

4. **Format Requirements:**
   - NEVER return error messages saying content is insufficient
   - ALWAYS return a valid JSON array of questions
   - Provide 4 options per question
   - Include the correct answer index (0-3)
   - Provide a brief explanation for the correct answer based on the ACTUAL FILE CONTENT
   - Questions should be clear and unambiguous

5. **Examples:**
   - If ACTUAL FILE CONTENT says "Handwashing should last 20 seconds", create: "How long should handwashing last?" with "20 seconds" as correct answer
   - If ACTUAL FILE CONTENT says "Use PPE when entering isolation rooms", create: "When should PPE be used?" with "When entering isolation rooms" as correct answer
   - DO NOT create generic questions like "What is handwashing?" if the ACTUAL FILE CONTENT has specific details

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
            content: `Generate ${numberOfQuestions} multiple-choice quiz questions from the following training module content.

🚨 CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. **IF "ACTUAL FILE CONTENT" IS PRESENT:**
   - IGNORE everything else (module title, description, etc.)
   - Extract SPECIFIC facts, numbers, procedures, definitions from the ACTUAL FILE CONTENT
   - Create questions based ONLY on the ACTUAL FILE CONTENT
   - Each question must reference specific information from the ACTUAL FILE CONTENT
   - DO NOT create generic questions - use exact details from the content

2. **Question Creation Rules:**
   - Extract exact facts: "20 seconds" → "How long should handwashing last? Answer: 20 seconds"
   - Extract procedures: "Wear gloves before patient contact" → "When should gloves be worn? Answer: Before patient contact"
   - Extract definitions: "PPE means Personal Protective Equipment" → "What does PPE stand for? Answer: Personal Protective Equipment"
   - Use specific numbers, dates, names, and details from the ACTUAL FILE CONTENT

3. **DO NOT:**
   - Create generic questions if ACTUAL FILE CONTENT exists
   - Use module title/description if ACTUAL FILE CONTENT is present
   - Say content is insufficient - ALWAYS generate questions
   - Create questions that could apply to any training

4. **Training Content:**
${content.substring(0, 12000)}

Remember: If "ACTUAL FILE CONTENT" is present, use ONLY that content. Generate ALL ${numberOfQuestions} questions based on SPECIFIC information from the ACTUAL FILE CONTENT. Return ONLY the JSON array, no other text.`,
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

function generateFallbackQuestions(count: number) {
  const questions = [
    {
      id: "q1",
      question: "What is the primary goal of this training module?",
      options: [
        "To fulfill compliance requirements only",
        "To enhance professional knowledge and skills",
        "To complete mandatory hours",
        "To pass a test",
      ],
      correctAnswer: 1,
      explanation: "Training modules are designed to enhance professional development and improve care quality.",
    },
    {
      id: "q2",
      question: "How should the concepts from this module be applied in practice?",
      options: [
        "Only in specific situations",
        "Integrated into daily work routines",
        "When directed by supervisors",
        "During annual reviews",
      ],
      correctAnswer: 1,
      explanation: "Best practice is to integrate learning into daily routines for consistent application.",
    },
    {
      id: "q3",
      question: "What is the best way to retain information from this training?",
      options: [
        "Watch it once quickly",
        "Memorize all details",
        "Take notes and review key points regularly",
        "Skip to the quiz",
      ],
      correctAnswer: 2,
      explanation: "Active note-taking and regular review enhance retention and understanding.",
    },
    {
      id: "q4",
      question: "When should you seek clarification about training content?",
      options: [
        "After completing all modules",
        "Never, rely on assumptions",
        "Immediately when confused",
        "During the next training cycle",
      ],
      correctAnswer: 2,
      explanation: "Seeking clarification immediately prevents misunderstandings and ensures proper learning.",
    },
    {
      id: "q5",
      question: "Why is continuous professional education important in healthcare?",
      options: [
        "It's required by regulations only",
        "To maintain competency and provide quality care",
        "To earn certificates",
        "To meet minimum requirements",
      ],
      correctAnswer: 1,
      explanation: "Continuous education ensures healthcare professionals maintain competency and deliver high-quality patient care.",
    },
    {
      id: "q6",
      question: "What should you do if you encounter a challenging concept in the training?",
      options: [
        "Skip it and move on",
        "Guess and hope it's not important",
        "Review it multiple times and seek additional resources",
        "Wait for someone to explain it",
      ],
      correctAnswer: 2,
      explanation: "Challenging concepts require additional review and research to ensure full understanding.",
    },
    {
      id: "q7",
      question: "How does this training contribute to patient safety?",
      options: [
        "It doesn't affect patient safety",
        "It provides knowledge to prevent errors and improve care",
        "It's only about documentation",
        "It's a formality",
      ],
      correctAnswer: 1,
      explanation: "Proper training directly impacts patient safety by ensuring staff have current knowledge and skills.",
    },
    {
      id: "q8",
      question: "What is the recommended approach to applying new knowledge?",
      options: [
        "Apply it immediately without review",
        "Wait until you feel 100% confident",
        "Apply gradually while continuing to learn",
        "Never apply until re-trained",
      ],
      correctAnswer: 2,
      explanation: "Gradual application with ongoing learning allows for safe integration of new knowledge.",
    },
  ]

  return questions.slice(0, count)
}

