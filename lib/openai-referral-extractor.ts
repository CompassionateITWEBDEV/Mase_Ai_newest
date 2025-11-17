/**
 * OpenAI Referral Data Extractor
 * Uses GPT to intelligently parse referral information from OCR text
 */

export interface ExtractedReferralData {
  patientName: string
  dateOfBirth?: string
  age?: number
  diagnosis: string
  insuranceProvider: string
  insuranceId: string
  phoneNumber?: string
  address?: string
  referringPhysician?: string
  servicesRequested?: string[]
  urgency?: "routine" | "urgent" | "stat"
  additionalNotes?: string
  confidence: number
}

export class OpenAIReferralExtractor {
  /**
   * Extract referral data from OCR text using GPT
   */
  async extractReferralData(ocrText: string): Promise<ExtractedReferralData | null> {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Check OPENAI_API_KEY in .env.local")
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Using mini for cost efficiency
          messages: [
            {
              role: "system",
              content: `You are a medical referral data extraction expert. Extract patient referral information from OCR text.
Always return valid JSON with these exact fields (use empty string or null if not found):
{
  "patientName": "string (REQUIRED)",
  "dateOfBirth": "string in MM/DD/YYYY format or null",
  "age": number or null,
  "diagnosis": "string (REQUIRED - primary diagnosis or medical condition)",
  "insuranceProvider": "string (REQUIRED - e.g., Medicare, Blue Cross, etc.)",
  "insuranceId": "string (REQUIRED - policy/member ID number)",
  "phoneNumber": "string or null",
  "address": "string or null",
  "referringPhysician": "string or null",
  "servicesRequested": ["array of strings like 'skilled_nursing', 'wound_care', 'physical_therapy'] or null,
  "urgency": "routine" | "urgent" | "stat" or null,
  "additionalNotes": "string or null",
  "confidence": number from 0-100 (how confident you are in the extraction)
}

IMPORTANT: 
- If patient name not found, use "Unknown Patient"
- If diagnosis not found, use "Not specified"
- If insurance provider not found, use "Not specified"
- If insurance ID not found, use "Not provided"
- Always return valid JSON, never return error messages in JSON format`,
            },
            {
              role: "user",
              content: `Extract referral information from this OCR text:\n\n${ocrText}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3, // Lower temperature for more consistent extraction
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      
      if (!content) {
        throw new Error("No response from OpenAI")
      }

      const extractedData = JSON.parse(content) as ExtractedReferralData

      // Validate required fields
      if (!extractedData.patientName) {
        extractedData.patientName = "Unknown Patient"
      }
      if (!extractedData.diagnosis) {
        extractedData.diagnosis = "Not specified"
      }
      if (!extractedData.insuranceProvider) {
        extractedData.insuranceProvider = "Not specified"
      }
      if (!extractedData.insuranceId) {
        extractedData.insuranceId = "Not provided"
      }

      console.log("✅ Successfully extracted referral data:", {
        patient: extractedData.patientName,
        insurance: extractedData.insuranceProvider,
        confidence: extractedData.confidence,
      })

      return extractedData
    } catch (error) {
      console.error("OpenAI extraction error:", error)
      throw error
    }
  }

  /**
   * Extract with fallback to basic regex parsing if OpenAI fails
   */
  async extractWithFallback(ocrText: string): Promise<ExtractedReferralData> {
    try {
      const extracted = await this.extractReferralData(ocrText)
      if (extracted) {
        return extracted
      }
    } catch (error) {
      console.error("OpenAI extraction failed, using fallback:", error)
    }

    // Fallback: Basic regex extraction
    return this.fallbackExtraction(ocrText)
  }

  /**
   * Fallback extraction using regex patterns
   */
  private fallbackExtraction(text: string): ExtractedReferralData {
    const patientNameMatch = text.match(/(?:Patient|Name):?\s*([A-Za-z\s]+(?:[A-Za-z\s]+)?)/i)
    const diagnosisMatch = text.match(/(?:Diagnosis|Condition):?\s*([A-Za-z\s,\-]+)/i)
    const insuranceMatch = text.match(/(?:Insurance|Payer):?\s*([A-Za-z\s&]+)/i)
    const policyMatch = text.match(/(?:Policy|Member|Insurance)\s*(?:Number|ID|#):?\s*([\dA-Za-z\-]+)/i)
    const phoneMatch = text.match(/(?:Phone|Tel|Contact):?\s*([\d\-\(\)\s]+)/i)
    const dobMatch = text.match(/(?:DOB|Date of Birth|Born):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)

    return {
      patientName: patientNameMatch?.[1]?.trim() || "Unknown Patient",
      dateOfBirth: dobMatch?.[1] || undefined,
      diagnosis: diagnosisMatch?.[1]?.trim() || "Not specified",
      insuranceProvider: insuranceMatch?.[1]?.trim() || "Not specified",
      insuranceId: policyMatch?.[1]?.trim() || "Not provided",
      phoneNumber: phoneMatch?.[1]?.trim() || undefined,
      confidence: 50, // Lower confidence for regex extraction
    }
  }
}

// Export singleton instance
export const openaiReferralExtractor = new OpenAIReferralExtractor()

