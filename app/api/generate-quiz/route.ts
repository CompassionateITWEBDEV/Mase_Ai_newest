import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content, numberOfQuestions = 5 } = await request.json()

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: "Content is too short to generate meaningful questions" },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.warn("OpenAI API key not configured, returning fallback questions")
      return NextResponse.json({
        questions: generateFallbackQuestions(numberOfQuestions),
        isFallback: true,
      })
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
            content: `You are an expert medical training assessment creator. Generate ${numberOfQuestions} multiple-choice questions based on the provided training content. 
            
            Requirements:
            - Each question should test understanding, not just memorization
            - Provide 4 options per question
            - Include the correct answer index (0-3)
            - Provide a brief explanation for the correct answer
            - Focus on practical application and key concepts
            - Questions should be clear and unambiguous
            
            Return ONLY a valid JSON array of questions in this exact format:
            [
              {
                "id": "q1",
                "question": "Question text here?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "Why this answer is correct"
              }
            ]`,
          },
          {
            role: "user",
            content: `Generate ${numberOfQuestions} quiz questions from this training content:\n\n${content.substring(0, 4000)}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("OpenAI API error:", errorText)
      return NextResponse.json({
        questions: generateFallbackQuestions(numberOfQuestions),
        isFallback: true,
      })
    }

    const openaiData = await openaiResponse.json()
    const generatedText = openaiData.choices[0]?.message?.content || ""

    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let jsonText = generatedText.trim()
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "")
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
      console.error("Error parsing OpenAI response:", parseError)
      console.error("Generated text:", generatedText)
      return NextResponse.json({
        questions: generateFallbackQuestions(numberOfQuestions),
        isFallback: true,
      })
    }
  } catch (error: any) {
    console.error("Error generating quiz:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate quiz", questions: generateFallbackQuestions(5), isFallback: true },
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

