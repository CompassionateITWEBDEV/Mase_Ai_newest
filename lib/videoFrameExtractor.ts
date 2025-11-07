/**
 * Client-side video frame extraction utility
 * Extracts frames from video element using canvas API
 * Works in browser environment (no server-side dependencies)
 */

export interface ExtractedFrame {
  data: string // base64 encoded image
  timestamp: number // time in seconds
  timestampFormatted: string // formatted as "MM:SS"
}

/**
 * Extract frames from video element at specified intervals
 * @param videoElement - HTML video element
 * @param frameCount - Number of frames to extract (default: 10)
 * @returns Array of base64-encoded frame images with timestamps
 */
export async function extractVideoFrames(
  videoElement: HTMLVideoElement,
  frameCount: number = 10
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    try {
      // Ensure video is loaded
      if (videoElement.readyState < 2) {
        // HAVE_CURRENT_DATA
        videoElement.addEventListener("loadeddata", () => {
          extractFrames(videoElement, frameCount)
            .then(resolve)
            .catch(reject)
        })
        return
      }

      extractFrames(videoElement, frameCount)
        .then(resolve)
        .catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

async function extractFrames(
  videoElement: HTMLVideoElement,
  frameCount: number
): Promise<ExtractedFrame[]> {
  const duration = videoElement.duration
  if (!duration || duration === 0) {
    throw new Error("Video duration is not available")
  }

  const frames: ExtractedFrame[] = []
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  // Set canvas size to match video dimensions
  canvas.width = videoElement.videoWidth || 1920
  canvas.height = videoElement.videoHeight || 1080

  // Store original current time
  const originalTime = videoElement.currentTime

  // Calculate frame intervals (evenly spaced throughout video)
  const interval = duration / (frameCount + 1) // +1 to avoid last frame

  console.log(`📸 Extracting ${frameCount} frames from video (duration: ${duration.toFixed(2)}s)...`)

  // Extract frames at intervals
  for (let i = 1; i <= frameCount; i++) {
    const timestamp = interval * i
    const timestampFormatted = formatTimestamp(timestamp)

    try {
      // Seek to timestamp
      videoElement.currentTime = timestamp

      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          videoElement.removeEventListener("seeked", onSeeked)
          resolve()
        }
        videoElement.addEventListener("seeked", onSeeked)

        // Timeout fallback
        setTimeout(() => {
          videoElement.removeEventListener("seeked", onSeeked)
          resolve()
        }, 1000)
      })

      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

      // Convert canvas to base64
      const base64Data = canvas.toDataURL("image/jpeg", 0.8)

      frames.push({
        data: base64Data,
        timestamp: timestamp,
        timestampFormatted: timestampFormatted,
      })

      console.log(`✅ Extracted frame ${i}/${frameCount} at ${timestampFormatted}`)
    } catch (error) {
      console.warn(`⚠️ Failed to extract frame at ${timestampFormatted}:`, error)
      // Continue with other frames
    }
  }

  // Restore original time
  videoElement.currentTime = originalTime

  console.log(`✅ Successfully extracted ${frames.length} frames`)
  return frames
}

/**
 * Format timestamp as MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Extract frames and send to server for OCR processing
 * @param videoElement - HTML video element
 * @param frameCount - Number of frames to extract
 * @param openaiApiKey - OpenAI API key (optional, uses env if not provided)
 * @returns Extracted text from frames
 */
export async function extractAndProcessFrames(
  videoElement: HTMLVideoElement,
  frameCount: number = 10,
  openaiApiKey?: string
): Promise<string> {
  try {
    console.log("📸 Starting client-side frame extraction...")

    // Extract frames
    const frames = await extractVideoFrames(videoElement, frameCount)

    if (frames.length === 0) {
      throw new Error("No frames extracted from video")
    }

    console.log(`📤 Sending ${frames.length} frames to server for OCR...`)

    // Send frames to server for OCR
    const response = await fetch("/api/extract-frames", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        frames: frames.map((f) => ({
          data: f.data,
          timestamp: f.timestampFormatted,
        })),
        openaiApiKey, // Optional, server will use env if not provided
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Frame processing failed: ${response.status}`)
    }

    const data = await response.json()
    const extractedText = data.text || ""

    if (extractedText && extractedText.trim().length > 0) {
      console.log(`✅ Extracted ${extractedText.length} characters from ${data.framesProcessed} frames`)
      return extractedText
    } else {
      console.warn("⚠️ No text extracted from frames")
      return ""
    }
  } catch (error: any) {
    console.error("❌ Error extracting and processing frames:", error)
    throw error
  }
}

