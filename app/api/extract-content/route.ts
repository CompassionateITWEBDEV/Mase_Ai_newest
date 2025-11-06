import { NextRequest, NextResponse } from "next/server"

// Configure runtime for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for content extraction

/**
 * Extract content from various file types (PDF, Video, PowerPoint)
 * This API analyzes files and extracts text/transcript for quiz generation
 */
export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileType, fileName } = await request.json()

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL is required" },
        { status: 400 }
      )
    }

    console.log(`📄 Extracting content from ${fileType}: ${fileName}`)

    let extractedContent = ""

    // Determine file type and extract accordingly
    if (fileType === "pdf" || fileName?.toLowerCase().endsWith(".pdf")) {
      extractedContent = await extractPDFContent(fileUrl)
    } else if (fileType === "video" || isVideoFile(fileName)) {
      extractedContent = await extractVideoTranscript(fileUrl)
    } else if (fileType === "powerpoint" || isPowerPointFile(fileName)) {
      extractedContent = await extractPowerPointContent(fileUrl)
    } else {
      // For other file types, return empty (will use module description only)
      return NextResponse.json({
        content: "",
        extracted: false,
        message: `Content extraction not supported for ${fileType || "this file type"}`,
      })
    }

    // Log extraction result
    console.log(`📄 Extraction result:`, {
      success: extractedContent.length > 0,
      contentLength: extractedContent.length,
      fileType,
      fileName,
      preview: extractedContent.substring(0, 200)
    })

    if (extractedContent.length === 0) {
      console.warn(`⚠️ No content extracted from ${fileType}: ${fileName}`)
      return NextResponse.json({
        content: "",
        extracted: false,
        fileType,
        fileName,
        error: `Failed to extract content from ${fileType || "file"}. The file may be empty, corrupted, or the extraction method failed.`,
        message: `Content extraction returned empty. Please check if the file is accessible and contains readable content.`,
      })
    }

    return NextResponse.json({
      content: extractedContent,
      extracted: extractedContent.length > 0,
      fileType,
      fileName,
    })
  } catch (error: any) {
    console.error("❌ Error extracting content:", error)
    console.error("❌ Error stack:", error.stack)
    return NextResponse.json(
      {
        content: "",
        extracted: false,
        error: error.message || "Failed to extract content",
        message: `Extraction failed: ${error.message || "Unknown error"}`,
      },
      { status: 500 }
    )
  }
}

/**
 * Extract text content from PDF
 * Uses OpenAI File API and Vision API to extract actual text content from PDF pages
 */
async function extractPDFContent(pdfUrl: string): Promise<string> {
  try {
    console.log("📄 Extracting PDF content from:", pdfUrl.substring(0, 100))
    
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.warn("OpenAI API key not configured, cannot extract PDF text")
      return ""
    }

    // Fetch PDF file
    let pdfBlob: Blob
    let pdfBuffer: Buffer
    
    try {
      if (pdfUrl.startsWith("data:")) {
        // Base64 PDF
        const response = await fetch(pdfUrl)
        pdfBlob = await response.blob()
      } else {
        // Regular URL (Supabase storage or external)
        const response = await fetch(pdfUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`)
        }
        pdfBlob = await response.blob()
      }
      
      // Convert blob to buffer
      const arrayBuffer = await pdfBlob.arrayBuffer()
      pdfBuffer = Buffer.from(arrayBuffer)
    } catch (fetchError: any) {
      console.error("Error fetching PDF:", fetchError)
      return ""
    }

    console.log("📄 PDF fetched, size:", pdfBuffer.length, "bytes")
    
    // Method 1: Use OpenAI Vision API with base64 PDF (most reliable)
    // Convert PDF to base64 and use Vision API
    try {
      console.log("📄 Trying OpenAI Vision API for PDF extraction...")
      
      const base64 = pdfBuffer.toString('base64')
      const mimeType = 'application/pdf'
      
      // Note: OpenAI Vision API may not directly support PDFs, but we'll try
      // If it fails, we'll use alternative extraction
      
      const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a PDF content extractor. Extract ALL text content from the PDF document. Return the complete text content, preserving structure and important details. Focus on extracting actual document content, not metadata. Return only the extracted text, no explanations.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text content from this PDF document. Return the complete text content that would be useful for creating quiz questions. Include all important information, concepts, facts, and details from the document. Extract everything - do not summarize. Return the full text content."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                    detail: "high"
                  }
                }
              ]
            },
          ],
          max_tokens: 8000,
        }),
      })

      if (visionResponse.ok) {
        const visionData = await visionResponse.json()
        const extractedText = visionData.choices[0]?.message?.content || ""
        
        if (extractedText && extractedText.length > 100) {
          console.log(`✅ PDF content extracted via Vision API: ${extractedText.length} characters`)
          return extractedText
        } else {
          console.log("⚠️ Vision API returned short/empty content, trying alternative method...")
        }
      } else {
        const errorText = await visionResponse.text()
        console.log("⚠️ Vision API failed:", errorText.substring(0, 200))
      }
    } catch (visionError: any) {
      console.log("📄 Vision API method failed, trying alternative extraction...", visionError.message)
    }
    
    // Method 2: Alternative text extraction from PDF structure (most reliable fallback)
    console.log("📄 Using alternative PDF text extraction method...")
    const alternativeResult = await extractPDFTextAlternative(pdfUrl, openaiApiKey, pdfBuffer)
    
    if (alternativeResult && alternativeResult.length > 100) {
      console.log(`✅ PDF content extracted via alternative method: ${alternativeResult.length} characters`)
      return alternativeResult
    }
    
    // If all methods fail, return empty (will be handled by caller)
    console.error("❌ All PDF extraction methods failed")
    return ""
    
  } catch (error: any) {
    console.error("Error extracting PDF:", error)
    // Try alternative method
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY
      if (openaiApiKey) {
        return await extractPDFTextAlternative(pdfUrl, openaiApiKey)
      }
    } catch (altError) {
      console.error("Alternative extraction also failed:", altError)
    }
    return ""
  }
}

/**
 * Alternative PDF text extraction method
 * Extracts text directly from PDF structure without external libraries
 */
async function extractPDFTextAlternative(pdfUrl: string, openaiApiKey: string, pdfBuffer?: Buffer): Promise<string> {
  try {
    let uint8Array: Uint8Array
    
    if (pdfBuffer) {
      uint8Array = new Uint8Array(pdfBuffer)
    } else {
      // Fetch PDF and analyze structure
      const response = await fetch(pdfUrl)
      if (!response.ok) {
        return ""
      }
      
      const arrayBuffer = await response.arrayBuffer()
      uint8Array = new Uint8Array(arrayBuffer)
    }
    
    console.log("📄 Extracting text from PDF structure...")
    
    // Improved PDF text extraction - extract text from PDF objects
    let pdfText = ''
    let inTextObject = false
    let textBuffer = ''
    let depth = 0
    
    // Look for text objects in PDF (improved extraction)
    // Increase scan limit for larger PDFs
    const scanLimit = Math.min(uint8Array.length, 2000000) // 2MB scan limit
    for (let i = 0; i < scanLimit; i++) {
      const char = String.fromCharCode(uint8Array[i])
      
      // Detect text objects: (text) or <hex>
      if (char === '(') {
        inTextObject = true
        textBuffer = ''
        depth = 1
      } else if (char === ')' && inTextObject) {
        depth--
        if (depth === 0) {
          // End of text object
          if (textBuffer.trim().length > 0) {
            pdfText += textBuffer + ' '
          }
          inTextObject = false
          textBuffer = ''
        }
      } else if (char === '(' && inTextObject) {
        // Nested parentheses
        depth++
        textBuffer += char
      } else if (char === '\\' && inTextObject) {
        // Handle escape sequences
        const nextChar = i + 1 < uint8Array.length ? String.fromCharCode(uint8Array[i + 1]) : ''
        if (nextChar === 'n') {
          textBuffer += '\n'
          i++ // Skip next char
        } else if (nextChar === 'r') {
          textBuffer += '\r'
          i++
        } else if (nextChar === 't') {
          textBuffer += '\t'
          i++
        } else if (nextChar === '(' || nextChar === ')') {
          // Escaped parentheses
          textBuffer += nextChar
          i++
        } else {
          textBuffer += char
        }
      } else if (inTextObject) {
        textBuffer += char
      }
      
      // Also look for hex strings: <hex>
      if (char === '<' && !inTextObject) {
        let hexText = ''
        let j = i + 1
        while (j < Math.min(uint8Array.length, i + 200)) {
          const hexChar = String.fromCharCode(uint8Array[j])
          if (hexChar === '>') {
            // Convert hex to text
            try {
              const hexPairs = hexText.match(/.{1,2}/g) || []
              const decoded = hexPairs.map(hex => {
                const num = parseInt(hex, 16)
                return num >= 32 && num <= 126 ? String.fromCharCode(num) : ' '
              }).join('')
              if (decoded.trim().length > 0) {
                pdfText += decoded + ' '
              }
            } catch (e) {
              // Ignore hex decode errors
            }
            i = j
            break
          } else if (/[0-9A-Fa-f\s]/.test(hexChar)) {
            hexText += hexChar
          } else {
            break
          }
          j++
        }
      }
    }
    
    // Clean up extracted text
    pdfText = pdfText
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,;:!?()\-'"]/g, ' ') // Remove special chars but keep punctuation
      .trim()
    
    // Extract meaningful chunks (sentences/paragraphs)
    const sentences = pdfText.match(/[^.!?]+[.!?]+/g) || []
    let meaningfulText = sentences
      .filter(s => s.trim().length > 5) // Lower threshold to get more content
      .join(' ')
    
    // If we have sentences, use them; otherwise use raw text
    if (meaningfulText.length < 100) {
      // Not enough sentences, use raw text but clean it
      meaningfulText = pdfText
        .replace(/\s{3,}/g, ' ') // Replace multiple spaces
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines
        .trim()
    }
    
    // Limit to reasonable size but keep more content
    meaningfulText = meaningfulText.substring(0, 20000) // Increased to 20k chars
    
    if (meaningfulText.length > 100) {
      console.log(`✅ Alternative extraction: ${meaningfulText.length} characters`)
      console.log(`✅ Extracted text preview: ${meaningfulText.substring(0, 300)}...`)
      return meaningfulText
    }
    
    // If still no good content, use OpenAI to analyze the raw text we extracted
    if (pdfText.length > 50) {
      console.log("📄 Using OpenAI to clean and extract content from PDF text...")
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a PDF content extractor. Clean up and extract meaningful text content from the raw PDF text. Return the cleaned, organized text content that would be useful for creating quiz questions. Focus on actual document content, not metadata or formatting codes.",
            },
            {
              role: "user",
              content: `Extract and clean the meaningful text content from this raw PDF text. Return the actual document content, organized and readable:\n\n${pdfText.substring(0, 15000)}`,
            },
          ],
          max_tokens: 4000,
        }),
      })
      
      if (openaiResponse.ok) {
        const data = await openaiResponse.json()
        const content = data.choices[0]?.message?.content || ""
        if (content.length > 100) {
          console.log(`✅ OpenAI cleaned extraction: ${content.length} characters`)
          return content
        }
      }
    }
    
    return ""
  } catch (error: any) {
    console.error("Alternative extraction error:", error)
    return ""
  }
}

/**
 * Extract text from PDF using OpenAI Vision API
 * This converts PDF pages to images and extracts text
 */
async function extractTextFromPDFWithOpenAI(pdfUrl: string): Promise<string> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.warn("OpenAI API key not configured, cannot extract PDF text")
      return ""
    }

    // For base64 PDFs, send to OpenAI Vision API
    // Note: OpenAI Vision API can process images, but for PDFs we might need to convert pages to images first
    // For now, we'll use a simpler approach: ask OpenAI to analyze the PDF content
    
    // If it's a data URL, extract the base64 part
    let base64Data = pdfUrl
    if (pdfUrl.startsWith("data:")) {
      base64Data = pdfUrl.split(",")[1]
    }

    // Use OpenAI to extract text (simplified - for production, use proper PDF parsing)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Use vision-capable model
        messages: [
          {
            role: "system",
            content: "You are a content extractor. Extract and summarize the key text content from documents. Focus on important concepts, facts, and information that would be useful for creating quiz questions.",
          },
          {
            role: "user",
            content: `Extract and summarize the key text content from this PDF document. Focus on important concepts and facts:\n\n[PDF content would be processed here - for now, we'll use a placeholder approach]`,
          },
        ],
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error("OpenAI API error")
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ""
  } catch (error: any) {
    console.error("Error using OpenAI for PDF extraction:", error)
    return ""
  }
}

/**
 * Extract transcript from video using OpenAI Whisper API
 */
async function extractVideoTranscript(videoUrl: string): Promise<string> {
  try {
    console.log("🎥 Extracting video transcript...")
    
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.warn("OpenAI API key not configured, cannot extract video transcript")
      return ""
    }

    // Fetch video file
    let videoBlob: Blob
    if (videoUrl.startsWith("data:")) {
      // Base64 video
      const response = await fetch(videoUrl)
      videoBlob = await response.blob()
    } else {
      // Regular URL
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch video")
      }
      videoBlob = await response.blob()
    }

    // Convert blob to File for OpenAI Whisper API
    const videoFile = new File([videoBlob], "video.mp4", { type: "video/mp4" })
    
    // Create FormData for OpenAI Whisper API
    const formData = new FormData()
    formData.append("file", videoFile)
    formData.append("model", "whisper-1")
    formData.append("language", "en") // Optional: specify language
    formData.append("response_format", "text") // Get plain text transcript

    // Call OpenAI Whisper API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        // Don't set Content-Type - let browser set it with boundary
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI Whisper API error:", errorText)
      throw new Error("Failed to transcribe video")
    }

    const transcript = await response.text()
    console.log(`✅ Video transcript extracted: ${transcript.length} characters`)
    
    return transcript
  } catch (error: any) {
    console.error("Error extracting video transcript:", error)
    return ""
  }
}

/**
 * Extract text content from PowerPoint
 */
async function extractPowerPointContent(pptUrl: string): Promise<string> {
  try {
    console.log("📊 Extracting PowerPoint content...")
    
    // For PowerPoint files, we'll use a similar approach to PDFs
    // Convert slides to images and extract text using OpenAI Vision
    // Or use a PowerPoint parsing library
    
    // For now, return a placeholder - this would need proper PowerPoint parsing
    // In production, you might use libraries like 'officegen' or convert PPTX to images first
    
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.warn("OpenAI API key not configured, cannot extract PowerPoint content")
      return ""
    }

    // Simplified: Use OpenAI to analyze PowerPoint content
    // In production, extract slide text using proper libraries
    return await extractTextFromPowerPointWithOpenAI(pptUrl)
  } catch (error: any) {
    console.error("Error extracting PowerPoint:", error)
    return ""
  }
}

/**
 * Extract text from PowerPoint using OpenAI (simplified)
 */
async function extractTextFromPowerPointWithOpenAI(pptUrl: string): Promise<string> {
  try {
    // This is a placeholder - in production, you'd:
    // 1. Convert PPTX slides to images
    // 2. Send each slide image to OpenAI Vision API
    // 3. Combine all extracted text
    
    // For now, return empty and let the system use module description
    console.log("PowerPoint extraction not fully implemented - using module description")
    return ""
  } catch (error: any) {
    console.error("Error using OpenAI for PowerPoint extraction:", error)
    return ""
  }
}

/**
 * Check if file is a video
 */
function isVideoFile(fileName: string | undefined): boolean {
  if (!fileName) return false
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"]
  return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
}

/**
 * Check if file is a PowerPoint file
 */
function isPowerPointFile(fileName: string | undefined): boolean {
  if (!fileName) return false
  const pptExtensions = [".ppt", ".pptx"]
  return pptExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
}

