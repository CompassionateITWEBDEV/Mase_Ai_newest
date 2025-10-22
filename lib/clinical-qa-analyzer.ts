import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export type DocumentType = "oasis" | "poc" | "physician_order" | "rn_note" | "pt_note" | "ot_note" | "evaluation"

export interface ClinicalQAResult {
  patientInfo: {
    name: string
    mrn: string
    visitDate: string
    clinician: string
    clinicianType: string
  }
  qualityScores: {
    overall: number
    completeness: number
    accuracy: number
    compliance: number
    confidence: number
  }
  diagnoses: Array<{
    code: string
    description: string
    confidence: number
    source: string
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
  missingElements: Array<{
    element: string
    category: string
    severity: string
    recommendation: string
  }>
  flaggedIssues: Array<{
    issue: string
    severity: string
    location: string
    suggestion: string
    category: string
  }>
  riskFactors: Array<{
    factor: string
    severity: string
    recommendation: string
    mitigation: string
  }>
  recommendations: Array<{
    category: string
    recommendation: string
    priority: string
    expectedImpact: string
  }>
  regulatoryIssues: Array<{
    regulation: string
    issue: string
    severity: string
    remediation: string
  }>
  documentationGaps: Array<{
    gap: string
    impact: string
    recommendation: string
  }>
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
}

const DOCUMENT_TYPE_PROMPTS: Record<DocumentType, string> = {
  oasis: `Analyze this OASIS assessment for:
- Accurate ICD-10 coding and case mix optimization
- Completeness of all required OASIS items
- Clinical accuracy and consistency
- Revenue optimization opportunities
- Regulatory compliance (CMS OASIS requirements)`,

  poc: `Analyze this Plan of Care for:
- Alignment with physician orders and OASIS assessment
- Appropriate goals and interventions
- Frequency and duration appropriateness
- Skilled need justification
- Regulatory compliance (Medicare CoPs)`,

  physician_order: `Analyze this Physician Order for:
- Completeness of required elements (diagnoses, treatments, frequency, duration)
- Appropriate ICD-10 coding
- Medical necessity justification
- Consistency with clinical presentation
- Regulatory compliance (physician certification requirements)`,

  rn_note: `Analyze this RN visit note for:
- Comprehensive assessment documentation
- Skilled nursing interventions documented
- Progress toward goals
- Patient/caregiver education documented
- Regulatory compliance (visit note requirements)`,

  pt_note: `Analyze this PT visit note for:
- Functional assessment and measurements
- Skilled therapy interventions documented
- Progress toward goals with objective measures
- Safety assessment and recommendations
- Regulatory compliance (therapy documentation requirements)`,

  ot_note: `Analyze this OT visit note for:
- ADL/IADL assessment and functional status
- Skilled OT interventions documented
- Progress toward goals with objective measures
- Adaptive equipment and home modifications
- Regulatory compliance (therapy documentation requirements)`,

  evaluation: `Analyze this evaluation for:
- Comprehensive baseline assessment
- Appropriate goal setting
- Treatment plan justification
- Frequency and duration appropriateness
- Regulatory compliance (evaluation requirements)`,
}

export async function analyzeClinicalDocument(
  extractedText: string,
  documentType: DocumentType,
  relatedDocuments?: Array<{ type: string; text: string }>,
): Promise<ClinicalQAResult> {
  const typeSpecificPrompt = DOCUMENT_TYPE_PROMPTS[documentType]

  const relatedDocsContext = relatedDocuments?.length
    ? `\n\nRELATED DOCUMENTS FOR CROSS-REFERENCE:\n${relatedDocuments.map((doc) => `${doc.type.toUpperCase()}:\n${doc.text.substring(0, 500)}`).join("\n\n")}`
    : ""

  const prompt = `You are an expert clinical documentation QA specialist. ${typeSpecificPrompt}

DOCUMENT TO ANALYZE (${documentType.toUpperCase()}):
${extractedText.substring(0, 4000)}${relatedDocsContext}

Return ONLY a valid JSON object with this structure (no markdown, no extra text):
{
  "patientInfo": {"name": "string", "mrn": "string", "visitDate": "string", "clinician": "string", "clinicianType": "string"},
  "qualityScores": {"overall": 85, "completeness": 90, "accuracy": 88, "compliance": 92, "confidence": 87},
  "diagnoses": [{"code": "string", "description": "string", "confidence": 85, "source": "documented"}],
  "suggestedCodes": [{"code": "string", "description": "string", "reason": "string", "revenueImpact": 500, "confidence": 85}],
  "corrections": [{"field": "string", "current": "string", "suggested": "string", "reason": "string", "impact": "string", "revenueChange": 200}],
  "missingElements": [{"element": "string", "category": "required", "severity": "high", "recommendation": "string"}],
  "flaggedIssues": [{"issue": "string", "severity": "medium", "location": "string", "suggestion": "string", "category": "clinical"}],
  "riskFactors": [{"factor": "string", "severity": "medium", "recommendation": "string", "mitigation": "string"}],
  "recommendations": [{"category": "string", "recommendation": "string", "priority": "high", "expectedImpact": "string"}],
  "regulatoryIssues": [{"regulation": "string", "issue": "string", "severity": "medium", "remediation": "string"}],
  "documentationGaps": [{"gap": "string", "impact": "string", "recommendation": "string"}],
  "financialImpact": {
    "currentRevenue": 3500,
    "optimizedRevenue": 4200,
    "increase": 700,
    "breakdown": [{"category": "string", "current": 1000, "optimized": 1200, "difference": 200}]
  }
}`

  try {
    console.log(`[v0] Analyzing ${documentType} document with Groq AI...`)

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.2,
      maxTokens: 4000,
    })

    let jsonText = text.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    }

    const jsonStart = jsonText.indexOf("{")
    const jsonEnd = jsonText.lastIndexOf("}") + 1
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No JSON object found in response")
    }

    jsonText = jsonText.substring(jsonStart, jsonEnd)
    const analysis = JSON.parse(jsonText)

    // Validate and provide defaults
    const validatedAnalysis: ClinicalQAResult = {
      patientInfo: analysis.patientInfo || {
        name: "Unknown Patient",
        mrn: "N/A",
        visitDate: new Date().toISOString().split("T")[0],
        clinician: "Unknown",
        clinicianType: "Unknown",
      },
      qualityScores: analysis.qualityScores || {
        overall: 75,
        completeness: 75,
        accuracy: 75,
        compliance: 75,
        confidence: 75,
      },
      diagnoses: Array.isArray(analysis.diagnoses) ? analysis.diagnoses : [],
      suggestedCodes: Array.isArray(analysis.suggestedCodes) ? analysis.suggestedCodes : [],
      corrections: Array.isArray(analysis.corrections) ? analysis.corrections : [],
      missingElements: Array.isArray(analysis.missingElements) ? analysis.missingElements : [],
      flaggedIssues: Array.isArray(analysis.flaggedIssues) ? analysis.flaggedIssues : [],
      riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      regulatoryIssues: Array.isArray(analysis.regulatoryIssues) ? analysis.regulatoryIssues : [],
      documentationGaps: Array.isArray(analysis.documentationGaps) ? analysis.documentationGaps : [],
      financialImpact: analysis.financialImpact || {
        currentRevenue: 0,
        optimizedRevenue: 0,
        increase: 0,
        breakdown: [],
      },
    }

    console.log(`[v0] ${documentType} analysis completed successfully`)
    return validatedAnalysis
  } catch (error) {
    console.error(`[v0] Clinical QA analysis error for ${documentType}:`, error)
    throw new Error(`Failed to analyze ${documentType}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function aggregateChartAnalysis(analyses: ClinicalQAResult[]): {
  overallQuality: number
  overallCompliance: number
  overallCompleteness: number
  totalIssues: number
  criticalIssues: number
  totalRevenueOpportunity: number
} {
  if (analyses.length === 0) {
    return {
      overallQuality: 0,
      overallCompliance: 0,
      overallCompleteness: 0,
      totalIssues: 0,
      criticalIssues: 0,
      totalRevenueOpportunity: 0,
    }
  }

  const avgQuality = analyses.reduce((sum, a) => sum + a.qualityScores.overall, 0) / analyses.length
  const avgCompliance = analyses.reduce((sum, a) => sum + a.qualityScores.compliance, 0) / analyses.length
  const avgCompleteness = analyses.reduce((sum, a) => sum + a.qualityScores.completeness, 0) / analyses.length
  const totalIssues = analyses.reduce((sum, a) => sum + a.flaggedIssues.length, 0)
  const criticalIssues = analyses.reduce(
    (sum, a) => sum + a.flaggedIssues.filter((i) => i.severity === "critical" || i.severity === "high").length,
    0,
  )
  const totalRevenueOpportunity = analyses.reduce((sum, a) => sum + a.financialImpact.increase, 0)

  return {
    overallQuality: Math.round(avgQuality * 100) / 100,
    overallCompliance: Math.round(avgCompliance * 100) / 100,
    overallCompleteness: Math.round(avgCompleteness * 100) / 100,
    totalIssues,
    criticalIssues,
    totalRevenueOpportunity: Math.round(totalRevenueOpportunity * 100) / 100,
  }
}
