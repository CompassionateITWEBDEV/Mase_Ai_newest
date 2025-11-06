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
  fileUrl?: string
  fileType?: string
  fileName?: string
  numberOfQuestions?: number
}

/**
 * Extract content from files (PDF, Video, PowerPoint) for quiz generation
 */
async function extractFileContent(
  fileUrl?: string,
  fileType?: string,
  fileName?: string
): Promise<string> {
  if (!fileUrl) {
    console.warn("⚠️ No fileUrl provided for extraction")
    return ""
  }

  try {
    console.log(`🔍 Extracting content from ${fileType}: ${fileName}`)
    console.log(`🔍 File URL: ${fileUrl.substring(0, 100)}...`)
    
    const response = await fetch("/api/extract-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileUrl,
        fileType,
        fileName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`❌ Extraction failed: ${response.status}`, errorData)
      return ""
    }

    const data = await response.json()
    
    console.log("📄 Extraction API response:", {
      extracted: data.extracted,
      contentLength: data.content?.length || 0,
      hasContent: !!(data.content && data.content.trim().length > 0),
      error: data.error,
      message: data.message
    })
    
    if (data.extracted && data.content && data.content.trim().length > 0) {
      console.log(`✅ Content extracted successfully: ${data.content.length} characters`)
      console.log(`✅ Content preview: ${data.content.substring(0, 300)}...`)
      return data.content
    } else {
      console.warn(`⚠️ Extraction returned empty or invalid content:`, {
        extracted: data.extracted,
        contentLength: data.content?.length || 0,
        error: data.error
      })
      return ""
    }
  } catch (error) {
    console.error("❌ Error extracting file content:", error)
    return ""
  }
}

/**
 * Generate quiz questions automatically from module content using OpenAI
 * Now automatically extracts content from PDFs, Videos, and PowerPoint files
 */
export async function generateQuiz({
  moduleTitle,
  moduleDescription,
  moduleContent = "",
  fileContent = "",
  fileUrl,
  fileType,
  fileName,
  numberOfQuestions = 5,
}: GenerateQuizParams): Promise<QuizQuestion[]> {
  try {
    // ALWAYS extract content from file if fileUrl is provided (regardless of fileContent)
    let extractedFileContent = ""
    
    if (fileUrl) {
      console.log("📄 ALWAYS extracting content from file for quiz generation...", { fileUrl, fileType, fileName })
      try {
        extractedFileContent = await extractFileContent(fileUrl, fileType, fileName)
        console.log("📄 Extraction result:", {
          success: extractedFileContent.length > 0,
          length: extractedFileContent.length,
          preview: extractedFileContent.substring(0, 200)
        })
      } catch (extractError) {
        console.error("❌ Error extracting file content:", extractError)
        // Continue with other content sources
      }
    }
    
    // If extraction failed or returned empty, use provided fileContent as fallback
    if (!extractedFileContent || extractedFileContent.trim().length < 50) {
      if (fileContent && fileContent.trim().length > 50) {
        console.log("⚠️ Using provided fileContent as fallback (extraction may have failed)")
        extractedFileContent = fileContent
      }
    }

    // Combine all available content - PRIORITIZE extracted file content (actual content, not metadata)
    let combinedContent = ""
    
    // CRITICAL: Prioritize extracted file content FIRST (this is the actual file content)
    if (extractedFileContent && extractedFileContent.trim().length > 50) {
      // This is the actual extracted content from the file (PDF text, video transcript, etc.)
      combinedContent += `ACTUAL FILE CONTENT (Extracted from ${fileType || "file"}):\n${extractedFileContent.substring(0, 12000)}\n\n`
      console.log("✅ Using extracted file content for quiz generation:", extractedFileContent.length, "characters")
      console.log("✅ Extracted content preview:", extractedFileContent.substring(0, 500))
    } else {
      console.warn("⚠️ No extracted file content available - will use module metadata only")
    }
    
    // Add module information as context ONLY (file content is primary)
    // Only add minimal metadata if we have extracted content
    if (extractedFileContent && extractedFileContent.trim().length > 50) {
      // We have actual file content, so only add minimal context
      combinedContent += `\n--- Module Context (for reference only, questions should be based on ACTUAL FILE CONTENT above) ---\n`
      combinedContent += `Module Title: ${moduleTitle || "Untitled Module"}\n`
      if (moduleDescription && moduleDescription.trim().length > 0) {
        combinedContent += `Module Description: ${moduleDescription.substring(0, 200)}\n`
      }
    } else {
      // No extracted content, use module info as primary source (fallback)
      console.warn("⚠️ No file content extracted - quiz will be based on module title/description only")
      combinedContent += `Module Title: ${moduleTitle || "Untitled Module"}\n`
      if (moduleDescription && moduleDescription.trim().length > 0) {
        combinedContent += `Module Description: ${moduleDescription}\n`
      }
      if (moduleContent && moduleContent.trim().length > 0) {
        combinedContent += `Module Content: ${moduleContent.substring(0, 2000)}\n`
      }
    }
    
    const contentToAnalyze = combinedContent.trim()
    
    console.log(`📝 Content to analyze: ${contentToAnalyze.length} characters`)
    console.log(`📝 Content preview: ${contentToAnalyze.substring(0, 300)}...`)
    
    // Ensure we have minimum content - very lenient to allow AI to work with minimal content
    // AI can generate questions from just title and description
    const minContentLength = 20 // Very low threshold - just need title
    
    if (contentToAnalyze.length < minContentLength) {
      throw new Error(
        `Insufficient content for quiz generation. Only ${contentToAnalyze.length} characters available. ` +
        `Please add at least a module title and description. Current content: "${contentToAnalyze.substring(0, 100)}..."`
      )
    }
    
    // Log content for debugging
    console.log(`📊 Content summary:`, {
      title: moduleTitle,
      descriptionLength: moduleDescription?.length || 0,
      contentLength: moduleContent?.length || 0,
      extractedFileLength: extractedFileContent?.length || 0,
      fileContentLength: fileContent?.length || 0,
      totalLength: contentToAnalyze.length
    })

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
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      const errorMessage = errorData.error || `Failed to generate quiz (${response.status})`
      console.error("❌ Quiz generation failed:", errorMessage)
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    // Check if we got fallback questions (should not happen now)
    if (data.isFallback) {
      console.warn("⚠️ Received fallback questions - this should not happen")
      throw new Error("Quiz generation returned fallback questions. Please ensure module has content and OpenAI API is configured.")
    }
    
    if (!data.questions || data.questions.length === 0) {
      throw new Error("No questions generated. Please ensure the module has sufficient content.")
    }
    
    console.log(`✅ Generated ${data.questions.length} questions from module content`)
    return data.questions
  } catch (error) {
    console.error("❌ Error generating quiz:", error)
    // DO NOT use fallback - throw error to force proper content-based generation
    throw error
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

