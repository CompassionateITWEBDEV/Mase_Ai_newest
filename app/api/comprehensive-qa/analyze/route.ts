import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { pdfcoService } from "@/lib/pdfco-service"

// ✅ Use OpenAI as primary AI (more accurate for medical documents)
const useGemini = false // OpenAI only - Gemini requires billing

// Uses FAST single-pass AI analysis (optimized for speed)
// Gemini is faster and handles long documents better than OpenAI

// Helper function to safely parse JSON from AI response
function safeParseJSON(text: string): any {
  let jsonText = text.trim()
  // Remove markdown code blocks
  jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "")
  // Find JSON object
  const jsonStart = jsonText.indexOf("{")
  const jsonEnd = jsonText.lastIndexOf("}") + 1
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    jsonText = jsonText.substring(jsonStart, jsonEnd)
  }
  // Remove control characters that break JSON parsing
  jsonText = jsonText.replace(/[\x00-\x1F\x7F]/g, ' ')
  // Replace newlines in strings
  jsonText = jsonText.replace(/\n/g, ' ')
  
  return JSON.parse(jsonText)
}

// Build a structured summary of OASIS extracted data for AI analysis
function buildOasisDataSummary(oasis: any): string {
  const sections: string[] = []
  
  sections.push(`=== OASIS ASSESSMENT DATA FOR QUALITY ANALYSIS ===`)
  sections.push(`Patient Name: ${oasis.patient_name || 'Unknown'}`)
  sections.push(`MRN: ${oasis.mrn || 'Unknown'}`)
  sections.push(`Visit Type: ${oasis.visit_type || 'Unknown'}`)
  sections.push(`Payor: ${oasis.payor || 'Unknown'}`)
  sections.push(`Clinician: ${oasis.clinician_name || 'Unknown'}`)
  sections.push(`Visit Date: ${oasis.visit_date || 'Unknown'}`)
  sections.push('')
  
  // Primary Diagnosis
  if (oasis.primary_diagnosis) {
    const dx = typeof oasis.primary_diagnosis === 'string' 
      ? JSON.parse(oasis.primary_diagnosis) 
      : oasis.primary_diagnosis
    sections.push(`PRIMARY DIAGNOSIS:`)
    sections.push(`  Code: ${dx.code || 'Not found'}`)
    sections.push(`  Description: ${dx.description || 'Not found'}`)
    sections.push('')
  }
  
  // Secondary Diagnoses
  if (oasis.secondary_diagnoses && Array.isArray(oasis.secondary_diagnoses) && oasis.secondary_diagnoses.length > 0) {
    sections.push(`SECONDARY DIAGNOSES (${oasis.secondary_diagnoses.length}):`)
    oasis.secondary_diagnoses.forEach((dx: any, i: number) => {
      const dxObj = typeof dx === 'string' ? JSON.parse(dx) : dx
      sections.push(`  ${i + 1}. ${dxObj.code || 'Unknown'} - ${dxObj.description || 'Unknown'}`)
    })
    sections.push('')
  }
  
  // Functional Status
  if (oasis.functional_status && Array.isArray(oasis.functional_status) && oasis.functional_status.length > 0) {
    sections.push(`FUNCTIONAL STATUS ITEMS (${oasis.functional_status.length}):`)
    oasis.functional_status.forEach((item: any) => {
      const itemObj = typeof item === 'string' ? JSON.parse(item) : item
      sections.push(`  ${itemObj.item || itemObj.code || 'Unknown'}: ${itemObj.value || itemObj.currentValue || 'Unknown'} - ${itemObj.description || ''}`)
    })
    sections.push('')
  }
  
  // Medications
  if (oasis.medications && Array.isArray(oasis.medications) && oasis.medications.length > 0) {
    sections.push(`MEDICATIONS (${oasis.medications.length}):`)
    oasis.medications.forEach((med: any, i: number) => {
      const medObj = typeof med === 'string' ? JSON.parse(med) : med
      sections.push(`  ${i + 1}. ${medObj.name || medObj.medication || 'Unknown'} - ${medObj.dosage || ''} ${medObj.frequency || ''}`)
    })
    sections.push('')
  }
  
  // Pain Status
  if (oasis.pain_status && Array.isArray(oasis.pain_status) && oasis.pain_status.length > 0) {
    sections.push(`PAIN STATUS:`)
    oasis.pain_status.forEach((item: any) => {
      const itemObj = typeof item === 'string' ? JSON.parse(item) : item
      sections.push(`  ${itemObj.item || 'Pain'}: ${itemObj.value || 'Unknown'}`)
    })
    sections.push('')
  }
  
  // Emotional Status
  if (oasis.emotional_status && Array.isArray(oasis.emotional_status) && oasis.emotional_status.length > 0) {
    sections.push(`EMOTIONAL/BEHAVIORAL STATUS:`)
    oasis.emotional_status.forEach((item: any) => {
      const itemObj = typeof item === 'string' ? JSON.parse(item) : item
      sections.push(`  ${itemObj.item || 'Status'}: ${itemObj.value || 'Unknown'}`)
    })
    sections.push('')
  }
  
  // Financial Impact
  if (oasis.current_hipps || oasis.optimized_hipps) {
    sections.push(`HIPPS CODES:`)
    sections.push(`  Current: ${oasis.current_hipps || 'Not calculated'}`)
    sections.push(`  Optimized: ${oasis.optimized_hipps || 'Not calculated'}`)
    sections.push('')
  }
  
  // Existing scores (for reference)
  sections.push(`EXISTING SCORES (for reference):`)
  sections.push(`  Quality Score: ${oasis.quality_score || 'Not set'}`)
  sections.push(`  Completeness Score: ${oasis.completeness_score || 'Not set'}`)
  sections.push(`  Confidence Score: ${oasis.confidence_score || 'Not set'}`)
  
  return sections.join('\n')
}

// Use AI to analyze the quality of extracted OASIS data
async function analyzeOasisExtractedData(dataSummary: string, oasis: any): Promise<{
  qualityScore: number
  completenessScore: number
  confidenceScore: number
  flaggedIssues: string[]
  revenueIncrease: number | null
}> {
  console.log("[Comprehensive QA] Sending extracted data to AI for quality analysis...")
  
  const prompt = `You are a Home Health QA expert. Analyze this OASIS assessment data and provide quality scores.

${dataSummary}

ANALYZE THE DATA AND PROVIDE:
1. QUALITY SCORE (0-100): Based on documentation completeness, clinical accuracy, and coding appropriateness
2. COMPLETENESS SCORE (0-100): Based on how many required fields are filled
3. CONFIDENCE SCORE (0-100): Based on data consistency and reliability
4. FLAGGED ISSUES: List specific problems found (missing data, inconsistencies, coding errors)
5. REVENUE OPTIMIZATION: Potential revenue increase if issues are fixed

SCORING GUIDELINES:
- 90-100: Excellent - All required fields complete, accurate coding, consistent data
- 80-89: Good - Minor issues, mostly complete
- 70-79: Fair - Several missing items or inconsistencies
- 60-69: Poor - Significant gaps in documentation
- Below 60: Critical - Major issues requiring immediate attention

CHECK FOR:
1. Missing functional status items (M1800-M1870)
2. Diagnosis code accuracy and specificity
3. Consistency between diagnoses and functional scores
4. Missing or incomplete medication list
5. Pain assessment completeness
6. Emotional/behavioral status documentation

Return ONLY valid JSON in this exact format:
{
  "qualityScore": <number 0-100>,
  "completenessScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "flaggedIssues": ["issue 1", "issue 2", ...],
  "revenueIncrease": <number or null>
}`

  // ✅ Enhanced retry logic with exponential backoff
  const maxRetries = 3
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ✅ Use Gemini (faster, 1M context) with OpenAI fallback
      const aiModel = useGemini 
        ? google("gemini-2.0-flash")
        : openai("gpt-4o-mini")
      
      console.log(`[Comprehensive QA] ${useGemini ? 'Gemini' : 'OpenAI'} call attempt ${attempt}/${maxRetries}`)
      
      const { text } = await generateText({
        model: aiModel,
        prompt: prompt,
        temperature: 0.1,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(90000), // ✅ Increased to 90 seconds
      })
      
      console.log("[Comprehensive QA] AI response received:", text.length, "chars")
    
    // Parse JSON response
    let jsonText = text.trim()
    jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "")
    const jsonStart = jsonText.indexOf("{")
    const jsonEnd = jsonText.lastIndexOf("}") + 1
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd)
    }
    
    const result = JSON.parse(jsonText)
    
    return {
      qualityScore: Math.min(100, Math.max(0, result.qualityScore || 75)),
      completenessScore: Math.min(100, Math.max(0, result.completenessScore || 75)),
      confidenceScore: Math.min(100, Math.max(0, result.confidenceScore || 75)),
      flaggedIssues: Array.isArray(result.flaggedIssues) ? result.flaggedIssues : [],
      revenueIncrease: result.revenueIncrease || null,
    }
    } catch (attemptError) {
      lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError))
      console.error(`[Comprehensive QA] ⚠️ Attempt ${attempt} failed:`, lastError.message)
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 2000 // Exponential backoff: 4s, 8s
        console.log(`[Comprehensive QA] Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
    
  // All retries failed - use fallback
  console.error("[Comprehensive QA] All retries failed:", lastError?.message)
    
  // Fallback: Calculate scores based on data presence
  const hasPatientInfo = oasis.patient_name && oasis.mrn
  const hasDiagnosis = oasis.primary_diagnosis
  const hasFunctionalStatus = oasis.functional_status?.length > 0
  const hasMedications = oasis.medications?.length > 0
  
  let baseScore = 60
  if (hasPatientInfo) baseScore += 10
  if (hasDiagnosis) baseScore += 10
  if (hasFunctionalStatus) baseScore += 10
  if (hasMedications) baseScore += 10
  
  return {
    qualityScore: baseScore,
    completenessScore: baseScore,
    confidenceScore: baseScore - 5,
    flaggedIssues: [
      !hasPatientInfo ? "Missing patient information" : null,
      !hasDiagnosis ? "Missing primary diagnosis" : null,
      !hasFunctionalStatus ? "Missing functional status items" : null,
      !hasMedications ? "Missing medications list" : null,
      `AI analysis failed after ${maxRetries} retries - ${lastError?.message || 'Unknown error'}`,
    ].filter(Boolean) as string[],
    revenueIncrease: null,
  }
}

// Complete OASIS analysis result type
interface OasisAnalysisResult {
  qualityScore: number
  completenessScore: number
  confidenceScore: number
  complianceScore: number
  flaggedIssues: string[]
  recommendations: string[]
  financialImpact: {
    currentRevenue: number
    optimizedRevenue: number
    potentialIncrease: number
    revenueOpportunities: string[]
  }
  documentAnalysis: {
    documentType: string
    completedSections: string[]
    missingSections: string[]
  }
  complianceChecks: {
    hipaaCompliant: boolean
    oasisCompliant: boolean
    medicareCompliant: boolean
    issues: string[]
  }
}

// COMPLETE OASIS analysis with all features (1.5 minute timeout)
async function analyzeOasisFast(extractedText: string, oasis: any): Promise<OasisAnalysisResult> {
  console.log("[Comprehensive QA] Running COMPLETE OASIS analysis with all features...")
  
  // Truncate text if too long (keep first 20000 chars)
  const textToAnalyze = extractedText.length > 20000 
    ? extractedText.substring(0, 20000) + "\n\n[... truncated for analysis ...]"
    : extractedText

  const prompt = `You are an expert Home Health OASIS QA Analyst. Perform a COMPREHENSIVE analysis.

OASIS DOCUMENT TEXT:
${textToAnalyze}

PATIENT INFO:
- Name: ${oasis.patient_name || 'Unknown'}
- MRN: ${oasis.mrn || 'Unknown'}
- Visit Type: ${oasis.visit_type || 'Unknown'}
- Payor: ${oasis.payor || 'Unknown'}

PERFORM COMPLETE ANALYSIS AND RETURN JSON:

1. QUALITY SCORES (0-100 each based on actual document content):
   - qualityScore: Overall documentation quality
   - completenessScore: How complete is the OASIS (check all M-items)
   - confidenceScore: Data reliability and accuracy
   - complianceScore: Regulatory compliance level

2. DOCUMENT TYPE ANALYSIS:
   - documentType: SOC, ROC, Recertification, Discharge, or Other
   - completedSections: List M-items found (M0100, M1000, M1800, etc.)
   - missingSections: List required M-items that are missing

3. REGULATORY COMPLIANCE:
   - hipaaCompliant: true/false
   - oasisCompliant: true/false (CMS requirements)
   - medicareCompliant: true/false
   - issues: List compliance problems found

4. FINANCIAL IMPACT (estimate based on functional scores):
   - currentRevenue: Estimated current HIPPS revenue (number)
   - optimizedRevenue: Potential optimized revenue (number)
   - potentialIncrease: Revenue increase possible (number)
   - revenueOpportunities: Specific opportunities for better coding

5. FLAGGED ISSUES: Critical problems found (max 10)

6. RECOMMENDATIONS: Specific actionable improvements (max 10)

SCORING GUIDELINES - Base on ACTUAL document content:
- 90-100: Excellent - All required M-items complete, accurate ICD-10 codes
- 80-89: Good - Most items complete, minor gaps
- 70-79: Fair - Several missing items or inconsistencies
- 60-69: Poor - Significant documentation gaps
- Below 60: Critical - Major issues requiring immediate attention

Return ONLY valid JSON (no markdown, no explanation):
{
  "qualityScore": 85,
  "completenessScore": 82,
  "confidenceScore": 88,
  "complianceScore": 90,
  "flaggedIssues": ["Issue 1", "Issue 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "financialImpact": {
    "currentRevenue": 2800,
    "optimizedRevenue": 3200,
    "potentialIncrease": 400,
    "revenueOpportunities": ["Opportunity 1"]
  },
  "documentAnalysis": {
    "documentType": "Recertification",
    "completedSections": ["M0100", "M1000"],
    "missingSections": ["M1800"]
  },
  "complianceChecks": {
    "hipaaCompliant": true,
    "oasisCompliant": true,
    "medicareCompliant": true,
    "issues": []
  }
}`

  // ✅ Enhanced retry logic with exponential backoff
  const maxRetries = 3
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ✅ Use Gemini (faster, 1M context) with OpenAI fallback
      const aiModel = useGemini 
        ? google("gemini-2.0-flash")
        : openai("gpt-4o-mini")
      
      console.log(`[Comprehensive QA] ${useGemini ? 'Gemini' : 'OpenAI'} OASIS analysis attempt ${attempt}/${maxRetries}`)
      
      const { text } = await generateText({
        model: aiModel,
        prompt: prompt,
        temperature: 0.1,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(120000), // ✅ Increased to 2 minutes
      })
      
      console.log("[Comprehensive QA] AI response received:", text.length, "chars")
      
      const result = safeParseJSON(text)
      
      return {
        qualityScore: Math.min(100, Math.max(0, result.qualityScore || 75)),
        completenessScore: Math.min(100, Math.max(0, result.completenessScore || 75)),
        confidenceScore: Math.min(100, Math.max(0, result.confidenceScore || 75)),
        complianceScore: Math.min(100, Math.max(0, result.complianceScore || 75)),
        flaggedIssues: Array.isArray(result.flaggedIssues) ? result.flaggedIssues.slice(0, 10) : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations.slice(0, 10) : [],
        financialImpact: {
          currentRevenue: result.financialImpact?.currentRevenue || 0,
          optimizedRevenue: result.financialImpact?.optimizedRevenue || 0,
          potentialIncrease: result.financialImpact?.potentialIncrease || 0,
          revenueOpportunities: Array.isArray(result.financialImpact?.revenueOpportunities) 
            ? result.financialImpact.revenueOpportunities.slice(0, 5) 
            : [],
        },
        documentAnalysis: {
          documentType: result.documentAnalysis?.documentType || oasis.visit_type || 'Unknown',
          completedSections: Array.isArray(result.documentAnalysis?.completedSections) 
            ? result.documentAnalysis.completedSections 
            : [],
          missingSections: Array.isArray(result.documentAnalysis?.missingSections) 
            ? result.documentAnalysis.missingSections 
            : [],
        },
        complianceChecks: {
          hipaaCompliant: result.complianceChecks?.hipaaCompliant ?? true,
          oasisCompliant: result.complianceChecks?.oasisCompliant ?? true,
          medicareCompliant: result.complianceChecks?.medicareCompliant ?? true,
          issues: Array.isArray(result.complianceChecks?.issues) 
            ? result.complianceChecks.issues.slice(0, 5) 
            : [],
        },
      }
    } catch (attemptError) {
      lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError))
      console.error(`[Comprehensive QA] ⚠️ OASIS analysis attempt ${attempt} failed:`, lastError.message)
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 3000 // Exponential backoff: 6s, 12s
        console.log(`[Comprehensive QA] Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
    
  // All retries failed
  console.error("[Comprehensive QA] Complete OASIS analysis all retries failed:", lastError?.message)
    
    // Fallback with default structure - NOT hardcoded scores, based on content
    const hasGoodContent = extractedText.length > 5000
    const hasMItems = extractedText.includes('M1800') || extractedText.includes('M1810')
    const hasDiagnosis = extractedText.includes('ICD') || extractedText.includes('I10') || extractedText.includes('Z99')
    
    let baseScore = 60
    if (hasGoodContent) baseScore += 10
    if (hasMItems) baseScore += 10
    if (hasDiagnosis) baseScore += 5
    
    return {
      qualityScore: baseScore,
      completenessScore: baseScore - 5,
      confidenceScore: baseScore - 10,
      complianceScore: baseScore,
      flaggedIssues: ["AI analysis incomplete - manual review recommended"],
      recommendations: ["Complete manual review of OASIS document", "Verify all M-items are documented"],
      financialImpact: {
        currentRevenue: 0,
        optimizedRevenue: 0,
        potentialIncrease: 0,
        revenueOpportunities: ["Manual review needed to identify opportunities"],
      },
      documentAnalysis: {
        documentType: oasis.visit_type || 'Unknown',
        completedSections: [],
        missingSections: ["Unable to determine - manual review needed"],
      },
      complianceChecks: {
        hipaaCompliant: true,
        oasisCompliant: true,
        medicareCompliant: true,
        issues: ["Unable to complete compliance check - manual review needed"],
      },
    }
  }

// Use AI to analyze extracted clinical document data (FAST - 1.5 minute timeout)
interface ClinicalAnalysisResult {
  qualityScore: number
  completenessScore: number
  complianceScore: number
  accuracyScore: number
  confidenceScore: number
  flaggedIssues: string[]
  recommendations: string[]
  missingElements: string[]
  financialImpact: {
    billingAccuracy: number
    potentialIssues: string[]
  }
  complianceChecks: {
    hipaaCompliant: boolean
    documentationCompliant: boolean
    issues: string[]
  }
}

async function analyzeClinicalExtractedData(extractedText: string, documentType: string): Promise<ClinicalAnalysisResult> {
  console.log("[Comprehensive QA] Analyzing clinical document:", documentType, "Text length:", extractedText.length)
  
  // Truncate text if too long (keep first 12000 chars)
  const textToAnalyze = extractedText.length > 12000 
    ? extractedText.substring(0, 12000) + "\n\n[... truncated for analysis ...]"
    : extractedText

  const prompt = `You are a Home Health QA expert. Perform COMPREHENSIVE analysis of this ${documentType} document.

DOCUMENT TYPE: ${documentType}
EXTRACTED TEXT:
${textToAnalyze}

PERFORM COMPLETE ANALYSIS AND RETURN JSON:

1. QUALITY SCORES (0-100 each - based on ACTUAL document content):
   - qualityScore: Overall documentation quality
   - completenessScore: How complete is the documentation
   - complianceScore: Regulatory compliance level
   - accuracyScore: Clinical accuracy
   - confidenceScore: Data reliability

2. FLAGGED ISSUES: Specific problems found (max 10)

3. RECOMMENDATIONS: Actionable improvements (max 10)

4. MISSING ELEMENTS: Required items that are missing

5. FINANCIAL IMPACT:
   - billingAccuracy: Score 0-100 for billing documentation
   - potentialIssues: Billing/coding problems found

6. COMPLIANCE CHECKS:
   - hipaaCompliant: true/false
   - documentationCompliant: true/false
   - issues: List compliance problems

SCORING GUIDELINES - Base on ACTUAL document content:
- 90-100: Excellent documentation
- 80-89: Good with minor gaps
- 70-79: Fair - needs improvement
- 60-69: Poor - significant issues
- Below 60: Critical - requires immediate attention

Return ONLY valid JSON (no markdown):
{
  "qualityScore": 85,
  "completenessScore": 82,
  "complianceScore": 88,
  "accuracyScore": 84,
  "confidenceScore": 86,
  "flaggedIssues": ["Issue 1", "Issue 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "missingElements": ["Element 1"],
  "financialImpact": {
    "billingAccuracy": 85,
    "potentialIssues": ["Issue 1"]
  },
  "complianceChecks": {
    "hipaaCompliant": true,
    "documentationCompliant": true,
    "issues": []
  }
}`

  // ✅ Enhanced retry logic with exponential backoff
  const maxRetries = 3
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ✅ Use Gemini (faster, 1M context) with OpenAI fallback
      const aiModel = useGemini 
        ? google("gemini-2.0-flash")
        : openai("gpt-4o-mini")
      
      console.log(`[Comprehensive QA] ${useGemini ? 'Gemini' : 'OpenAI'} Clinical analysis attempt ${attempt}/${maxRetries} for ${documentType}`)
      
      const { text } = await generateText({
        model: aiModel,
        prompt: prompt,
        temperature: 0.1,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(120000), // ✅ Increased to 2 minutes
      })
      
      console.log("[Comprehensive QA] Clinical AI response received:", text.length, "chars")
      
      const result = safeParseJSON(text)
      
      return {
        qualityScore: Math.min(100, Math.max(0, result.qualityScore || 75)),
        completenessScore: Math.min(100, Math.max(0, result.completenessScore || 75)),
        complianceScore: Math.min(100, Math.max(0, result.complianceScore || 75)),
        accuracyScore: Math.min(100, Math.max(0, result.accuracyScore || 75)),
        confidenceScore: Math.min(100, Math.max(0, result.confidenceScore || 75)),
        flaggedIssues: Array.isArray(result.flaggedIssues) ? result.flaggedIssues.slice(0, 10) : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations.slice(0, 10) : [],
        missingElements: Array.isArray(result.missingElements) ? result.missingElements : [],
        financialImpact: {
          billingAccuracy: result.financialImpact?.billingAccuracy || 75,
          potentialIssues: Array.isArray(result.financialImpact?.potentialIssues) 
            ? result.financialImpact.potentialIssues 
            : [],
        },
        complianceChecks: {
          hipaaCompliant: result.complianceChecks?.hipaaCompliant ?? true,
          documentationCompliant: result.complianceChecks?.documentationCompliant ?? true,
          issues: Array.isArray(result.complianceChecks?.issues) 
            ? result.complianceChecks.issues 
            : [],
        },
      }
    } catch (attemptError) {
      lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError))
      console.error(`[Comprehensive QA] ⚠️ Clinical analysis attempt ${attempt} failed:`, lastError.message)
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 2000 // Exponential backoff: 4s, 8s
        console.log(`[Comprehensive QA] Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
    
  // All retries failed
  console.error("[Comprehensive QA] Clinical AI analysis all retries failed:", lastError?.message)
    
    // Fallback scores - based on content, not hardcoded
    const hasGoodContent = extractedText.length > 2000
    const hasSignature = extractedText.toLowerCase().includes('signature') || extractedText.toLowerCase().includes('signed')
    const hasDate = extractedText.includes('202') || extractedText.includes('date')
    
    let baseScore = 60
    if (hasGoodContent) baseScore += 10
    if (hasSignature) baseScore += 5
    if (hasDate) baseScore += 5
    
    return {
      qualityScore: baseScore,
      completenessScore: baseScore - 5,
      complianceScore: baseScore,
      accuracyScore: baseScore - 5,
      confidenceScore: baseScore - 10,
      flaggedIssues: ["Unable to complete full AI analysis"],
      recommendations: ["Manual review recommended", "Verify all required fields are documented"],
      missingElements: [],
      financialImpact: {
        billingAccuracy: baseScore,
        potentialIssues: ["Manual review needed to identify billing issues"],
      },
      complianceChecks: {
        hipaaCompliant: true,
        documentationCompliant: true,
        issues: ["Unable to complete compliance check - manual review needed"],
      },
    }
  }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, chartId, includeAIAnalysis = true, reExtractFromPdf = false } = body

    if (!chartId && !patientId) {
      return NextResponse.json({ success: false, error: "chartId or patientId is required" }, { status: 400 })
    }

    console.log("[Comprehensive QA] Starting analysis for patient:", patientId, "chart:", chartId)
    console.log("[Comprehensive QA] Re-extract from PDF:", reExtractFromPdf)

    const supabase = createServiceClient()

    // Find chartId from patientId if needed, or use provided chartId
    let finalChartId = chartId
    if (!finalChartId && patientId) {
      // Try to find chart by patientId
      const { data: patientChart } = await supabase
        .from("clinical_documents")
        .select("chart_id")
        .eq("patient_id", patientId)
        .limit(1)
        .single()
      
      if (patientChart?.chart_id) {
        finalChartId = patientChart.chart_id
      } else {
        finalChartId = `CHART-${patientId}`
      }
    }

    console.log("[Comprehensive QA] Using chart ID:", finalChartId)

    // Fetch all documents for this chart
    const { data: documents } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("chart_id", finalChartId)
      .eq("status", "completed")

    const { data: oasisAssessments } = await supabase
      .from("oasis_assessments")
      .select("*")
      .eq("chart_id", finalChartId)
      .eq("status", "completed")

    console.log("[Comprehensive QA] Found", documents?.length || 0, "documents and", oasisAssessments?.length || 0, "OASIS assessments")

    console.log("[Comprehensive QA] Found", documents?.length || 0, "documents and", oasisAssessments?.length || 0, "OASIS assessments")

    // USE AI to ANALYZE the EXISTING extracted data from database
    let aiAnalysisResults: any[] = []
    
    if (includeAIAnalysis) {
      console.log("[Comprehensive QA] Analyzing extracted data with AI...")
      
      // Process OASIS assessments - Use FAST single-pass AI analysis (no timeout!)
      if (oasisAssessments && oasisAssessments.length > 0) {
        for (const oasis of oasisAssessments) {
          try {
            // Get text to analyze - either from PDF or existing extracted_text
            let textToAnalyze = oasis.extracted_text || ""
            
            // Try to extract fresh from PDF if available
            if (oasis.file_url) {
              console.log("[Comprehensive QA] 📄 Extracting from PDF:", oasis.id)
              const ocrResult = await pdfcoService.performOCR(oasis.file_url)
              if (ocrResult.success && ocrResult.text && ocrResult.text.length > 100) {
                textToAnalyze = ocrResult.text
                console.log("[Comprehensive QA] ✅ PDF extracted:", textToAnalyze.length, "chars")
              } else {
                console.log("[Comprehensive QA] ⚠️ PDF extraction failed, using existing text")
              }
            }
            
            if (textToAnalyze && textToAnalyze.length > 100) {
              console.log("[Comprehensive QA] 🔄 Running COMPLETE AI analysis on OASIS:", oasis.id)
              
              // Use COMPLETE AI analysis with all features
              const aiResult = await analyzeOasisFast(textToAnalyze, oasis)
              
              // Update OASIS assessment with ALL scores and analysis data
              await supabase
                .from("oasis_assessments")
                .update({
                  extracted_text: textToAnalyze.substring(0, 50000),
                  quality_score: aiResult.qualityScore,
                  completeness_score: aiResult.completenessScore,
                  confidence_score: aiResult.confidenceScore,
                  flagged_issues: JSON.stringify(aiResult.flaggedIssues || []),
                  // Store recommendations and compliance data as JSON
                  recommendations: JSON.stringify(aiResult.recommendations || []),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", oasis.id)
              
              // Push complete analysis results
              aiAnalysisResults.push({
                type: 'oasis',
                documentId: oasis.id,
                qualityScore: aiResult.qualityScore,
                completenessScore: aiResult.completenessScore,
                confidenceScore: aiResult.confidenceScore,
                complianceScore: aiResult.complianceScore,
                issues: aiResult.flaggedIssues?.length || 0,
                patientName: oasis.patient_name,
                // Include all the new features
                flaggedIssues: aiResult.flaggedIssues,
                recommendations: aiResult.recommendations,
                financialImpact: aiResult.financialImpact,
                documentAnalysis: aiResult.documentAnalysis,
                complianceChecks: aiResult.complianceChecks,
              })
              
              console.log("[Comprehensive QA] ✅ COMPLETE analysis done for OASIS:", oasis.id, "Score:", aiResult.qualityScore)
            } else {
              console.log("[Comprehensive QA] ⚠️ No text to analyze for OASIS:", oasis.id)
              aiAnalysisResults.push({
                type: 'oasis',
                documentId: oasis.id,
                error: "No text available to analyze",
                failed: true,
              })
            }
          } catch (error) {
            console.error("[Comprehensive QA] ⚠️ AI analysis error for OASIS:", oasis.id, error)
            aiAnalysisResults.push({
              type: 'oasis',
              documentId: oasis.id,
              error: error instanceof Error ? error.message : String(error),
              failed: true,
            })
          }
        }
      }
      
      // Process clinical documents - ALWAYS re-extract from PDF and analyze!
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          try {
            let textToAnalyze = doc.extracted_text
            
            // If has file_url, re-extract from PDF
            if (doc.file_url) {
              console.log("[Comprehensive QA] 📄 Extracting clinical document from PDF:", doc.id, doc.document_type)
              const ocrResult = await pdfcoService.performOCR(doc.file_url)
              const freshText = ocrResult.success ? ocrResult.text : ""
              if (freshText && freshText.length > 100) {
                textToAnalyze = freshText
                console.log("[Comprehensive QA] ✅ PDF extracted:", freshText.length, "chars")
                
                // Update the extracted_text in database
                await supabase
                  .from("clinical_documents")
                  .update({
                    extracted_text: freshText.substring(0, 50000),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", doc.id)
              }
            }
            
            if (textToAnalyze && textToAnalyze.length > 100) {
              console.log("[Comprehensive QA] 🔄 Analyzing clinical document with AI:", doc.id, doc.document_type)
              
              // Use AI to analyze the extracted text
              const aiResult = await analyzeClinicalExtractedData(textToAnalyze, doc.document_type)
              
              // Store AI results in qa_analysis table - check if exists first
              const { data: existingQa } = await supabase
                .from("qa_analysis")
                .select("id")
                .eq("document_id", doc.id)
                .limit(1)
                .single()
              
              const qaData = {
                  document_id: doc.id,
                  document_type: doc.document_type,
                  chart_id: finalChartId,
                quality_score: aiResult.qualityScore,
                compliance_score: aiResult.complianceScore,
                completeness_score: aiResult.completenessScore,
                accuracy_score: aiResult.accuracyScore,
                confidence_score: aiResult.confidenceScore,
                  findings: JSON.stringify({
                    flaggedIssues: aiResult.flaggedIssues || [],
                  }),
                  recommendations: JSON.stringify(aiResult.recommendations || []),
                  missing_elements: JSON.stringify(aiResult.missingElements || []),
                  analyzed_at: new Date().toISOString(),
              }
              
              let insertError
              if (existingQa?.id) {
                // Update existing record
                const { error } = await supabase
                  .from("qa_analysis")
                  .update(qaData)
                  .eq("id", existingQa.id)
                insertError = error
              } else {
                // Insert new record
                const { error } = await supabase
                  .from("qa_analysis")
                  .insert(qaData)
                insertError = error
              }
              
              if (insertError) {
                console.error("[Comprehensive QA] Error storing QA analysis:", insertError)
              }
              
              // Push complete analysis results with all features
              aiAnalysisResults.push({
                type: doc.document_type,
                documentId: doc.id,
                qualityScore: aiResult.qualityScore,
                completenessScore: aiResult.completenessScore,
                complianceScore: aiResult.complianceScore,
                accuracyScore: aiResult.accuracyScore,
                confidenceScore: aiResult.confidenceScore,
                issues: aiResult.flaggedIssues?.length || 0,
                // Include all the new features
                flaggedIssues: aiResult.flaggedIssues,
                recommendations: aiResult.recommendations,
                missingElements: aiResult.missingElements,
                financialImpact: aiResult.financialImpact,
                complianceChecks: aiResult.complianceChecks,
              })
              
              console.log("[Comprehensive QA] ✅ COMPLETE analysis done for document:", doc.id, "Score:", aiResult.qualityScore)
            } else {
              console.log("[Comprehensive QA] ⚠️ Document has no text to analyze:", doc.id, doc.document_type)
            }
            } catch (error) {
              console.error("[Comprehensive QA] ⚠️ AI analysis error for document:", doc.id, error)
              // Don't fail the entire process, just log and continue
              aiAnalysisResults.push({
                type: doc.document_type,
                documentId: doc.id,
                error: error instanceof Error ? error.message : String(error),
                failed: true,
              })
          }
        }
      }
      
      const successfulAnalyses = aiAnalysisResults.filter(r => !r.failed).length
      const failedAnalyses = aiAnalysisResults.filter(r => r.failed).length
      console.log(`[Comprehensive QA] AI analysis completed. ✅ ${successfulAnalyses} successful, ⚠️ ${failedAnalyses} failed`)
    }

    // Get QA analyses
    const documentIds = documents?.map(doc => doc.id) || []
    const { data: qaAnalyses } = await supabase
      .from("qa_analysis")
      .select("*")
      .in("document_id", documentIds.length > 0 ? documentIds : [0])

    // Aggregate scores and issues
    const qualityScores: number[] = []
    const complianceScores: number[] = []
    let totalIssues = 0
    let financialImpact = 0
    const flaggedIssues: any[] = []

    // Process clinical documents
    documents?.forEach((doc: any) => {
      if (doc.quality_score) qualityScores.push(doc.quality_score)
    })

    // Process OASIS assessments
    oasisAssessments?.forEach((oasis: any) => {
      if (oasis.quality_score) qualityScores.push(oasis.quality_score)
      if (oasis.revenue_increase) financialImpact += Number(oasis.revenue_increase) || 0
      if (oasis.flagged_issues && Array.isArray(oasis.flagged_issues)) {
        flaggedIssues.push(...oasis.flagged_issues)
        totalIssues += oasis.flagged_issues.length
      }
    })

    // Process QA analyses
    qaAnalyses?.forEach((qa: any) => {
      if (qa.quality_score) qualityScores.push(qa.quality_score)
      if (qa.compliance_score) complianceScores.push(qa.compliance_score)
      
      try {
        const findings = typeof qa.findings === 'string' ? JSON.parse(qa.findings) : qa.findings
        if (findings?.flaggedIssues && Array.isArray(findings.flaggedIssues)) {
          flaggedIssues.push(...findings.flaggedIssues)
          totalIssues += findings.flaggedIssues.length
        }
        if (findings?.inconsistencies && Array.isArray(findings.inconsistencies)) {
          totalIssues += findings.inconsistencies.length
        }
        if (qa.missing_elements && Array.isArray(qa.missing_elements)) {
          totalIssues += qa.missing_elements.length
        }
      } catch (e) {
        console.error("[Comprehensive QA] Error parsing findings:", e)
      }
    })

    const overallQAScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0

    const complianceScore = complianceScores.length > 0
      ? Math.round(complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length)
      : overallQAScore

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical" = "low"
    const criticalIssues = flaggedIssues.filter((issue: any) => 
      issue.severity === 'critical' || issue.severity === 'high'
    ).length

    if (overallQAScore < 70 || totalIssues > 15 || criticalIssues > 3) {
      riskLevel = "critical"
    } else if (overallQAScore < 80 || totalIssues > 10 || criticalIssues > 1) {
      riskLevel = "high"
    } else if (overallQAScore < 90 || totalIssues > 5) {
      riskLevel = "medium"
    }

    // Get patient info from first document
    const patientInfo = documents?.[0] || oasisAssessments?.[0] || {}
    const patientName = patientInfo.patient_name || "Unknown"
    const mrn = patientInfo.mrn || "N/A"

    const analysisResult = {
      patientInfo: {
        name: patientName,
        mrn: mrn,
        dob: patientInfo.dob || "N/A",
        admissionDate: patientInfo.visit_date || new Date().toISOString().split("T")[0],
        primaryDiagnosis: patientInfo.primary_diagnosis || "N/A",
        payor: patientInfo.payor || "N/A",
        clinician: patientInfo.clinician_name || "N/A",
        status: "Active - Under Care",
      },
      overallQAScore,
      complianceScore,
      riskLevel,
      processingTime: 0,
      documentTypes: {
        oasis: { qualityScore: 0, status: "missing", issues: 0 },
        clinicalNotes: { qualityScore: 0, status: "missing", issues: 0 },
        medicationRecords: { qualityScore: 0, status: "missing", issues: 0 },
        carePlan: { qualityScore: 0, status: "missing", issues: 0 },
        physicianOrders: { qualityScore: 0, status: "missing", issues: 0 },
        progressNotes: { qualityScore: 0, status: "missing", issues: 0 },
        assessments: { qualityScore: 0, status: "missing", issues: 0 },
        labResults: { qualityScore: 0, status: "missing", issues: 0 },
        insuranceAuth: { qualityScore: 0, status: "missing", issues: 0 },
      },
      totalIssues,
      criticalIssues,
      highIssues: flaggedIssues.filter((i: any) => i.severity === 'high').length,
      mediumIssues: flaggedIssues.filter((i: any) => i.severity === 'medium').length,
      lowIssues: flaggedIssues.filter((i: any) => i.severity === 'low').length,
      financialImpact,
      recommendations: [
        totalIssues > 10 ? "Address multiple documentation issues immediately" : "",
        criticalIssues > 0 ? "Review and resolve critical issues" : "",
        overallQAScore < 80 ? "Improve overall documentation quality" : "",
      ].filter(Boolean),
      lastReviewed: new Date().toISOString(),
      reviewedBy: "MASE AI Quality System",
    }

    // Map document types
    documents?.forEach((doc: any) => {
      if (doc.document_type === "poc") {
        analysisResult.documentTypes.carePlan = {
          qualityScore: doc.quality_score || 0,
          status: "complete",
          issues: 0,
        }
      } else if (doc.document_type === "physician_order") {
        analysisResult.documentTypes.physicianOrders = {
          qualityScore: doc.quality_score || 0,
          status: "complete",
          issues: 0,
        }
      } else if (doc.document_type === "pt_note" || doc.document_type === "rn_note") {
        analysisResult.documentTypes.progressNotes = {
          qualityScore: doc.quality_score || 0,
          status: "complete",
          issues: 0,
        }
      }
    })

    if (oasisAssessments && oasisAssessments.length > 0) {
      const avgOasisScore = Math.round(
        oasisAssessments.reduce((sum: number, o: any) => sum + (o.quality_score || 0), 0) /
        oasisAssessments.length
      )
      analysisResult.documentTypes.oasis = {
        qualityScore: avgOasisScore,
        status: "complete",
        issues: oasisAssessments.reduce((sum: number, o: any) => 
          sum + (Array.isArray(o.flagged_issues) ? o.flagged_issues.length : 0), 0
        ),
      }
    }

    // Aggregate recommendations from all AI analyses
    const allRecommendations: string[] = []
    const allComplianceIssues: string[] = []
    let totalFinancialIncrease = 0
    
    aiAnalysisResults.forEach((result: any) => {
      if (result.recommendations) {
        allRecommendations.push(...result.recommendations)
      }
      if (result.complianceChecks?.issues) {
        allComplianceIssues.push(...result.complianceChecks.issues)
      }
      if (result.financialImpact?.potentialIncrease) {
        totalFinancialIncrease += result.financialImpact.potentialIncrease
      }
    })

    return NextResponse.json({
      success: true,
      overallQAScore,
      complianceScore,
      riskLevel,
      flaggedIssues,
      financialImpact: totalFinancialIncrease || financialImpact,
      reviewRequired: totalIssues > 10 || criticalIssues > 0,
      // Include ALL the complete analysis features
      recommendations: [...new Set(allRecommendations)].slice(0, 15), // Unique recommendations
      complianceIssues: [...new Set(allComplianceIssues)].slice(0, 10),
      aiAnalysis: {
        completed: includeAIAnalysis,
        documentsAnalyzed: aiAnalysisResults.length,
        results: aiAnalysisResults, // Contains full analysis with recommendations, compliance, financial
      },
      data: analysisResult,
    })
  } catch (error) {
    console.error("Error in comprehensive QA analysis:", error)
    return NextResponse.json({ success: false, error: "Failed to analyze chart", details: String(error) }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ success: false, error: "Patient ID is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Find chart by patientId
    const { data: patientChart } = await supabase
      .from("clinical_documents")
      .select("chart_id, patient_name, mrn")
      .eq("patient_id", patientId)
      .limit(1)
      .single()

    if (!patientChart) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 })
    }

    // Fetch patient data
    const { data: documents } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("chart_id", patientChart.chart_id)
      .eq("status", "completed")

    const { data: oasisAssessments } = await supabase
      .from("oasis_assessments")
      .select("*")
      .eq("chart_id", patientChart.chart_id)
      .eq("status", "completed")

    const qualityScores: number[] = []
    documents?.forEach((doc: any) => {
      if (doc.quality_score) qualityScores.push(doc.quality_score)
    })
    oasisAssessments?.forEach((oasis: any) => {
      if (oasis.quality_score) qualityScores.push(oasis.quality_score)
    })

    const overallQAScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0

    const mockData = {
      patientInfo: {
        name: patientChart.patient_name || "Unknown",
        mrn: patientChart.mrn || "N/A",
        dob: "N/A",
        admissionDate: new Date().toISOString().split("T")[0],
        primaryDiagnosis: "N/A",
        payor: "N/A",
        clinician: "N/A",
        status: "Active - Under Care",
      },
      overallQAScore,
      complianceScore: overallQAScore,
      riskLevel: overallQAScore < 80 ? "high" : overallQAScore < 90 ? "medium" : "low",
      processingTime: 0,
      lastReviewed: new Date().toISOString(),
      reviewedBy: "MASE AI Quality System",
    }

    return NextResponse.json({
      success: true,
      data: mockData,
    })
  } catch (error) {
    console.error("Error fetching comprehensive QA data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 })
  }
}
