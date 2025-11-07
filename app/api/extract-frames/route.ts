import { NextRequest, NextResponse } from "next/server"

// Configure runtime for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Extract text from video frames using OCR
 * Accepts base64-encoded frame images and extracts text using OpenAI Vision API
 */
export async function POST(request: NextRequest) {
  try {
    const { frames, openaiApiKey } = await request.json()

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { error: "Frames array is required" },
        { status: 400 }
      )
    }

    const apiKey = openaiApiKey || process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is required" },
        { status: 400 }
      )
    }

    console.log(`📸 Processing ${frames.length} frames for OCR...`)
    
    const extractedTexts: string[] = []
    
    // Process each frame with OCR
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      const frameData = frame.data || frame // Support both {data: "base64..."} and direct base64 string
      const timestamp = frame.timestamp || `Frame ${i + 1}`
      
      try {
        console.log(`📸 Processing ${timestamp} (${i + 1}/${frames.length})...`)
        
        // Extract text using OpenAI Vision API
        const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are an OCR specialist. Extract ALL text content from images, including text from slides, visual aids, diagrams, labels, and any written content. Return only the extracted text, preserving structure and important details. If there's no text, return an empty string.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract all text content from this video frame. Include text from slides, visual aids, diagrams, labels, and any written content. Return the complete text content."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: frameData.startsWith("data:") ? frameData : `data:image/jpeg;base64,${frameData}`,
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
          
          if (frameText && frameText.trim().length > 10) {
            extractedTexts.push(`[${timestamp}]:\n${frameText.trim()}`)
            console.log(`✅ Extracted ${frameText.length} characters from ${timestamp}`)
          } else {
            console.log(`⚠️ No text found in ${timestamp}`)
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
      console.log(`✅ Extracted text from ${extractedTexts.length}/${frames.length} frames`)
      return NextResponse.json({
        text: combinedText,
        framesProcessed: extractedTexts.length,
        totalFrames: frames.length,
      })
    } else {
      return NextResponse.json({
        text: "",
        framesProcessed: 0,
        totalFrames: frames.length,
        message: "No text extracted from frames",
      })
    }
  } catch (error: any) {
    console.error("❌ Error processing frames:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to process frames",
        text: "",
      },
      { status: 500 }
    )
  }
}

