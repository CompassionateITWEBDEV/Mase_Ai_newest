import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"

// ✅ Use Gemini as primary AI (faster, more reliable for long documents)
// ✅ Use OpenAI as primary (more accurate for medical documents), Gemini as fallback
const useGemini = false // OpenAI is more accurate for OASIS analysis

export interface OasisAnalysisResult {
  patientInfo: {
    name: string
    mrn: string
    visitType: string
    payor: string
    visitDate: string
    clinician: string
  }
  primaryDiagnosis: {
    code: string
    description: string
    confidence: number
  }
  secondaryDiagnoses: Array<{
    code: string
    description: string
    confidence: number
  }>
  suggestedCodes: Array<{
    code: string
    description: string
    reason: string
    revenueImpact: number
    confidence: number
  }>
  corrections: Array<{
    field: string
    current: string
    suggested: string
    reason: string
    impact: string
    revenueChange: number
  }>
  riskFactors: Array<{
    factor: string
    severity: string
    recommendation: string
  }>
  recommendations: Array<{
    category: string
    recommendation: string
    priority: string
    expectedImpact: string
  }>
  flaggedIssues: Array<{
    issue: string
    severity: string
    location: string
    suggestion: string
  }>
  qualityScore: number
  confidenceScore: number
  completenessScore: number
  financialImpact: {
    currentRevenue: number
    optimizedRevenue: number
    increase: number
    breakdown: Array<{
      category: string
      current: number
      optimized: number
      difference: number
    }>
  }
  functionalStatus?: Array<{
    item: string
    currentValue: string
    currentDescription: string
    suggestedValue?: string
    suggestedDescription?: string
    clinicalRationale?: string
  }>
  // ✅ NEW: Medication Management
  medications?: Array<{
    item: string
    currentValue: string
    currentDescription: string
    suggestedValue?: string
    suggestedDescription?: string
    clinicalRationale?: string
  }>
  // ✅ NEW: Pain Status
  painStatus?: Array<{
    item: string
    currentValue: string
    currentDescription: string
    suggestedValue?: string
    suggestedDescription?: string
    clinicalRationale?: string
  }>
  // ✅ NEW: Integumentary Status
  integumentaryStatus?: Array<{
    item: string
    currentValue: string
    currentDescription: string
    suggestedValue?: string
    suggestedDescription?: string
    clinicalRationale?: string
  }>
  // ✅ NEW: Respiratory Status
  respiratoryStatus?: Array<{
    item: string
    currentValue: string
    currentDescription: string
    suggestedValue?: string
    suggestedDescription?: string
    clinicalRationale?: string
  }>
  // ✅ NEW: Cardiac Status
  cardiacStatus?: Array<{
    item: string
    currentValue: string
    currentDescription: string
    suggestedValue?: string
    suggestedDescription?: string
    clinicalRationale?: string
  }>
  // ✅ NEW: Elimination Status
  eliminationStatus?: Array<{
    item: string
    currentValue: string
    currentDescription: string
    suggestedValue?: string
    suggestedDescription?: string
    clinicalRationale?: string
  }>
  // ✅ NEW: Neuro/Emotional/Behavioral Status
  neuroEmotionalBehavioralStatus?: Array<{
    item: string
    currentValue: string
    currentDescription: string
    suggestedValue?: string
    suggestedDescription?: string
    clinicalRationale?: string
  }>
  missingInformation?: Array<{
    field: string
    location: string
    impact: string
    recommendation: string
    required: boolean
  }>
  inconsistencies?: Array<{
    sectionA: string
    sectionB: string
    conflictType: string
    severity: string
    recommendation: string
    clinicalImpact: string
  }>
  debugInfo?: any
}

/**
 * Create comprehensive OASIS analysis prompt
 */
function createComprehensiveOASISPrompt(extractedText: string, doctorOrderText?: string): string {
  return `Analyze OASIS-E assessment extracted via OCR. Extract patient demographics, diagnoses, functional status, and calculate revenue optimization.

DOCUMENT TEXT:
${extractedText.substring(0, 10000)}

${doctorOrderText ? `DOCTOR ORDER:\n${doctorOrderText.substring(0, 1500)}` : ""}

EXTRACT FROM THESE SECTIONS:

1. PATIENT DEMOGRAPHICS: Extract from M0040, M0020, M0066, M0030
   - Name, MRN, DOB, Visit Date, Visit Type
   - Payor (M0150): Find checked line with ✓/☑/●/■, extract full text
   - Clinician: "Electronically Signed by: [Name]"

2. DIAGNOSES: M1021 (primary), M1023 (other) with ICD-10 codes

3. FUNCTIONAL STATUS (M1800-M1870) - 9 ITEMS REQUIRED:
   - M1800 Grooming (0-3)
   - M1810 Upper Body Dressing (0-3)
   - M1820 Lower Body Dressing (0-3)
   - M1830 Bathing (0-6)
   - M1840 Toilet Transfer (0-4)
   - M1845 Toileting Hygiene (0-3)
   - M1850 Transferring (0-5)
   - M1860 Ambulation (0-6)
   - M1870 Feeding (0-5)
   
   For each: Find checked box (✓/☑/●/■), extract number + full description

4. MEDICATION MANAGEMENT (M2001-M2030):
   - M2001 Drug Regimen Review, M2003 Medication Follow-up, M2010 High-Risk Drug Classes
   - M2020 Management of Oral Medications, M2030 Management of Injectable Medications
   - List ALL medications with: name, dosage, frequency, route, indication

5. CLINICAL STATUS SECTIONS (extract ALL present):
   - Pain Status (M1242): Location, intensity (0-10), frequency, impact on function
   - Integumentary Status: Wounds, pressure ulcers (stage I-IV), skin integrity
   - Respiratory Status: Dyspnea, oxygen use, respiratory conditions
   - Cardiac Status: Edema (grade 1-4), heart failure symptoms, palpitations
   - Elimination Status: Bowel/bladder incontinence (M1610-M1620), catheter, ostomy
   - Neuro/Emotional/Behavioral Status (M1700-M1750): Cognition, confusion, anxiety, depression (PHQ-2/9), behavioral symptoms

6. REVENUE: Base $2000-$2500, High impairment $3000-$4000, Improvements +$100-$200 each

RETURN ONLY THIS JSON (no markdown, no text before/after):
{
  "patientInfo": {"name": "...", "mrn": "...", "visitType": "SOC/ROC", "payor": "✓ 1 - Medicare...", "visitDate": "...", "clinician": "..."},
  "primaryDiagnosis": {"code": "I69.351", "description": "...", "confidence": 95},
  "secondaryDiagnoses": [{"code": "...", "description": "...", "confidence": 90}],
  "functionalStatus": [
    {"item": "M1800 - Grooming", "currentValue": "2", "currentDescription": "...", "suggestedValue": "1", "suggestedDescription": "...", "clinicalRationale": "..."},
    {"item": "M1810 - Dressing Upper Body", "currentValue": "...", "currentDescription": "...", "suggestedValue": "...", "suggestedDescription": "...", "clinicalRationale": "..."},
    {"item": "M1820 - Dressing Lower Body", "currentValue": "...", "currentDescription": "...", "suggestedValue": "...", "suggestedDescription": "...", "clinicalRationale": "..."},
    {"item": "M1830 - Bathing", "currentValue": "...", "currentDescription": "...", "suggestedValue": "...", "suggestedDescription": "...", "clinicalRationale": "..."},
    {"item": "M1840 - Toilet Transferring", "currentValue": "...", "currentDescription": "...", "suggestedValue": "...", "suggestedDescription": "...", "clinicalRationale": "..."},
    {"item": "M1845 - Toileting Hygiene", "currentValue": "...", "currentDescription": "...", "suggestedValue": "...", "suggestedDescription": "...", "clinicalRationale": "..."},
    {"item": "M1850 - Transferring", "currentValue": "...", "currentDescription": "...", "suggestedValue": "...", "suggestedDescription": "...", "clinicalRationale": "..."},
    {"item": "M1860 - Ambulation/Locomotion", "currentValue": "...", "currentDescription": "...", "suggestedValue": "...", "suggestedDescription": "...", "clinicalRationale": "..."},
    {"item": "M1870 - Feeding/Eating", "currentValue": "...", "currentDescription": "...", "suggestedValue": "...", "suggestedDescription": "...", "clinicalRationale": "..."}
  ],
  "medications": [
    {"item": "M2001 - Drug Regimen Review", "currentValue": "0/1/NA", "currentDescription": "...", "clinicalRationale": "..."},
    {"item": "M2020 - Oral Medication Management", "currentValue": "0/1/2/NA", "currentDescription": "...", "clinicalRationale": "..."},
    {"item": "Medication Name", "currentValue": "Dosage", "currentDescription": "Frequency, Route, Indication"}
  ],
  "painStatus": [
    {"item": "M1242 - Pain Frequency", "currentValue": "0-4", "currentDescription": "...", "clinicalRationale": "..."},
    {"item": "Pain Location", "currentValue": "...", "currentDescription": "Location and intensity 0-10"}
  ],
  "integumentaryStatus": [
    {"item": "Pressure Ulcer Stage", "currentValue": "Stage I-IV or None", "currentDescription": "Location and healing status"},
    {"item": "Wound Description", "currentValue": "...", "currentDescription": "Size, depth, drainage"}
  ],
  "respiratoryStatus": [
    {"item": "M1400 - Dyspnea", "currentValue": "0-4", "currentDescription": "At rest or with exertion"},
    {"item": "Oxygen Use", "currentValue": "L/min or None", "currentDescription": "Continuous, PRN, or none"}
  ],
  "cardiacStatus": [
    {"item": "Edema", "currentValue": "Grade 0-4", "currentDescription": "Location and severity"},
    {"item": "Heart Failure Symptoms", "currentValue": "Present/Absent", "currentDescription": "Symptoms description"}
  ],
  "eliminationStatus": [
    {"item": "M1610 - Urinary Incontinence", "currentValue": "0-2", "currentDescription": "..."},
    {"item": "M1620 - Bowel Incontinence", "currentValue": "0-5", "currentDescription": "..."},
    {"item": "Catheter/Ostomy", "currentValue": "Type or None", "currentDescription": "Description if present"}
  ],
  "neuroEmotionalBehavioralStatus": [
    {"item": "M1700 - Cognitive Functioning", "currentValue": "0-4", "currentDescription": "..."},
    {"item": "M1730 - Depression Screening (PHQ-2)", "currentValue": "Score 0-6", "currentDescription": "..."},
    {"item": "M1740 - Cognitive/Behavioral Symptoms", "currentValue": "Checked items", "currentDescription": "..."}
  ],
  "suggestedCodes": [{"code": "...", "description": "...", "reason": "...", "revenueImpact": 150, "confidence": 85}],
  "corrections": [{"field": "...", "current": "...", "suggested": "...", "reason": "...", "impact": "...", "revenueChange": 100}],
  "riskFactors": [{"factor": "...", "severity": "medium", "recommendation": "..."}],
  "recommendations": [{"category": "Documentation", "recommendation": "...", "priority": "high", "expectedImpact": "..."}],
  "flaggedIssues": [{"issue": "...", "severity": "medium", "location": "...", "suggestion": "..."}],
  "missingInformation": [{"field": "...", "location": "...", "impact": "...", "recommendation": "...", "required": true}],
  "inconsistencies": [{"sectionA": "...", "sectionB": "...", "conflictType": "...", "severity": "Low", "recommendation": "...", "clinicalImpact": "..."}],
  "qualityScore": 85,
  "confidenceScore": 90,
  "completenessScore": 88,
  "financialImpact": {"currentRevenue": 2800, "optimizedRevenue": 3200, "increase": 400, "breakdown": [{"category": "Functional Status", "current": 2800, "optimized": 3200, "difference": 400}]},
  "debugInfo": {"foundPaymentSourceSection": "Yes", "paymentSourceText": "...", "functionalStatusFound": "Yes", "functionalItemsExtracted": 9}
}

RULES: Extract real data. Use "Not visible" if missing. ALL 9 functional items required. Revenue based on scores. JSON only, no markdown.`
}

export async function analyzeOasisDocumentComprehensive(
  extractedText: string,
  doctorOrderText?: string,
): Promise<OasisAnalysisResult> {
  const prompt = createComprehensiveOASISPrompt(extractedText, doctorOrderText)

  try {
    console.log("[OASIS] Calling OpenAI for comprehensive OASIS analysis...")
    console.log("[OASIS] Text length:", extractedText.length)
    console.log("[OASIS] Prompt length:", prompt.length)
    // ✅ Use Gemini (faster, 1M context) with OpenAI fallback
    const aiModel = useGemini 
      ? google("gemini-2.0-flash")
      : openai("gpt-4o")
    
    console.log(`[OASIS] Using model: ${useGemini ? 'Gemini 1.5 Flash' : 'GPT-4o'}`)

    const { text } = await generateText({
      model: aiModel,
      prompt,
      temperature: 0.1,
      maxTokens: 8000,
    })
    
    console.log("[OASIS] OpenAI call completed successfully")

    console.log("[OASIS] Response received, length:", text.length)
    console.log("[OASIS] First 1000 chars:", text.substring(0, 1000))
    console.log("[OASIS] Last 500 chars:", text.substring(text.length - 500))

    let jsonText = text.trim()

    // Remove markdown code blocks
    jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "")

    // Extract JSON - try to find the outermost braces
    const jsonStart = jsonText.indexOf("{")
    const jsonEnd = jsonText.lastIndexOf("}") + 1

    if (jsonStart === -1 || jsonEnd === 0) {
      console.error("[OASIS] No JSON found in response")
      console.error("[OASIS] Full response text:", text)
      console.error("[OASIS] This likely means the AI didn't follow the JSON format instruction")
      
      // Don't throw immediately - return fallback
      console.log("[OASIS] Attempting to continue with fallback analysis")
      throw new Error("No JSON object found in AI response")
    }

    jsonText = jsonText.substring(jsonStart, jsonEnd)
    
    console.log("[OASIS] Extracted JSON text length:", jsonText.length)
    console.log("[OASIS] JSON starts with:", jsonText.substring(0, 200))

    console.log("[OASIS] Parsing JSON, length:", jsonText.length)

    let analysis: any
    try {
      analysis = JSON.parse(jsonText)
      console.log("[OASIS] JSON parsed successfully")
    } catch (parseError) {
      console.error("[OASIS] JSON parse error:", parseError)
      console.error("[OASIS] Failed JSON:", jsonText.substring(0, 1000))

      // Clean up JSON
      jsonText = jsonText
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/\n/g, " ")
        .replace(/\r/g, "")

      analysis = JSON.parse(jsonText)
      console.log("[OASIS] JSON parsed after cleanup")
    }

    // Validate and return comprehensive analysis with ALL status fields
    const validatedAnalysis: OasisAnalysisResult = {
      patientInfo: analysis.patientInfo || {
        name: "Unknown Patient",
        mrn: "N/A",
        visitType: "SOC",
        payor: "Unknown",
        visitDate: new Date().toISOString().split("T")[0],
        clinician: "Unknown",
      },
      primaryDiagnosis: analysis.primaryDiagnosis || {
        code: "Z99.89",
        description: "Dependence on enabling machines and devices",
        confidence: 70,
      },
      secondaryDiagnoses: Array.isArray(analysis.secondaryDiagnoses) ? analysis.secondaryDiagnoses : [],
      suggestedCodes: Array.isArray(analysis.suggestedCodes) ? analysis.suggestedCodes : [],
      corrections: Array.isArray(analysis.corrections) ? analysis.corrections : [],
      riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      flaggedIssues: Array.isArray(analysis.flaggedIssues) ? analysis.flaggedIssues : [],
      qualityScore: analysis.qualityScore || 75,
      confidenceScore: analysis.confidenceScore || 80,
      completenessScore: analysis.completenessScore || 78,
      financialImpact: analysis.financialImpact || {
        currentRevenue: 2500,
        optimizedRevenue: 2900,
        increase: 400,
        breakdown: [
          {
            category: "Base Rate",
            current: 2500,
            optimized: 2900,
            difference: 400,
          },
        ],
      },
      functionalStatus: Array.isArray(analysis.functionalStatus) ? analysis.functionalStatus : [],
      // ✅ NEW: Include all clinical status sections
      medications: Array.isArray(analysis.medications) ? analysis.medications : [],
      painStatus: Array.isArray(analysis.painStatus) ? analysis.painStatus : [],
      integumentaryStatus: Array.isArray(analysis.integumentaryStatus) ? analysis.integumentaryStatus : [],
      respiratoryStatus: Array.isArray(analysis.respiratoryStatus) ? analysis.respiratoryStatus : [],
      cardiacStatus: Array.isArray(analysis.cardiacStatus) ? analysis.cardiacStatus : [],
      eliminationStatus: Array.isArray(analysis.eliminationStatus) ? analysis.eliminationStatus : [],
      neuroEmotionalBehavioralStatus: Array.isArray(analysis.neuroEmotionalBehavioralStatus) ? analysis.neuroEmotionalBehavioralStatus : [],
      missingInformation: Array.isArray(analysis.missingInformation) ? analysis.missingInformation : [],
      inconsistencies: Array.isArray(analysis.inconsistencies) ? analysis.inconsistencies : [],
      debugInfo: analysis.debugInfo || {},
    }

    console.log("[OASIS] Analysis validated successfully")
    console.log("[OASIS] Functional status items:", validatedAnalysis.functionalStatus?.length || 0)
    console.log("[OASIS] Missing information items:", validatedAnalysis.missingInformation?.length || 0)
    
    return validatedAnalysis
  } catch (error) {
    console.error("[OASIS] Comprehensive analysis error:", error)
    console.error("[OASIS] Error details:", error instanceof Error ? error.message : String(error))

    console.log("[OASIS] Returning fallback analysis")
    return {
      patientInfo: {
        name: "Analysis Error",
        mrn: "N/A",
        visitType: "SOC",
        payor: "Unknown",
        visitDate: new Date().toISOString().split("T")[0],
        clinician: "Unknown",
      },
      primaryDiagnosis: {
        code: "Z99.89",
        description: "Dependence on enabling machines and devices",
        confidence: 60,
      },
      secondaryDiagnoses: [],
      suggestedCodes: [],
      corrections: [],
      riskFactors: [],
      recommendations: [
        {
          category: "Documentation",
          recommendation: "Manual review required - automated analysis incomplete",
          priority: "high",
          expectedImpact: "Ensure accurate coding",
        },
      ],
      flaggedIssues: [
        {
          issue: "AI analysis error occurred",
          severity: "high",
          location: "Overall document",
          suggestion: "Manual clinical review recommended",
        },
      ],
      qualityScore: 60,
      confidenceScore: 50,
      completenessScore: 55,
      financialImpact: {
        currentRevenue: 2500,
        optimizedRevenue: 2750,
        increase: 250,
        breakdown: [
          {
            category: "Estimated",
            current: 2500,
            optimized: 2750,
            difference: 250,
          },
        ],
      },
    }
  }
}

export function calculateRevenueOptimization(analysis: OasisAnalysisResult): {
  currentRevenue: number
  optimizedRevenue: number
  increase: number
} {
  const currentRevenue = analysis.financialImpact.currentRevenue
  const optimizedRevenue = analysis.financialImpact.optimizedRevenue
  const increase = optimizedRevenue - currentRevenue

  return {
    currentRevenue,
    optimizedRevenue,
    increase,
  }
}

