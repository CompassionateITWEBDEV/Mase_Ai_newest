// Automated Quiz Generation using OpenAI API

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface GenerateQuizParams {
  moduleTitle: string
  moduleDescription: string
  moduleContent?: string
  fileContent?: string
  numberOfQuestions?: number
}

/**
 * Generate quiz questions automatically from module content using OpenAI
 */
export async function generateQuiz({
  moduleTitle,
  moduleDescription,
  moduleContent = "",
  fileContent = "",
  numberOfQuestions = 5,
}: GenerateQuizParams): Promise<QuizQuestion[]> {
  try {
    // Combine all available content
    const contentToAnalyze = `
      Module Title: ${moduleTitle}
      Description: ${moduleDescription}
      Content: ${moduleContent}
      ${fileContent ? `File Content: ${fileContent.substring(0, 2000)}` : ''}
    `.trim()

    const response = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: contentToAnalyze,
        numberOfQuestions,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate quiz")
    }

    const data = await response.json()
    return data.questions || []
  } catch (error) {
    console.error("Error generating quiz:", error)
    // Fallback to sample questions if generation fails
    return getFallbackQuestions(moduleTitle)
  }
}

/**
 * Fallback questions in case API fails
 */
function getFallbackQuestions(moduleTitle: string): QuizQuestion[] {
  return [
    {
      id: "q1",
      question: `What is the main objective of the "${moduleTitle}" module?`,
      options: [
        "To provide basic understanding of the topic",
        "To test your knowledge",
        "To complete the training requirement",
        "All of the above",
      ],
      correctAnswer: 3,
      explanation: "The module aims to provide comprehensive understanding and fulfill training requirements.",
    },
    {
      id: "q2",
      question: "How should you apply the concepts learned in this module?",
      options: [
        "In daily work practices",
        "Only during emergencies",
        "When supervised",
        "Never apply them",
      ],
      correctAnswer: 0,
      explanation: "Concepts should be integrated into daily work practices for best results.",
    },
    {
      id: "q3",
      question: "What is the recommended approach to retain information from this module?",
      options: [
        "Memorize everything",
        "Take notes and review regularly",
        "Watch videos multiple times",
        "Skip difficult parts",
      ],
      correctAnswer: 1,
      explanation: "Taking notes and regular review ensures better retention of key concepts.",
    },
    {
      id: "q4",
      question: "When should you seek clarification about module content?",
      options: [
        "Never, figure it out yourself",
        "Only after completing the module",
        "Immediately when confused",
        "Wait until the next training",
      ],
      correctAnswer: 2,
      explanation: "Seeking clarification immediately prevents misunderstandings and ensures proper learning.",
    },
    {
      id: "q5",
      question: "How does this module contribute to your professional development?",
      options: [
        "It doesn't contribute at all",
        "It provides required CEU hours only",
        "It enhances skills and knowledge for better patient care",
        "It's just a formality",
      ],
      correctAnswer: 2,
      explanation: "Training modules are designed to enhance professional skills and improve patient care quality.",
    },
  ]
}

/**
 * Extract text content from PDF (if using pdf-parse library)
 */
export async function extractPDFContent(pdfUrl: string): Promise<string> {
  try {
    // This would require a backend endpoint to process PDFs
    const response = await fetch("/api/extract-pdf-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pdfUrl }),
    })

    if (!response.ok) {
      throw new Error("Failed to extract PDF content")
    }

    const data = await response.json()
    return data.text || ""
  } catch (error) {
    console.error("Error extracting PDF:", error)
    return ""
  }
}

/**
 * Extract transcript from video (if using speech-to-text)
 */
export async function extractVideoTranscript(videoUrl: string): Promise<string> {
  try {
    // This would require a backend endpoint with speech-to-text
    const response = await fetch("/api/extract-video-transcript", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoUrl }),
    })

    if (!response.ok) {
      throw new Error("Failed to extract video transcript")
    }

    const data = await response.json()
    return data.transcript || ""
  } catch (error) {
    console.error("Error extracting transcript:", error)
    return ""
  }
}

/**
 * Validate quiz answer
 */
export function validateAnswer(
  question: QuizQuestion,
  selectedAnswer: number
): { isCorrect: boolean; explanation: string } {
  const isCorrect = selectedAnswer === question.correctAnswer
  return {
    isCorrect,
    explanation: question.explanation,
  }
}

/**
 * Calculate quiz score
 */
export function calculateQuizScore(
  questions: QuizQuestion[],
  answers: Record<string, number>
): {
  score: number
  percentage: number
  passed: boolean
  correct: number
  total: number
} {
  let correct = 0
  const total = questions.length

  questions.forEach((question) => {
    if (answers[question.id] === question.correctAnswer) {
      correct++
    }
  })

  const percentage = total > 0 ? (correct / total) * 100 : 0
  const passed = percentage >= 80 // 80% passing score

  return {
    score: percentage,
    percentage,
    passed,
    correct,
    total,
  }
}

