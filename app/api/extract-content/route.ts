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
    const { fileUrl, fileType, fileName, frames } = await request.json()

    if (!fileUrl && !frames) {
      return NextResponse.json(
        { error: "File URL or frames are required" },
        { status: 400 }
      )
    }

    console.log(`📄 Extracting content from ${fileType}: ${fileName}`)

    let extractedContent = ""

    // Determine file type and extract accordingly
    if (fileType === "pdf" || fileName?.toLowerCase().endsWith(".pdf")) {
      extractedContent = await extractPDFContent(fileUrl)
    } else if (fileType === "video" || isVideoFile(fileName)) {
      // If frames are provided (client-side extraction), use them for OCR
      if (frames && Array.isArray(frames) && frames.length > 0) {
        console.log(`📸 Using ${frames.length} client-extracted frames for video OCR...`)
        extractedContent = await extractVideoTranscriptFromFrames(frames, fileUrl)
      } else {
        // Server-side extraction (existing method)
      extractedContent = await extractVideoTranscript(fileUrl)
      }
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
      
      // For videos, provide more specific error message
      let errorMessage = `Failed to extract content from ${fileType || "file"}. The file may be empty, corrupted, or the extraction method failed.`
      let userMessage = `Content extraction returned empty. Please check if the file is accessible and contains readable content.`
      
      if (fileType === "video") {
        // Check if frames were provided but had no text
        if (frames && Array.isArray(frames) && frames.length > 0) {
          errorMessage = `Video content extraction failed. Frames were extracted but contain no visible text. The video may show a person talking without slides, or the text is not clearly visible.`
          userMessage = `Unable to extract content from video. The video frames don't contain visible text (may be a talking head without slides). ` +
            `\n\nFor large videos (>25MB), please:` +
            `\n1. Compress video to <25MB to enable audio transcription (recommended)` +
            `\n2. Add slides or visual aids with text to the video` +
            `\n3. Ensure video has clear audio narration` +
            `\n4. Create quiz questions manually for this module`
        } else {
          errorMessage = `Video content extraction failed. The video may be too large (>25MB), have no audio track, or frames could not be extracted.`
          userMessage = `Unable to extract content from video. For videos larger than 25MB, please compress the video to <25MB to enable audio transcription. You may need to create quiz questions manually.`
        }
      }
      
      return NextResponse.json({
        content: "",
        extracted: false,
        fileType,
        fileName,
        error: errorMessage,
        message: userMessage,
      }, { status: 200 }) // Return 200 with error info instead of error status
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
 * Extract text content from PDF using PDF.co API
 */
async function extractPDFContent(pdfUrl: string): Promise<string> {
  try {
    console.log("📄 Extracting PDF content using PDF.co from:", pdfUrl.substring(0, 100))
    
    const pdfCoApiKey = process.env.PDF_CO_API_KEY
    
    // Log PDF.co connection status
    console.log("🔌 PDF.co Connection Check:")
    if (!pdfCoApiKey) {
      console.error("❌ PDF.co API Key: NOT CONFIGURED")
      console.error("❌ PDF.co Status: DISCONNECTED - PDF_CO_API_KEY environment variable is missing")
      const errorMsg = "PDF.co API key not configured. Please set PDF_CO_API_KEY environment variable."
      throw new Error(errorMsg)
    } else {
      console.log("✅ PDF.co API Key: CONFIGURED")
      console.log("✅ PDF.co API Key Length:", pdfCoApiKey.length, "characters")
      console.log("✅ PDF.co API Key Preview:", pdfCoApiKey.substring(0, 10) + "..." + pdfCoApiKey.substring(pdfCoApiKey.length - 4))
    }
    
    // Check if URL is base64 data URL - PDF.co doesn't accept these directly
    const isBase64DataUrl = pdfUrl.startsWith("data:application/pdf;base64,") || pdfUrl.startsWith("data:application/pdf;base64/")
    let actualPdfUrl = pdfUrl
    let extractedText = ""
    
    // If it's a base64 data URL, we need to upload it to PDF.co first
    if (isBase64DataUrl) {
      console.log("📄 Detected base64 data URL - uploading to PDF.co first...")
      try {
        // Extract base64 data
        const base64Data = pdfUrl.split(",")[1] || pdfUrl.replace(/^data:application\/pdf[^,]*,/, "")
        const pdfBuffer = Buffer.from(base64Data, 'base64')
        
        console.log("📄 Uploading PDF file to PDF.co...")
        // Upload file to PDF.co using file upload endpoint
        const uploadFormData = new FormData()
        // Convert Buffer to Uint8Array for Blob
        const uint8Array = new Uint8Array(pdfBuffer)
        const pdfBlob = new Blob([uint8Array], { type: 'application/pdf' })
        uploadFormData.append('file', pdfBlob, 'document.pdf')
        
        // First, upload the file to PDF.co
        const uploadResponse = await fetch("https://api.pdf.co/v1/file/upload", {
          method: "POST",
          headers: {
            "x-api-key": pdfCoApiKey,
          },
          body: uploadFormData,
        })
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          console.log("✅ File uploaded to PDF.co:", JSON.stringify(uploadData).substring(0, 300))
          
          // Get the uploaded file URL
          if (uploadData.url) {
            actualPdfUrl = uploadData.url
            console.log("✅ Using uploaded file URL:", actualPdfUrl.substring(0, 100))
          } else if (uploadData.body && uploadData.body.url) {
            actualPdfUrl = uploadData.body.url
            console.log("✅ Using uploaded file URL from body:", actualPdfUrl.substring(0, 100))
          } else {
            throw new Error("PDF.co upload succeeded but no file URL returned")
          }
        } else {
          const uploadError = await uploadResponse.text()
          console.error("❌ PDF.co file upload failed:", uploadError.substring(0, 300))
          // Fall through to try direct base64 method
        }
      } catch (uploadError: any) {
        console.warn("⚠️ File upload to PDF.co failed, trying direct base64 method:", uploadError.message)
        // Will try direct method below
      }
    }
    
    // Test PDF.co API connection
    console.log("🔌 Testing PDF.co API Connection...")
    console.log("🔌 PDF.co API Endpoint: https://api.pdf.co/v1/pdf/convert/to/text")

    // Method 1: Try PDF.co PDF to Text conversion endpoint
    try {
      console.log("📄 Attempting PDF.co PDF to Text conversion...")
      const requestStartTime = Date.now()
      
      // If still base64, try using it directly with file parameter
      let requestBody: any = {
        inline: true,
        async: false,
      }
      
      if (isBase64DataUrl && actualPdfUrl === pdfUrl) {
        // Use base64 directly in file parameter
        const base64Data = pdfUrl.split(",")[1] || pdfUrl.replace(/^data:application\/pdf[^,]*,/, "")
        requestBody.file = `data:application/pdf;base64,${base64Data}`
        console.log("📄 Using base64 file parameter (direct method)")
      } else {
        // Use URL
        requestBody.url = actualPdfUrl
        console.log("📄 Using file URL:", actualPdfUrl.substring(0, 100))
      }
      
      const response = await fetch("https://api.pdf.co/v1/pdf/convert/to/text", {
        method: "POST",
        headers: {
          "x-api-key": pdfCoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const requestDuration = Date.now() - requestStartTime
      console.log(`📄 PDF.co API Response Time: ${requestDuration}ms`)
      console.log(`📄 PDF.co response status: ${response.status}`)
      console.log(`📄 PDF.co response headers:`, Object.fromEntries(response.headers.entries()))
      
      // Log connection status
      if (response.status === 200 || response.status === 201) {
        console.log("✅ PDF.co Connection: SUCCESS")
        console.log("✅ PDF.co API: CONNECTED AND WORKING")
      } else if (response.status === 401) {
        console.error("❌ PDF.co Connection: FAILED - Unauthorized (Invalid API Key)")
        console.error("❌ PDF.co Status: DISCONNECTED - Check PDF_CO_API_KEY")
      } else if (response.status === 403) {
        console.error("❌ PDF.co Connection: FAILED - Forbidden (API Key may be invalid or expired)")
        console.error("❌ PDF.co Status: DISCONNECTED - Check PDF_CO_API_KEY")
      } else {
        console.warn(`⚠️ PDF.co Connection: Response status ${response.status}`)
        console.warn(`⚠️ PDF.co Status: CONNECTED but may have issues`)
      }

      if (response.ok) {
        const data = await response.json()
        console.log("✅ PDF.co API Response: SUCCESS")
        console.log("📄 PDF.co response data keys:", Object.keys(data))
        console.log("📄 PDF.co response preview:", JSON.stringify(data).substring(0, 500))
        console.log("✅ PDF.co Connection Status: CONNECTED AND RESPONDING")
        
        // Check various response formats
        if (data.body) {
          extractedText = typeof data.body === "string" ? data.body : JSON.stringify(data.body)
        } else if (data.text) {
          extractedText = data.text
        } else if (data.content) {
          extractedText = data.content
        } else if (data.result) {
          extractedText = typeof data.result === "string" ? data.result : data.result.text || JSON.stringify(data.result)
        } else if (data.url) {
          // If PDF.co returns a URL to download the text file
          console.log("📄 PDF.co returned download URL, fetching text file...")
          const textResponse = await fetch(data.url)
          if (textResponse.ok) {
            extractedText = await textResponse.text()
          }
        } else if (data.bodyText) {
          extractedText = data.bodyText
        } else if (data.extractedText) {
          extractedText = data.extractedText
        } else if (data.error === false && data.body) {
          // Some PDF.co responses have error: false and body with text
          extractedText = data.body
        }
        
        if (extractedText && extractedText.trim().length > 100) {
          console.log(`✅ PDF content extracted via PDF.co: ${extractedText.length} characters`)
          console.log(`✅ Extracted text preview: ${extractedText.substring(0, 300)}...`)
          return extractedText.trim()
        } else {
          console.warn("⚠️ PDF.co returned response but no extractable text found")
          console.warn("⚠️ Response structure:", JSON.stringify(data).substring(0, 1000))
        }
      } else {
        const errorText = await response.text()
        console.error(`❌ PDF.co API error (${response.status}):`, errorText.substring(0, 500))
        console.error(`❌ PDF.co Connection Status: CONNECTED but ERROR occurred`)
        
        // Try to parse error message
        try {
          const errorData = JSON.parse(errorText)
          console.error("❌ PDF.co Error Details:", JSON.stringify(errorData))
          if (errorData.message) {
            throw new Error(`PDF.co API error: ${errorData.message}`)
          }
        } catch {
          throw new Error(`PDF.co API error: ${errorText.substring(0, 200)}`)
        }
      }
    } catch (method1Error: any) {
      console.error("❌ Method 1 (PDF to Text) failed:", method1Error.message)
      console.error("❌ PDF.co Connection Status: FAILED - Method 1 error")
      console.error("❌ Error details:", method1Error)
      // Continue to try other methods
    }

    // Method 2: Try PDF.co with direct file upload using FormData (if URL method doesn't work)
    if (!extractedText || extractedText.trim().length < 100) {
      try {
        console.log("📄 Attempting PDF.co with FormData file upload method...")
        
        let pdfBuffer: Buffer
        
        // Get PDF buffer from base64 or fetch
        if (isBase64DataUrl) {
          const base64Data = pdfUrl.split(",")[1] || pdfUrl.replace(/^data:application\/pdf[^,]*,/, "")
          pdfBuffer = Buffer.from(base64Data, 'base64')
        } else {
          // Fetch the PDF file
          const pdfResponse = await fetch(pdfUrl)
          if (!pdfResponse.ok) {
            throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`)
          }
          const pdfBlob = await pdfResponse.blob()
          const arrayBuffer = await pdfBlob.arrayBuffer()
          pdfBuffer = Buffer.from(arrayBuffer)
        }
        
        // Create FormData for file upload
        const formData = new FormData()
        // Convert Buffer to Uint8Array for Blob
        const uint8Array = new Uint8Array(pdfBuffer)
        const pdfBlob = new Blob([uint8Array], { type: 'application/pdf' })
        formData.append('file', pdfBlob, 'document.pdf')
        
        // Upload and extract in one step using PDF.co
        const uploadResponse = await fetch("https://api.pdf.co/v1/pdf/convert/to/text", {
          method: "POST",
          headers: {
            "x-api-key": pdfCoApiKey,
            // Don't set Content-Type - let browser set it with boundary
          },
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          console.log("📄 PDF.co FormData upload response:", JSON.stringify(uploadData).substring(0, 500))
          
          // Extract text from response
          if (uploadData.body) {
            extractedText = typeof uploadData.body === "string" ? uploadData.body : JSON.stringify(uploadData.body)
          } else if (uploadData.text) {
            extractedText = uploadData.text
          } else if (uploadData.content) {
            extractedText = uploadData.content
          } else if (uploadData.url) {
            // If PDF.co returns a URL to download the text file
            console.log("📄 PDF.co returned download URL, fetching text file...")
            const textResponse = await fetch(uploadData.url)
            if (textResponse.ok) {
              extractedText = await textResponse.text()
            }
          }
          
          if (extractedText && extractedText.trim().length > 100) {
            console.log(`✅ PDF content extracted via PDF.co (FormData method): ${extractedText.length} characters`)
            return extractedText.trim()
          }
        } else {
          const errorText = await uploadResponse.text()
          console.error("❌ PDF.co FormData upload failed:", errorText.substring(0, 300))
        }
      } catch (method2Error: any) {
        console.error("❌ Method 2 (FormData Upload) failed:", method2Error.message)
      }
    }

    // If all methods failed, throw error (NO FALLBACK - questions must be from extracted data)
    if (!extractedText || extractedText.trim().length < 100) {
      console.error("❌ PDF.co Connection Status: FINAL STATUS - FAILED")
      console.error("❌ PDF.co Extraction: FAILED - No content extracted")
      console.error("❌ PDF.co Summary:")
      console.error("   - API Key: " + (pdfCoApiKey ? "CONFIGURED" : "NOT CONFIGURED"))
      console.error("   - Connection: FAILED")
      console.error("   - Content Extracted: 0 characters")
      
      const errorMsg = `PDF.co extraction failed. Cannot generate quiz from file content. 
Please check:
1. PDF_CO_API_KEY is set correctly in environment variables
2. PDF.co API is accessible and working
3. PDF file URL is publicly accessible
4. PDF file is not corrupted or password-protected

Error: No content extracted from PDF. Quiz questions will NOT be generated.`
      console.error("❌", errorMsg)
      throw new Error(errorMsg)
    }
    
    // Success logging
    console.log("✅ PDF.co Connection Status: FINAL STATUS - SUCCESS")
    console.log("✅ PDF.co Extraction: SUCCESS")
    console.log("✅ PDF.co Summary:")
    console.log("   - API Key: CONFIGURED")
    console.log("   - Connection: SUCCESS")
    console.log("   - Content Extracted:", extractedText.length, "characters")

    return extractedText.trim()
  } catch (error: any) {
    console.error("❌ Error extracting PDF with PDF.co:", error)
    // Re-throw error to prevent fallback questions
    throw error
  }
}

/**
 * Extract comprehensive content from video:
 * 1. Audio transcript using OpenAI Whisper (tracks spoken content)
 * 2. Visual content from frames (slides, text, visual aids) using frame-by-frame analysis
 * 3. Combine audio + visual content for complete extraction
 */
async function extractVideoTranscript(videoUrl: string): Promise<string> {
  try {
    console.log("🎥 Starting comprehensive video content extraction (audio + visual)...")
    console.log("📹 Video URL:", videoUrl.substring(0, 200))
    
    const openaiApiKey = process.env.OPENAI_API_KEY
    const pdfCoApiKey = process.env.PDF_CO_API_KEY
    
    if (!openaiApiKey) {
      console.warn("⚠️ OpenAI API key not configured, cannot extract video content")
      throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.")
    }

    // Fetch video file
    let videoBlob: Blob
    let videoBuffer: Buffer
    
    try {
      if (videoUrl.startsWith("data:")) {
        // Base64 video
        console.log("📹 Processing base64 video...")
        const response = await fetch(videoUrl)
        videoBlob = await response.blob()
      } else if (videoUrl.includes("supabase.co") || videoUrl.includes("storage.googleapis.com")) {
        // Supabase Storage URL - try to fetch directly (should be public)
        console.log("📹 Processing Supabase Storage URL...")
        const response = await fetch(videoUrl, {
          headers: {
            'Accept': 'video/*',
          }
        })
        if (!response.ok) {
          console.error(`❌ Failed to fetch video from storage: ${response.status} ${response.statusText}`)
          throw new Error(`Failed to fetch video from storage: ${response.status} ${response.statusText}`)
        }
        videoBlob = await response.blob()
      } else {
        // Regular URL
        console.log("📹 Processing regular URL...")
        const response = await fetch(videoUrl, {
          headers: {
            'Accept': 'video/*',
          }
        })
        if (!response.ok) {
          console.error(`❌ Failed to fetch video: ${response.status} ${response.statusText}`)
          throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`)
        }
        videoBlob = await response.blob()
      }
      
      // Convert blob to buffer for processing
      const arrayBuffer = await videoBlob.arrayBuffer()
      videoBuffer = Buffer.from(arrayBuffer)
      const fileSizeMB = videoBuffer.length / (1024 * 1024)
      console.log(`📹 Video fetched: ${videoBuffer.length} bytes (${fileSizeMB.toFixed(2)} MB)`)
      
      // Check file size limit for OpenAI Whisper (25MB)
      const WHISPER_MAX_SIZE_MB = 25
      if (fileSizeMB > WHISPER_MAX_SIZE_MB) {
        console.warn(`⚠️ Video is ${fileSizeMB.toFixed(2)} MB, exceeds Whisper limit of ${WHISPER_MAX_SIZE_MB} MB`)
        // Still try to extract visual content even if audio fails
      }
    } catch (fetchError: any) {
      console.error("❌ Error fetching video:", fetchError.message)
      throw new Error(`Failed to fetch video: ${fetchError.message}`)
    }

    // Step 1: Extract audio transcript using OpenAI Whisper (KEY POINT: Track the audio)
    console.log("🎤 Step 1: Extracting audio transcript (tracking spoken content)...")
    let audioTranscript = ""
    
    const fileSizeMB = videoBuffer.length / (1024 * 1024)
    const WHISPER_MAX_SIZE_MB = 25
    // Use 24MB to be safely under the 25MB limit (accounting for any overhead and metadata)
    // The actual limit is 26,214,400 bytes (25MB), so 24MB gives us a safe buffer
    const SAFE_MAX_SIZE_BYTES = Math.floor(24 * 1024 * 1024) // 24MB in bytes
    
    if (fileSizeMB > WHISPER_MAX_SIZE_MB) {
      // For videos over 25MB, we cannot extract audio directly
      // OpenAI Whisper API has a 25MB limit and byte-based slicing doesn't create valid video files
      console.warn(`⚠️ Video is ${fileSizeMB.toFixed(2)} MB, exceeds Whisper limit of ${WHISPER_MAX_SIZE_MB} MB.`)
      console.warn(`⚠️ Cannot extract audio from large video - will try visual content extraction instead.`)
      console.warn(`💡 Note: For large videos, we'll extract visual content (text from frames) instead of audio.`)
      
      // Skip audio extraction for large videos - it will fail
      // We'll rely on visual content extraction (frames) instead
      audioTranscript = ""
    } else {
      // Video is within limit - extract normally
      try {
        const videoFile = new File([videoBlob], "video.mp4", { type: "video/mp4" })
        const formData = new FormData()
        formData.append("file", videoFile)
        formData.append("model", "whisper-1")
        formData.append("language", "en")
        formData.append("response_format", "text")

        console.log("📤 Sending video to OpenAI Whisper API...")
        const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: formData,
        })

        if (whisperResponse.ok) {
          audioTranscript = await whisperResponse.text()
          if (audioTranscript && audioTranscript.trim().length > 0) {
            console.log(`✅ Audio transcript extracted: ${audioTranscript.length} characters`)
            console.log(`📝 Transcript preview: ${audioTranscript.substring(0, 200)}...`)
          } else {
            console.warn("⚠️ Audio transcript is empty - video may be silent or have no audio track")
          }
        } else {
          const errorText = await whisperResponse.text()
          console.error(`❌ OpenAI Whisper API error (${whisperResponse.status}):`, errorText.substring(0, 500))
          // Don't throw - continue to try visual extraction
        }
      } catch (whisperError: any) {
        console.error("❌ Audio transcription failed:", whisperError.message)
        // Don't throw - continue to try visual extraction
      }
    }

    // Step 2: Extract visual content from frames (KEY POINT: Get data from visual aids)
    // For large videos, visual extraction is especially important since audio extraction failed
    console.log("🖼️ Step 2: Extracting visual content from frames (slides, text, visual aids)...")
    let visualContent = ""
    
    try {
      visualContent = await extractVisualContentFromVideo(videoUrl, videoBuffer, openaiApiKey, pdfCoApiKey)
      if (visualContent && visualContent.trim().length > 0) {
        console.log(`✅ Visual content extracted: ${visualContent.length} characters`)
        console.log(`📝 Visual content preview: ${visualContent.substring(0, 300)}...`)
      } else {
        console.warn("⚠️ No visual content extracted from frames")
      }
    } catch (visualError: any) {
      console.warn("⚠️ Visual content extraction failed:", visualError.message)
    }

    // Step 3: Combine audio transcript + visual content
    let combinedContent = ""
    const isPartialTranscript = fileSizeMB > WHISPER_MAX_SIZE_MB && audioTranscript && audioTranscript.trim().length > 0
    const segmentCount = audioTranscript.includes("[BEGINNING SEGMENT]") || audioTranscript.includes("[MIDDLE SEGMENT]") || audioTranscript.includes("[END SEGMENT]") 
      ? (audioTranscript.match(/\[.*? SEGMENT\]/g) || []).length 
      : 0
    const partialNote = isPartialTranscript 
      ? `\n\n⚠️ NOTE: This is a PARTIAL transcript extracted from ${segmentCount > 0 ? `${segmentCount} segments (beginning, middle, end)` : `the first ${WHISPER_MAX_SIZE_MB}MB`} of the video (video is ${fileSizeMB.toFixed(2)}MB). The full video content may not be represented. For complete transcription, compress video to <25MB.`
      : ""
    
    if (audioTranscript && audioTranscript.trim().length > 0 && visualContent && visualContent.trim().length > 0) {
      combinedContent = `AUDIO TRANSCRIPT (Spoken Content):\n${audioTranscript}${partialNote}\n\nVISUAL CONTENT (Slides, Text, Visual Aids from Frames):\n${visualContent}`
      console.log(`✅ Combined content: ${combinedContent.length} characters (Audio: ${audioTranscript.length}, Visual: ${visualContent.length})`)
    } else if (audioTranscript && audioTranscript.trim().length > 0) {
      combinedContent = `AUDIO TRANSCRIPT (Spoken Content):\n${audioTranscript}${partialNote}`
      console.log(`✅ Using audio transcript only: ${audioTranscript.length} characters${isPartialTranscript ? ` (PARTIAL - ${segmentCount > 0 ? `${segmentCount} segments` : 'first 25MB only'})` : ''}`)
    } else if (visualContent && visualContent.trim().length > 0) {
      combinedContent = `VISUAL CONTENT (Slides, Text, Visual Aids from Frames):\n${visualContent}`
      console.log(`✅ Using visual content only: ${visualContent.length} characters`)
    } else {
      // No content extracted - provide detailed error message
      const fileSizeMB = videoBuffer.length / (1024 * 1024)
      
      let errorMsg = ""
      if (fileSizeMB > WHISPER_MAX_SIZE_MB) {
        errorMsg = `Unable to extract content from large video (${fileSizeMB.toFixed(2)}MB). ` +
          `OpenAI Whisper API has a 25MB file size limit. ` +
          `\n\nSolutions:` +
          `\n1. Compress video to <25MB using video compression tools (HandBrake, FFmpeg, or online compressors)` +
          `\n2. Split long videos into smaller modules (<25MB each)` +
          `\n3. Extract audio track separately and upload as audio file` +
          `\n4. Use a video processing service to extract and compress audio` +
          `\n5. Create quiz questions manually for this module`
      } else {
        errorMsg = `No content extracted from video. ` +
          `Video file: ${fileSizeMB.toFixed(2)} MB. ` +
          `Possible reasons: ` +
          `1. Video has no audio track (silent video), ` +
          `2. Visual content extraction failed, ` +
          `3. Video file is corrupted or inaccessible. ` +
          `Please ensure video has audio track or create quiz questions manually.`
      }
      
      console.error(`❌ ${errorMsg}`)
      
      // Return empty string - error will be handled by caller
      return ""
    }

    return combinedContent
  } catch (error: any) {
    console.error("❌ Error extracting video content:", error.message)
    // Return empty string instead of throwing to allow graceful handling
    return ""
  }
}

/**
 * Extract video transcript from client-side extracted frames
 * Uses OCR on frames to extract text content
 */
async function extractVideoTranscriptFromFrames(
  frames: Array<{ data: string; timestamp?: string }>,
  videoUrl: string
): Promise<string> {
  try {
    console.log(`📸 Processing ${frames.length} client-extracted frames for OCR...`)
    console.log(`📸 Frame data preview:`, frames[0]?.data?.substring(0, 50) || "No frame data")
    
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    // Process frames directly (we're in the same server, no need for HTTP call)
    const extractedText = await processFramesDirectly(frames, openaiApiKey)

    if (extractedText && extractedText.trim().length > 0) {
      // Remove the prefix if it was added by processFramesDirectly
      const cleanText = extractedText.replace(/^VISUAL CONTENT \(Slides, Text, Visual Aids from Frames\):\n?/, "")
      console.log(`✅ Extracted ${cleanText.length} characters from frames`)
      return `VISUAL CONTENT (Slides, Text, Visual Aids from Frames):\n${cleanText}`
    } else {
      console.warn("⚠️ No text extracted from frames - frames may not contain visible text")
      console.warn("⚠️ This is normal for videos showing a person talking without slides")
      return ""
    }
  } catch (error: any) {
    console.error("❌ Error processing frames:", error)
    throw error
  }
}

/**
 * Process frames directly using OpenAI Vision API
 * Extracts text from each frame using OCR
 */
async function processFramesDirectly(
  frames: Array<{ data: string; timestamp?: string }>,
  openaiApiKey: string
): Promise<string> {
  const extractedTexts: string[] = []
  
  console.log(`📸 Processing ${frames.length} frames with OpenAI Vision API...`)
  
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    const timestamp = frame.timestamp || `Frame ${i + 1}`
    
    try {
      console.log(`📸 Processing ${timestamp} (${i + 1}/${frames.length})...`)
      
      // Ensure frame data is in correct format
      let imageUrl = frame.data
      if (!imageUrl.startsWith("data:")) {
        imageUrl = `data:image/jpeg;base64,${frame.data}`
      }
      
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
              content: "You are an OCR specialist extracting text from healthcare training video frames. Extract ALL visible text from the image, including text from slides, visual aids, diagrams, labels, captions, titles, bullet points, and any written content. Extract everything you can see - don't filter for medical content yet, just extract all text. Preserve structure and important details. If there's no visible text, return an empty string.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract ALL visible text content from this video frame. Include text from slides, visual aids, diagrams, labels, captions, titles, bullet points, headings, and any written content you can see. Extract everything - don't filter or skip any text. Return the complete text content exactly as it appears."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      })

      if (visionResponse.ok) {
        const visionData = await visionResponse.json()
        const frameText = visionData.choices?.[0]?.message?.content || ""
        
        // Filter out error messages but allow short valid content
        const lowerText = frameText.toLowerCase().trim()
        const isErrorResponse = lowerText.includes("i'm sorry") || 
                               lowerText.includes("i can't extract") ||
                               lowerText.includes("cannot extract") ||
                               lowerText.includes("there is no") ||
                               lowerText.includes("does not contain") ||
                               (lowerText.includes("no text") && lowerText.length < 50) || // Only filter "no text" if it's a short error message
                               (lowerText.includes("no visible text") && lowerText.length < 60)
        
        // Accept text if it's not an error message and has some content (even if short)
        if (frameText && !isErrorResponse && frameText.trim().length > 10) {
          extractedTexts.push(`[${timestamp}]:\n${frameText.trim()}`)
          console.log(`✅ Extracted ${frameText.length} characters from ${timestamp}`)
          console.log(`📝 Text preview: ${frameText.substring(0, 100)}...`)
        } else {
          console.log(`⚠️ No valid text found in ${timestamp} (filtered: ${isErrorResponse ? 'error message' : 'too short'})`)
        }
      } else {
        const errorText = await visionResponse.text()
        console.warn(`⚠️ OCR failed for ${timestamp}:`, errorText.substring(0, 200))
      }
    } catch (frameError: any) {
      console.warn(`⚠️ Error processing ${timestamp}:`, frameError.message)
      // Continue with other frames
    }
  }
  
    if (extractedTexts.length > 0) {
      const combinedText = extractedTexts.join("\n\n")
      console.log(`✅ Successfully extracted text from ${extractedTexts.length}/${frames.length} frames`)
      console.log(`📝 Combined text length: ${combinedText.length} characters`)
      console.log(`📝 Combined text preview: ${combinedText.substring(0, 200)}...`)
      
      // Validate that we have real content, not just error messages
      // Only check if the entire text is an error message, not if it contains error words
      const lowerText = combinedText.toLowerCase()
      const isOnlyError = (lowerText.includes("i'm sorry") && lowerText.length < 100) ||
                         (lowerText.includes("i can't extract") && lowerText.length < 100) ||
                         (lowerText.includes("cannot extract") && lowerText.length < 100) ||
                         (lowerText.includes("there is no") && lowerText.length < 100 && !lowerText.includes("there is no")) // Allow "there is no" in actual content
      
      if (isOnlyError) {
        console.warn("⚠️ Extracted text appears to be only error messages")
    return ""
      }
      
      // If we have any extracted text that passed filtering, use it
      return combinedText
    }
    
    console.warn("⚠️ No text extracted from any frames")
    return ""
}

/**
 * Extract visual content from video frames (frame-by-frame analysis)
 * Extracts text from slides, images, and visual aids shown in the video
 * KEY POINT: Get data from visual aids in the video
 */
async function extractVisualContentFromVideo(
  videoUrl: string,
  videoBuffer: Buffer,
  openaiApiKey: string,
  pdfCoApiKey?: string
): Promise<string> {
  try {
    console.log("🖼️ Starting frame-by-frame visual content extraction...")
    
    // For server-side frame extraction, we'll use a service-based approach
    // Since we can't use browser APIs directly, we'll:
    // 1. Try to use PDF.co if it supports video frame extraction
    // 2. Use OpenAI Vision API with extracted frames
    // 3. Extract frames at intervals and analyze them
    
    // Method 1: Try PDF.co video frame extraction (if supported)
    if (pdfCoApiKey) {
      try {
        console.log("📄 Attempting PDF.co video frame extraction...")
        // PDF.co might support extracting frames or converting video to images
        const pdfCoResponse = await fetch("https://api.pdf.co/v1/video/convert/to/images", {
          method: "POST",
          headers: {
            "x-api-key": pdfCoApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: videoUrl,
            frames: 10, // Extract 10 frames evenly spaced throughout video
            async: false,
          }),
        })

        if (pdfCoResponse.ok) {
          const pdfCoData = await pdfCoResponse.json()
          // Process extracted frames with OCR
          if (pdfCoData.frames || pdfCoData.images) {
            const frames = pdfCoData.frames || pdfCoData.images || []
            let extractedText = ""
            
            console.log(`📸 Processing ${frames.length} frames for visual content...`)
            for (let i = 0; i < frames.length; i++) {
              const frame = frames[i]
              const frameUrl = frame.url || frame
              console.log(`📸 Analyzing frame ${i + 1}/${frames.length}...`)
              
              const frameText = await extractTextFromImage(frameUrl, openaiApiKey, pdfCoApiKey)
              if (frameText && frameText.trim().length > 10) {
                extractedText += `\n[Frame ${i + 1} - Visual Content]:\n${frameText}\n`
              }
            }
            
            if (extractedText) {
              console.log(`✅ Extracted visual content from ${frames.length} frames via PDF.co`)
              return extractedText.trim()
            }
          }
        } else {
          const errorText = await pdfCoResponse.text()
          console.log(`📄 PDF.co video frame extraction not available: ${errorText.substring(0, 200)}`)
        }
      } catch (pdfCoError: any) {
        console.log("📄 PDF.co video frame extraction not available, trying alternative method...")
      }
    }

    // Method 2: For large videos, provide helpful information
    // Since we're in a serverless environment, we can't use ffmpeg directly
    // Frame extraction requires either:
    // 1. Video processing service (Cloudinary, AWS MediaConvert, etc.)
    // 2. Client-side frame extraction (browser-based canvas API)
    // 3. Server with ffmpeg installed
    
    console.log("💡 Why frame extraction is limited:")
    console.log("   - Serverless environment (Next.js/Vercel) doesn't have ffmpeg")
    console.log("   - Video processing requires specialized tools")
    console.log("   - Frame extraction needs to be done client-side or via service")
    console.log("💡 Solutions for large videos:")
    console.log("   1. Compress video to <25MB (enables audio transcription)")
    console.log("   2. Use video processing service to extract audio")
    console.log("   3. Extract frames client-side and send to server")
    console.log("   4. Create quiz questions manually")
    
    // Return empty - visual extraction not possible without video processing
    return ""
  } catch (error: any) {
    console.error("❌ Error extracting visual content:", error)
    return ""
  }
}

/**
 * Extract text from an image using OCR (OpenAI Vision or PDF.co)
 * Used to extract text from video frames (slides, visual aids, etc.)
 */
async function extractTextFromImage(
  imageUrl: string,
  openaiApiKey: string,
  pdfCoApiKey?: string
): Promise<string> {
  try {
    // Try PDF.co OCR first (if available)
    if (pdfCoApiKey) {
      try {
        const pdfCoResponse = await fetch("https://api.pdf.co/v1/pdf/convert/to/text", {
          method: "POST",
          headers: {
            "x-api-key": pdfCoApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: imageUrl,
            inline: true,
            async: false,
          }),
        })

        if (pdfCoResponse.ok) {
          const pdfCoData = await pdfCoResponse.json()
          let text = ""
          
          if (pdfCoData.body) text = typeof pdfCoData.body === "string" ? pdfCoData.body : JSON.stringify(pdfCoData.body)
          else if (pdfCoData.text) text = pdfCoData.text
          else if (pdfCoData.content) text = pdfCoData.content
          
          if (text && text.trim().length > 10) {
            return text.trim()
          }
        }
      } catch (pdfCoError) {
        // Fall through to OpenAI Vision
      }
    }

    // Fallback: Use OpenAI Vision API for OCR
    try {
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) return ""
      
      const imageBlob = await imageResponse.blob()
      const imageBuffer = await imageBlob.arrayBuffer()
      const imageBase64 = Buffer.from(imageBuffer).toString('base64')
      
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
              content: "You are an OCR specialist extracting text from healthcare training images. Extract ALL visible text from the image, including text from slides, visual aids, diagrams, labels, captions, titles, bullet points, and any written content. Extract everything you can see - don't filter for medical content yet, just extract all text. Preserve structure and important details.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract ALL visible text content from this image. Include text from slides, visual aids, diagrams, labels, captions, titles, bullet points, headings, and any written content you can see. Extract everything - don't filter or skip any text. Return the complete text content exactly as it appears."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: "high"
                  }
                }
              ]
            },
          ],
          max_tokens: 2000,
        }),
      })
      
      if (visionResponse.ok) {
        const visionData = await visionResponse.json()
        const extractedText = visionData.choices[0]?.message?.content || ""
        if (extractedText && extractedText.trim().length > 10) {
          return extractedText.trim()
        }
      }
    } catch (visionError) {
      console.warn("⚠️ OpenAI Vision OCR failed:", visionError)
    }
    
    return ""
  } catch (error: any) {
    console.error("❌ Error extracting text from image:", error)
    return ""
  }
}

/**
 * Extract text content from PowerPoint using PDF.co API
 * PDF.co can convert PowerPoint to PDF first, then extract text
 */
async function extractPowerPointContent(pptUrl: string): Promise<string> {
  try {
    console.log("📊 Extracting PowerPoint content using PDF.co...")
    
    const pdfCoApiKey = process.env.PDF_CO_API_KEY
    if (!pdfCoApiKey) {
      console.warn("⚠️ PDF.co API key not configured, cannot extract PowerPoint content")
      return ""
    }

    // Method 1: Try to convert PowerPoint to PDF first, then extract text
    try {
      console.log("📊 Converting PowerPoint to PDF using PDF.co...")
      const convertResponse = await fetch("https://api.pdf.co/v1/pdf/convert/from/office", {
      method: "POST",
      headers: {
          "x-api-key": pdfCoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
          url: pptUrl,
          async: false,
      }),
    })

      if (convertResponse.ok) {
        const convertData = await convertResponse.json()
        let pdfUrl = ""
        
        // Get the converted PDF URL
        if (convertData.url) {
          pdfUrl = convertData.url
        } else if (convertData.body && convertData.body.url) {
          pdfUrl = convertData.body.url
        } else if (convertData.result && convertData.result.url) {
          pdfUrl = convertData.result.url
        }
        
        if (pdfUrl) {
          console.log("✅ PowerPoint converted to PDF, extracting text...")
          // Now extract text from the converted PDF
          return await extractPDFContent(pdfUrl)
        }
      }
    } catch (convertError: any) {
      console.warn("⚠️ PowerPoint to PDF conversion failed:", convertError.message)
    }

    // Method 2: Try direct PowerPoint text extraction (if PDF.co supports it)
    try {
      console.log("📊 Attempting direct PowerPoint text extraction...")
      const extractResponse = await fetch("https://api.pdf.co/v1/pdf/convert/to/text", {
      method: "POST",
      headers: {
          "x-api-key": pdfCoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: pptUrl,
          inline: true,
          async: false,
        }),
      })

      if (extractResponse.ok) {
        const extractData = await extractResponse.json()
        let extractedText = ""
        
        if (extractData.body) {
          extractedText = typeof extractData.body === "string" ? extractData.body : JSON.stringify(extractData.body)
        } else if (extractData.text) {
          extractedText = extractData.text
        } else if (extractData.content) {
          extractedText = extractData.content
        } else if (extractData.result) {
          extractedText = typeof extractData.result === "string" ? extractData.result : extractData.result.text || JSON.stringify(extractData.result)
        }
        
        if (extractedText && extractedText.trim().length > 100) {
          console.log(`✅ PowerPoint content extracted via PDF.co: ${extractedText.length} characters`)
          return extractedText.trim()
        }
      }
    } catch (extractError: any) {
      console.warn("⚠️ Direct PowerPoint extraction failed:", extractError.message)
    }

    console.error("❌ All PowerPoint extraction methods failed")
    return ""
  } catch (error: any) {
    console.error("❌ Error extracting PowerPoint:", error)
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

