/**
 * PDF.co OCR Service
 * Handles document OCR processing using PDF.co API
 */

export interface OCRResult {
  success: boolean
  text: string
  error?: string
}

// Helper function to create fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 60000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs / 1000} seconds`)
    }
    throw error
  }
}

export class PDFcoService {
  private apiKey: string
  private baseUrl = "https://api.pdf.co/v1"
  // Increased timeouts for better reliability
  private uploadTimeout = 120000  // 2 minutes for upload
  private ocrTimeout = 180000     // 3 minutes for OCR
  private statusCheckTimeout = 30000  // 30 seconds for status check
  private downloadTimeout = 60000 // 1 minute for download

  constructor() {
    this.apiKey = process.env.PDFCO_API_KEY || process.env.PDF_CO_API_KEY || ""
    
    if (!this.apiKey) {
      console.warn("⚠️ PDF.co API key not found. Set PDFCO_API_KEY or PDF_CO_API_KEY in .env.local")
    }
  }

  /**
   * Upload file to PDF.co temporary storage
   */
  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const formData = new FormData()
      const blob = new Blob([fileBuffer])
      formData.append("file", blob, fileName)

      console.log(`[PDF.co] Uploading file: ${fileName} (${fileBuffer.length} bytes)`)
      
      const response = await fetchWithTimeout(
        `${this.baseUrl}/file/upload`,
        {
          method: "POST",
          headers: {
            "x-api-key": this.apiKey,
          },
          body: formData,
        },
        this.uploadTimeout
      )

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.message || "Failed to upload file to PDF.co")
      }

      console.log(`[PDF.co] ✅ File uploaded successfully`)
      return data.url
    } catch (error) {
      console.error("PDF.co upload error:", error)
      throw error
    }
  }

  /**
   * Perform OCR on an uploaded file URL (async mode for large files)
   */
  async performOCR(fileUrl: string): Promise<OCRResult> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          text: "",
          error: "PDF.co API key not configured",
        }
      }

      // Start async OCR job with timeout
      console.log("[PDF.co] Starting async OCR job...")
      const response = await fetchWithTimeout(
        `${this.baseUrl}/pdf/convert/to/text`,
        {
          method: "POST",
          headers: {
            "x-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: fileUrl,
            inline: false, // Use async mode
            async: true,   // Enable async processing
            pages: "",     // Process all pages
            name: "ocr-result.txt",
          }),
        },
        this.ocrTimeout
      )

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.message || "OCR job failed to start")
      }

      const jobId = data.jobId
      const resultUrl = data.url

      if (!jobId) {
        throw new Error("No job ID returned from PDF.co")
      }

      console.log("[PDF.co] OCR job started, jobId:", jobId)

      // Poll job status until complete (max 5 minutes for large PDFs)
      const maxAttempts = 60 // 60 attempts * 5 seconds = 300 seconds (5 minutes)
      let attempts = 0
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 3

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        attempts++

        console.log(`[PDF.co] Checking job status (attempt ${attempts}/${maxAttempts})...`)

        try {
          const statusResponse = await fetchWithTimeout(
            `${this.baseUrl}/job/check?jobid=${jobId}`,
            {
              headers: {
                "x-api-key": this.apiKey,
              },
            },
            this.statusCheckTimeout
          )

          const statusData = await statusResponse.json()
          consecutiveErrors = 0 // Reset on successful response

          if (statusData.status === "success") {
            console.log("[PDF.co] ✅ OCR job completed successfully")
            
            // Download the result with timeout
            const textResponse = await fetchWithTimeout(
              statusData.url,
              {},
              this.downloadTimeout
            )
            const text = await textResponse.text()

            console.log(`[PDF.co] ✅ Downloaded OCR result: ${text.length} characters`)
            return {
              success: true,
              text: text || "",
            }
          } else if (statusData.status === "error" || statusData.status === "aborted") {
            throw new Error(`OCR job failed: ${statusData.error || "Unknown error"}`)
          }

          // Still working, continue polling
          console.log(`[PDF.co] Job status: ${statusData.status}`)
        } catch (statusError: any) {
          consecutiveErrors++
          console.warn(`[PDF.co] ⚠️ Status check error (${consecutiveErrors}/${maxConsecutiveErrors}):`, statusError.message)
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error(`Too many consecutive status check failures: ${statusError.message}`)
          }
          // Continue polling despite error
        }
      }

      throw new Error("OCR processing timeout - job took too long")
    } catch (error) {
      console.error("[PDF.co] OCR error:", error)
      return {
        success: false,
        text: "",
        error: error instanceof Error ? error.message : "OCR failed",
      }
    }
  }

  /**
   * Process image file (PNG, JPG) with OCR
   */
  async processImage(fileBuffer: Buffer, fileName: string): Promise<OCRResult> {
    try {
      console.log(`[PDF.co] 🖼️ Processing image: ${fileName}`)
      
      // Upload file first
      const fileUrl = await this.uploadFile(fileBuffer, fileName)

      // Perform OCR
      const ocrResult = await this.performOCR(fileUrl)
      return ocrResult
    } catch (error) {
      console.error("[PDF.co] Image processing error:", error)
      return {
        success: false,
        text: "",
        error: error instanceof Error ? error.message : "Failed to process image",
      }
    }
  }

  /**
   * Process PDF file with OCR
   */
  async processPDF(fileBuffer: Buffer, fileName: string): Promise<OCRResult> {
    try {
      console.log(`[PDF.co] 📄 Processing PDF: ${fileName} (${Math.round(fileBuffer.length / 1024)} KB)`)
      
      // Upload file first
      const fileUrl = await this.uploadFile(fileBuffer, fileName)

      // Perform OCR
      const ocrResult = await this.performOCR(fileUrl)
      
      if (ocrResult.success) {
        console.log(`[PDF.co] ✅ PDF processed successfully - extracted ${ocrResult.text.length} characters`)
      }
      
      return ocrResult
    } catch (error) {
      console.error("[PDF.co] PDF processing error:", error)
      return {
        success: false,
        text: "",
        error: error instanceof Error ? error.message : "Failed to process PDF",
      }
    }
  }
}

// Export singleton instance
export const pdfcoService = new PDFcoService()

