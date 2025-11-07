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
  frames?: Array<{ data: string; timestamp?: string }> // Client-side extracted video frames
}

/**
 * Extract content from files (PDF, Video, PowerPoint) for quiz generation
 */
async function extractFileContent(
  fileUrl?: string,
  fileType?: string,
  fileName?: string,
  frames?: Array<{ data: string; timestamp?: string }>
): Promise<string> {
  if (!fileUrl && !frames) {
    console.warn("⚠️ No fileUrl or frames provided for extraction")
    return ""
  }

  try {
    console.log(`🔍 Extracting content from ${fileType}: ${fileName}`)
    if (fileUrl) {
      console.log(`🔍 File URL: ${fileUrl.substring(0, 100)}...`)
    }
    if (frames && frames.length > 0) {
      console.log(`📸 Using ${frames.length} client-extracted frames for video OCR`)
    }
    
    const response = await fetch("/api/extract-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileUrl,
        fileType,
        fileName,
        frames, // Pass frames for client-side extracted video frames
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`❌ Extraction failed: ${response.status}`, errorData)
      // Throw error with helpful message
      throw new Error(errorData.message || errorData.error || `Extraction failed with status ${response.status}`)
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
      // If extraction failed, throw error with helpful message
      const errorMsg = data.message || data.error || "Content extraction returned empty. Please check if the file is accessible and contains readable content."
      console.warn(`⚠️ Extraction returned empty or invalid content:`, {
        extracted: data.extracted,
        contentLength: data.content?.length || 0,
        error: data.error,
        message: data.message
      })
      throw new Error(errorMsg)
    }
  } catch (error: any) {
    console.error("❌ Error extracting file content:", error)
    // Re-throw error to propagate to caller
    throw error
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
  frames, // Client-side extracted video frames
}: GenerateQuizParams): Promise<QuizQuestion[]> {
  try {
    // ALWAYS extract content from file if fileUrl is provided (regardless of fileContent)
    let extractedFileContent = ""
    
    if (fileUrl) {
      console.log("📄 ALWAYS extracting content from file for quiz generation...", { fileUrl, fileType, fileName })
      try {
        extractedFileContent = await extractFileContent(fileUrl, fileType, fileName, frames)
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

    // CRITICAL: Use ONLY extracted file content - NO database metadata (module title, description, training info)
    // Questions must be generated ONLY from the actual file content (PDF, PowerPoint, video)
    // DO NOT use module title, description, training title, or any database metadata
    
    let contentToAnalyze = ""
    
    // ONLY use extracted file content - ignore all database metadata
    if (extractedFileContent && extractedFileContent.trim().length > 50) {
      // This is the actual extracted content from the file (PDF text, video transcript, etc.)
      // Use ONLY this content - NO module title, description, or training info
      contentToAnalyze = extractedFileContent.substring(0, 15000) // Use up to 15k chars of extracted content
      console.log("✅ Using ONLY extracted file content for quiz generation:", extractedFileContent.length, "characters")
      console.log("✅ Extracted content preview:", extractedFileContent.substring(0, 500))
      console.log("✅ NOT using module title, description, or training metadata from database")
      } else {
        // If no file content extracted, provide helpful error message
        // Check if it's a video file to provide specific guidance
        const isVideo = fileType === "video" || fileName?.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv)$/)
        
        let errorMsg = ""
        if (isVideo) {
          errorMsg = `Unable to extract content from video file. ` +
            `OpenAI Whisper API has a 25MB file size limit. ` +
            `\n\nFor large videos (1 hour, 30 mins, etc.), please:` +
            `\n1. Compress video to <25MB using video compression tools (HandBrake, FFmpeg, or online compressors)` +
            `\n2. Split long videos into smaller modules (<25MB each)` +
            `\n3. Extract audio track separately and upload as audio file` +
            `\n4. Use a video processing service to extract and compress audio` +
            `\n5. Create quiz questions manually for this module` +
            `\n\nQuestions must be generated from extracted file content, not from module title/description.`
        } else {
          errorMsg = `No content extracted from file. Cannot generate quiz from database metadata.
Please ensure:
1. File is accessible (PDF, PowerPoint, or video)
2. PDF.co API is configured correctly (PDF_CO_API_KEY) for PDF/PowerPoint
3. OpenAI API is configured correctly (OPENAI_API_KEY) for video transcription
4. File contains extractable content
5. For videos: File size is <25MB and has an audio track

Questions must be generated from extracted file content, not from module title/description.

If extraction fails, you may need to:
- Compress large videos to <25MB
- Ensure videos have audio tracks
- Check that files are accessible
- Manually create quiz questions if automatic extraction is not possible`
        }
        
        console.error("❌", errorMsg)
        throw new Error(errorMsg)
      }
    
    // Ensure we have sufficient extracted content
    // Filter out error messages and validate content quality
    const errorPatterns = [
      "i'm sorry",
      "i can't extract",
      "no text",
      "no visible text",
      "cannot extract",
      "there is no",
      "does not contain"
    ]
    
    const hasRealContent = errorPatterns.every(pattern => 
      !contentToAnalyze.toLowerCase().includes(pattern)
    ) && contentToAnalyze.trim().length > 100
    
    const minContentLength = 100 // Need at least 100 characters of extracted content
    
    if (!hasRealContent || contentToAnalyze.length < minContentLength) {
      // Check if it's mostly error messages
      const errorCount = errorPatterns.filter(pattern => 
        contentToAnalyze.toLowerCase().includes(pattern)
      ).length
      
      if (errorCount > 0) {
        throw new Error(
          `No valid content extracted from video. The extraction returned error messages instead of actual content. ` +
          `\n\nPossible reasons:` +
          `\n1. Video frames don't contain visible text (person talking without slides)` +
          `\n2. Video is too large (>25MB) - audio transcript not extracted` +
          `\n3. Video has no audio track or visual text` +
          `\n\nSolutions:` +
          `\n1. Ensure video has visible text/slides or clear audio narration` +
          `\n2. Compress video to <25MB to enable audio transcription` +
          `\n3. Add slides or visual aids with text to the video` +
          `\n4. Create quiz questions manually for this module` +
          `\n\nQuestions must be generated from extracted video content (speech/text), not from error messages.`
        )
      }
      
      throw new Error(
        `Insufficient content extracted from file. Only ${contentToAnalyze.length} characters extracted. ` +
        `Need at least ${minContentLength} characters of extracted file content to generate quiz questions. ` +
        `Please ensure the file contains extractable text content (speech, slides, or visual text).`
      )
    }
    
    console.log(`📝 Content to analyze (EXTRACTED FILE CONTENT ONLY): ${contentToAnalyze.length} characters`)
    console.log(`📝 Content preview: ${contentToAnalyze.substring(0, 300)}...`)
    
    // Log content for debugging
    console.log(`📊 Content summary (ONLY extracted file content, NO database metadata):`, {
      extractedFileLength: extractedFileContent?.length || 0,
      contentToAnalyzeLength: contentToAnalyze.length,
      fileType: fileType || "unknown",
      fileName: fileName || "unknown",
      note: "NOT using module title, description, or training metadata"
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
 * REMOVED: Fallback questions function
 * 
 * NO HARDCODED QUESTIONS - All questions must be generated from extracted data
 * If content extraction fails, the system will throw an error instead of using fallback
 * This ensures questions are always based on actual file content
 */

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

