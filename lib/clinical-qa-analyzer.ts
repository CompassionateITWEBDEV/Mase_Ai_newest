import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

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
  // PT Visit specific extracted data
  extractedPTData?: {
    homeboundReasons: Array<{ reason: string; checked: boolean }>
    functionalLimitations: Array<{ limitation: string; checked: boolean }>
    vitalSigns: {
      sbp?: number
      dbp?: number
      hr?: number
      resp?: number
      temp?: string
      weight?: string
      o2Sat?: string
    }
    functionalMobilityKey?: {
      independent?: string
      supervision?: string
      verbalCue?: string
      contactGuardAssist?: string
      minAssist?: string
      modAssist?: string
      maxAssist?: string
      totalAssist?: string
    }
    bedMobilityTraining?: {
      rolling?: { level: string; reps: string }
      supSit?: { level: string; reps: string }
      scooting?: { level: string; reps: string }
      sitToStand?: { level: string; reps: string }
      comments?: string
    }
    transferTraining?: {
      reps?: string
      assistiveDevice?: string
      bedChair?: { level: string }
      chairToilet?: { level: string }
      chairCar?: { level: string }
      sittingBalance?: { static: string; dynamic: string }
      standingBalance?: { static: string; dynamic: string }
      comments?: string
    }
    gaitTraining?: {
      distance?: string
      reps?: string
      assistiveDevice?: string
      assistanceLevel?: string
      qualityDeviation?: string
      stairs?: { steps?: string; rail1?: boolean; rail2?: boolean }
    }
    skilledTreatmentProvided?: Array<{ treatment: string; checked: boolean }>
    teaching?: {
      patient?: boolean
      caregiver?: boolean
      hep?: boolean
      safeTransfer?: boolean
      safeGait?: boolean
      breathingTechniques?: string
      other?: string
    }
    painAssessment?: {
      levelBefore?: number
      location?: string
      levelAfter?: number
      relievedBy?: string
    }
    assessment?: string
    plan?: {
      continuePlan?: string
      changePlan?: string
      dischargeComments?: string
    }
    narrative?: string
    progressTowardGoals?: {
      improvements?: string
      goalsMet?: boolean
    }
  }
  // Optimization suggestions for PT Visit data
  ptOptimizations?: {
    homeboundReasons?: { current: string[]; suggested: string[]; rationale: string }
    functionalLimitations?: { current: string[]; suggested: string[]; rationale: string }
    bedMobility?: { current: any; suggested: any; rationale: string }
    transferTraining?: { current: any; suggested: any; rationale: string }
    gaitTraining?: { current: any; suggested: any; rationale: string }
    skilledTreatment?: { current: string[]; suggested: string[]; rationale: string }
    documentationImprovements?: Array<{ section: string; current: string; suggested: string; rationale: string }>
  }
  // Plan of Care specific QA analysis
  pocQAAnalysis?: string
  pocStructuredData?: {
    missingInformation: Array<{ issue: string; whyItMatters: string }>
    inconsistencies: Array<{ issue: string; conflictsWith: string }>
    medicationIssues: Array<{ issue: string; problemType: string }>
    clinicalLogicGaps: Array<{ issue: string; explanation: string }>
    complianceRisks: Array<{ issue: string; reason: string }>
    signatureDateProblems: Array<{ issue: string; conflict: string }>
  }
  pocExtractedData?: {
    patientInfo: {
      name: string
      mrn: string
      dob: string
      gender: string
      address: string
      phone: string
    }
    orderInfo: {
      orderNumber: string
      startOfCareDate: string
      certificationPeriod: { start: string; end: string }
      providerNumber: string
      patientHIClaimNo: string
    }
    physicianInfo: {
      name: string
      npi: string
      address: string
      phone: string
      fax: string
    }
    agencyInfo: {
      name: string
      address: string
      phone: string
      fax: string
    }
    clinicalStatus: {
      prognosis: string
      mentalCognitiveStatus: string
      functionalLimitations: string[]
      safety: string[]
      advanceDirectives: string
      psychosocialStatus: string
    }
    emergencyPreparedness: {
      emergencyTriage: string
      evacuationZone: string
      additionalInfo: string
    }
    medications: Array<{
      name: string
      dosage: string
      frequency: string
      route: string
      prn: boolean
      prnRationale?: string
    }>
    diagnoses: {
      principal: { code: string; description: string }
      other: Array<{ code: string; description: string }>
    }
    dmeInfo: {
      dmeItems: string[]
      providerName: string
      providerPhone: string
      suppliesProvided: string
    }
    caregiverInfo: {
      status: string
      details: string
    }
    goals: {
      patientGoals: string[]
      ptGoals: string[]
      measurableGoals: string[]
    }
    treatmentPlan: {
      disciplines: string[]
      frequencies: string[]
      effectiveDate: string
      orders: string[]
    }
    signatures: {
      nurseTherapistSignature: string
      nurseTherapistDate: string
      physicianSignature: string
      physicianSignatureDate: string
      dateHHAReceivedSigned: string
      f2fDate: string
    }
    homeboundNarrative: string
    medicalNecessity: string
    rehabilitationPotential: string
    dischargePlan: {
      dischargeTo: string
      dischargeWhen: string
    }
  }
}

const DOCUMENT_TYPE_PROMPTS: Record<DocumentType, string> = {
  oasis: `Analyze this OASIS assessment for:
- Accurate ICD-10 coding and case mix optimization
- Completeness of all required OASIS items
- Clinical accuracy and consistency
- Revenue optimization opportunities
- Regulatory compliance (CMS OASIS requirements)`,

  poc: `You are an AI QA Auditor specializing in CMS Home Health Plan of Care (485) forms.

Analyze the Plan of Care PDF text and identify ONLY:

1. Missing information
2. Documentation errors
3. Inconsistencies
4. Conflicting clinical data
5. Signature/date problems
6. Medication list issues
7. Incorrect or weak homebound narrative
8. Incorrect, missing, or weak medical necessity justification
9. Therapy order inconsistencies
10. Diagnosis vs functional status mismatch
11. Missing PRN rationale
12. Compliance risks based on Medicare Conditions of Participation

Do NOT rewrite the document.
Do NOT optimize it.
Only analyze and report findings.

CHECK FOR:
- Missing DME provider details
- Missing caregiver information
- Missing Evacuation Zone / Emergency Preparedness details
- Incorrect Certification Period or F2F dates
- Late physician signatures
- Duplicated safety instructions
- Incorrect medication spelling, route, dosage, or frequency
- ICD-10 codes that don't match clinical narrative
- Missing measurable goals
- Weak or incomplete therapy goals
- Missing functional limitations
- Missing prognosis or clinical summaries`,

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

  pt_note: `Extract and analyze ALL data from this PT visit note including:
- Patient demographics (name, MRN, DOB, visit date, time in/out, episode period, physician)
- Homebound reasons (all checked items)
- Functional limitations (ROM/Strength, Balance/Gait, Transfer, Pain, W/C Mobility, Bed Mobility, Safety, etc.)
- Vital signs (SBP, DBP, HR, Resp, Temp, Weight, O2 Sat)
- Subjective findings (patient reported symptoms/complaints)
- Objective findings (specific exercises, ROM measurements, repetitions, sets, body parts, duration)
- Bed mobility training (rolling, sup-sit, scooting, sit to stand with assistance levels and reps)
- Transfer training (bed-chair, chair-toilet, chair-car with assistance levels, assistive devices)
- Gait training (distance, assistive device, assistance level, gait quality/deviations, stairs)
- Teaching provided (patient, caregiver, HEP, safe transfer, safe gait, breathing techniques, etc.)
- Pain assessment (level before/after therapy, location, relieved by)
- Assessment (clinical findings and patient status)
- Plan (continue/change prescribed plan, discharge comments)
- Narrative (detailed exercise descriptions, interventions provided)
- Progress made towards goals (specific improvements, goals met status)
- Skilled treatment provided (all checked interventions: therapeutic exercise, balance training, gait training, transfer training, etc.)
- Other comments
- Signature and credentials
Extract EVERY detail from ALL pages of the document.`,

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

// Specialized Plan of Care analyzer with QA format and accurate data extraction
export async function analyzePlanOfCare(extractedText: string): Promise<{
  qaAnalysis: string
  structuredData: {
    missingInformation: Array<{ issue: string; whyItMatters: string }>
    inconsistencies: Array<{ issue: string; conflictsWith: string }>
    medicationIssues: Array<{ issue: string; problemType: string }>
    clinicalLogicGaps: Array<{ issue: string; explanation: string }>
    complianceRisks: Array<{ issue: string; reason: string }>
    signatureDateProblems: Array<{ issue: string; conflict: string }>
  }
  extractedData: {
    patientInfo: {
      name: string
      mrn: string
      dob: string
      gender: string
      address: string
      phone: string
    }
    orderInfo: {
      orderNumber: string
      startOfCareDate: string
      certificationPeriod: {
        start: string
        end: string
      }
      providerNumber: string
      patientHIClaimNo: string
    }
    physicianInfo: {
      name: string
      npi: string
      address: string
      phone: string
      fax: string
    }
    agencyInfo: {
      name: string
      address: string
      phone: string
      fax: string
    }
    clinicalStatus: {
      prognosis: string
      mentalCognitiveStatus: string
      functionalLimitations: string[]
      safety: string[]
      advanceDirectives: string
      psychosocialStatus: string
    }
    emergencyPreparedness: {
      emergencyTriage: string
      evacuationZone: string
      additionalInfo: string
    }
    medications: Array<{
      name: string
      dosage: string
      frequency: string
      route: string
      prn: boolean
      prnRationale?: string
    }>
    diagnoses: {
      principal: { code: string; description: string }
      other: Array<{ code: string; description: string }>
    }
    dmeInfo: {
      dmeItems: string[]
      providerName: string
      providerPhone: string
      suppliesProvided: string
    }
    caregiverInfo: {
      status: string
      details: string
    }
    goals: {
      patientGoals: string[]
      ptGoals: string[]
      measurableGoals: string[]
    }
    treatmentPlan: {
      disciplines: string[]
      frequencies: string[]
      effectiveDate: string
      orders: string[]
    }
    signatures: {
      nurseTherapistSignature: string
      nurseTherapistDate: string
      physicianSignature: string
      physicianSignatureDate: string
      dateHHAReceivedSigned: string
      f2fDate: string
    }
    homeboundNarrative: string
    medicalNecessity: string
    rehabilitationPotential: string
    dischargePlan: {
      dischargeTo: string
      dischargeWhen: string
    }
  }
}> {
  const prompt = `You are an AI QA Auditor specializing in CMS Home Health Plan of Care (485) forms.

FIRST: Extract ALL accurate data from the Plan of Care document. Extract EVERY detail from EVERY page.

EXTRACT THE FOLLOWING DATA ACCURATELY:

1. PATIENT INFORMATION:
   - Patient Name (exact as written)
   - Medical Record Number (MRN) - look for "Medical Record No." or "MRN"
   - Date of Birth (DOB)
   - Gender
   - Address (complete)
   - Phone number

2. ORDER INFORMATION:
   - Order Number
   - Start of Care Date
   - Certification Period (start and end dates)
   - Provider Number
   - Patient HI Claim Number

3. PHYSICIAN INFORMATION:
   - Physician Name (exact as written)
   - NPI Number
   - Address (complete)
   - Office Phone
   - Fax Number

4. AGENCY INFORMATION:
   - Agency Name
   - Address (complete)
   - Office Phone
   - Fax Number

5. CLINICAL STATUS:
   - Prognosis
   - Mental/Cognitive Status
   - Functional Limitations (all listed)
   - Safety (all items checked)
   - Advance Directives (full text)
   - Psychosocial Status

6. EMERGENCY PREPAREDNESS:
   - Emergency Triage level and description
   - Evacuation Zone (if mentioned)
   - Additional Emergency Preparedness Information

7. MEDICATIONS:
   - Extract ALL medications with:
     * Medication name (exact spelling)
     * Dosage
     * Frequency
     * Route (PO, PR, INH, etc.)
     * PRN status (Yes/No)
     * PRN rationale (if PRN)

8. DIAGNOSES:
   - Principal Diagnosis (code and description)
   - All Other Diagnoses (codes and descriptions)

9. DME INFORMATION:
   - DME items listed
   - DME Provider Name
   - DME Provider Phone
   - Supplies Provided

10. CAREGIVER INFORMATION:
    - Caregiver Status
    - Details about caregiver

11. GOALS:
    - Patient's personal healthcare goals
    - PT goals (all listed)
    - Measurable goals

12. TREATMENT PLAN:
    - Disciplines ordered (PT, OT, SN, etc.)
    - Frequencies for each discipline
    - Effective Date
    - Specific orders/treatments

13. SIGNATURES AND DATES:
    - Nurse/Therapist Signature and Date
    - Physician Signature and Date
    - Date HHA Received Signed
    - F2F (Face-to-Face) Date

14. NARRATIVES:
    - Homebound Narrative (complete text)
    - Medical Necessity (complete text)
    - F2F Addendum/Admission Narrative (if present)

15. REHABILITATION AND DISCHARGE:
    - Rehabilitation Potential
    - Discharge To Care Of
    - Discharge When

⚠️⚠️⚠️ CRITICAL EXTRACTION INSTRUCTIONS: ⚠️⚠️⚠️
- Extract EXACT values as they appear in the document
- For MRN: Look for "Medical Record No." or "MRN" - extract the EXACT value (e.g., "Duncan12202024")
- For Order #: Extract the EXACT order number (e.g., "61124823")
- For Dates: Extract dates in the EXACT format shown (e.g., "12/20/2024", "2/18/2025", "6/30/2025")
- For Medications: Extract EXACT medication names, dosages, frequencies, routes - preserve spelling even if it looks incorrect
- For Diagnoses: Extract EXACT ICD-10 codes and descriptions as written
- For Signatures: Extract EXACT names and dates as shown
- If a field is blank, mark it as "Missing" or "N/A" - do NOT make up values
- Extract ALL medications from ALL pages - check both medication sections
- Extract ALL diagnoses - principal and all other diagnoses
- Extract complete addresses, phone numbers, and all contact information
- For DME Provider: If fields are blank, mark as "Missing" - do NOT leave empty

SECOND: After extracting all data, analyze for QA issues:

1. Missing information
2. Documentation errors
3. Inconsistencies
4. Conflicting clinical data
5. Signature/date problems
6. Medication list issues
7. Incorrect or weak homebound narrative
8. Incorrect, missing, or weak medical necessity justification
9. Therapy order inconsistencies
10. Diagnosis vs functional status mismatch
11. Missing PRN rationale
12. Compliance risks based on Medicare Conditions of Participation

CHECK FOR:
- Missing DME provider details
- Missing caregiver information
- Missing Evacuation Zone / Emergency Preparedness details
- Incorrect Certification Period or F2F dates
- Late physician signatures
- Duplicated safety instructions
- Incorrect medication spelling, route, dosage, or frequency
- ICD-10 codes that don't match clinical narrative
- Missing measurable goals
- Weak or incomplete therapy goals
- Missing functional limitations
- Missing prognosis or clinical summaries

PLAN OF CARE TEXT TO ANALYZE (ALL PAGES - EXTRACT EVERYTHING):
${extractedText.substring(0, 50000)}

OUTPUT FORMAT (return as JSON):
{
  "qaAnalysis": "Full text analysis in the exact format specified below",
  "structuredData": {
    "missingInformation": [{"issue": "Description", "whyItMatters": "Explanation"}],
    "inconsistencies": [{"issue": "Description", "conflictsWith": "What it conflicts with"}],
    "medicationIssues": [{"issue": "Description", "problemType": "Type of problem"}],
    "clinicalLogicGaps": [{"issue": "Description", "explanation": "Explanation"}],
    "complianceRisks": [{"issue": "Description", "reason": "Reason"}],
    "signatureDateProblems": [{"issue": "Description", "conflict": "Conflict details"}]
  },
  "extractedData": {
    "patientInfo": {
      "name": "EXACT patient name from document",
      "mrn": "EXACT MRN from document (e.g., 'Duncan12202024')",
      "dob": "Date of birth",
      "gender": "Male/Female",
      "address": "Complete address",
      "phone": "Phone number"
    },
    "orderInfo": {
      "orderNumber": "Order # (e.g., '61124823')",
      "startOfCareDate": "Start of Care Date",
      "certificationPeriod": {"start": "Start date", "end": "End date"},
      "providerNumber": "Provider No.",
      "patientHIClaimNo": "Patient HI Claim No."
    },
    "physicianInfo": {
      "name": "EXACT physician name (e.g., 'HAZIN, RIBHI M.D.')",
      "npi": "NPI number",
      "address": "Complete address",
      "phone": "Office phone",
      "fax": "Fax number"
    },
    "agencyInfo": {
      "name": "Agency name",
      "address": "Complete address",
      "phone": "Office phone",
      "fax": "Fax number"
    },
    "clinicalStatus": {
      "prognosis": "Prognosis",
      "mentalCognitiveStatus": "Mental/Cognitive Status",
      "functionalLimitations": ["All functional limitations listed"],
      "safety": ["All safety items checked"],
      "advanceDirectives": "Full advance directives text",
      "psychosocialStatus": "Psychosocial status"
    },
    "emergencyPreparedness": {
      "emergencyTriage": "Emergency Triage level and description",
      "evacuationZone": "Evacuation Zone if mentioned",
      "additionalInfo": "Additional emergency preparedness information"
    },
    "medications": [
      {
        "name": "EXACT medication name",
        "dosage": "Dosage (e.g., '50 MG')",
        "frequency": "Frequency (e.g., 'Two times daily')",
        "route": "Route (e.g., 'By mouth (PO)')",
        "prn": true/false,
        "prnRationale": "PRN rationale if PRN"
      }
    ],
    "diagnoses": {
      "principal": {"code": "ICD-10 code", "description": "Description"},
      "other": [{"code": "ICD-10 code", "description": "Description"}]
    },
    "dmeInfo": {
      "dmeItems": ["All DME items"],
      "providerName": "DME Provider Name (or 'Missing' if blank)",
      "providerPhone": "DME Provider Phone (or 'Missing' if blank)",
      "suppliesProvided": "Supplies provided (or 'Missing' if blank)"
    },
    "caregiverInfo": {
      "status": "Caregiver status",
      "details": "Caregiver details"
    },
    "goals": {
      "patientGoals": ["All patient personal healthcare goals"],
      "ptGoals": ["All PT goals"],
      "measurableGoals": ["All measurable goals"]
    },
    "treatmentPlan": {
      "disciplines": ["PT", "OT", "SN", etc.],
      "frequencies": ["Frequencies for each discipline"],
      "effectiveDate": "Effective Date",
      "orders": ["All specific orders/treatments"]
    },
    "signatures": {
      "nurseTherapistSignature": "Nurse/Therapist signature name",
      "nurseTherapistDate": "Nurse/Therapist signature date",
      "physicianSignature": "Physician signature name",
      "physicianSignatureDate": "Physician signature date",
      "dateHHAReceivedSigned": "Date HHA received signed",
      "f2fDate": "F2F (Face-to-Face) date"
    },
    "homeboundNarrative": "Complete homebound narrative text",
    "medicalNecessity": "Complete medical necessity text",
    "rehabilitationPotential": "Rehabilitation potential",
    "dischargePlan": {
      "dischargeTo": "Discharge To Care Of",
      "dischargeWhen": "Discharge When"
    }
  }
}

The qaAnalysis field should contain the full text in this exact format:

Plan of Care QA Analysis:

Missing Information:
• [Issue] – [Why it matters]

Inconsistencies:
• [Issue] – [What it conflicts with]

Medication Issues:
• [Issue] – [Type of problem]

Clinical Logic Gaps:
• [Issue] – [Explanation]

Compliance Risks:
• [Issue] – [Reason]

Signature/Date Problems:
• [Issue] – [Conflict]

Plan of Care QA analysis completed.`

  try {
    console.log(`[POC] Analyzing Plan of Care document with OpenAI...`)

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.1, // Lower temperature for more accurate extraction
      maxTokens: 12000, // Increased for comprehensive data extraction
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

    // Validate structure
    const validatedAnalysis = {
      qaAnalysis: analysis.qaAnalysis || "Plan of Care QA analysis completed.",
      structuredData: {
        missingInformation: Array.isArray(analysis.structuredData?.missingInformation) 
          ? analysis.structuredData.missingInformation 
          : [],
        inconsistencies: Array.isArray(analysis.structuredData?.inconsistencies)
          ? analysis.structuredData.inconsistencies
          : [],
        medicationIssues: Array.isArray(analysis.structuredData?.medicationIssues)
          ? analysis.structuredData.medicationIssues
          : [],
        clinicalLogicGaps: Array.isArray(analysis.structuredData?.clinicalLogicGaps)
          ? analysis.structuredData.clinicalLogicGaps
          : [],
        complianceRisks: Array.isArray(analysis.structuredData?.complianceRisks)
          ? analysis.structuredData.complianceRisks
          : [],
        signatureDateProblems: Array.isArray(analysis.structuredData?.signatureDateProblems)
          ? analysis.structuredData.signatureDateProblems
          : [],
      },
      extractedData: analysis.extractedData || {
        patientInfo: { name: "N/A", mrn: "N/A", dob: "N/A", gender: "N/A", address: "N/A", phone: "N/A" },
        orderInfo: { orderNumber: "N/A", startOfCareDate: "N/A", certificationPeriod: { start: "N/A", end: "N/A" }, providerNumber: "N/A", patientHIClaimNo: "N/A" },
        physicianInfo: { name: "N/A", npi: "N/A", address: "N/A", phone: "N/A", fax: "N/A" },
        agencyInfo: { name: "N/A", address: "N/A", phone: "N/A", fax: "N/A" },
        clinicalStatus: { prognosis: "N/A", mentalCognitiveStatus: "N/A", functionalLimitations: [], safety: [], advanceDirectives: "N/A", psychosocialStatus: "N/A" },
        emergencyPreparedness: { emergencyTriage: "N/A", evacuationZone: "N/A", additionalInfo: "N/A" },
        medications: [],
        diagnoses: { principal: { code: "N/A", description: "N/A" }, other: [] },
        dmeInfo: { dmeItems: [], providerName: "N/A", providerPhone: "N/A", suppliesProvided: "N/A" },
        caregiverInfo: { status: "N/A", details: "N/A" },
        goals: { patientGoals: [], ptGoals: [], measurableGoals: [] },
        treatmentPlan: { disciplines: [], frequencies: [], effectiveDate: "N/A", orders: [] },
        signatures: { nurseTherapistSignature: "N/A", nurseTherapistDate: "N/A", physicianSignature: "N/A", physicianSignatureDate: "N/A", dateHHAReceivedSigned: "N/A", f2fDate: "N/A" },
        homeboundNarrative: "N/A",
        medicalNecessity: "N/A",
        rehabilitationPotential: "N/A",
        dischargePlan: { dischargeTo: "N/A", dischargeWhen: "N/A" },
      },
    }

    console.log(`[POC] Plan of Care analysis completed successfully`)
    return validatedAnalysis
  } catch (error) {
    console.error(`[POC] Plan of Care analysis error:`, error)
    throw new Error(`Failed to analyze Plan of Care: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function analyzeClinicalDocument(
  extractedText: string,
  documentType: DocumentType,
  relatedDocuments?: Array<{ type: string; text: string }>,
): Promise<ClinicalQAResult> {
  // Handle Plan of Care separately with specialized analyzer
  if (documentType === "poc") {
    const pocAnalysis = await analyzePlanOfCare(extractedText)
    
    // Convert POC analysis to standard ClinicalQAResult format
    return {
      patientInfo: {
        name: "Unknown Patient",
        mrn: "N/A",
        visitDate: new Date().toISOString().split("T")[0],
        clinician: "Unknown",
        clinicianType: "Unknown",
      },
      qualityScores: {
        overall: 75,
        completeness: 75,
        accuracy: 75,
        compliance: 75,
        confidence: 75,
      },
      diagnoses: [],
      suggestedCodes: [],
      corrections: [],
      missingElements: pocAnalysis.structuredData.missingInformation.map(item => ({
        element: item.issue,
        category: "required",
        severity: "high",
        recommendation: item.whyItMatters,
      })),
      flaggedIssues: [
        ...pocAnalysis.structuredData.inconsistencies.map(item => ({
          issue: item.issue,
          severity: "medium",
          location: "Plan of Care",
          suggestion: item.conflictsWith,
          category: "inconsistency",
        })),
        ...pocAnalysis.structuredData.medicationIssues.map(item => ({
          issue: item.issue,
          severity: "high",
          location: "Medication List",
          suggestion: item.problemType,
          category: "medication",
        })),
        ...pocAnalysis.structuredData.clinicalLogicGaps.map(item => ({
          issue: item.issue,
          severity: "medium",
          location: "Clinical Documentation",
          suggestion: item.explanation,
          category: "clinical",
        })),
        ...pocAnalysis.structuredData.signatureDateProblems.map(item => ({
          issue: item.issue,
          severity: "high",
          location: "Signature/Date Section",
          suggestion: item.conflict,
          category: "compliance",
        })),
      ],
      riskFactors: pocAnalysis.structuredData.complianceRisks.map(item => ({
        factor: item.issue,
        severity: "high",
        recommendation: item.reason,
        mitigation: "Address compliance risk immediately",
      })),
      recommendations: [],
      regulatoryIssues: pocAnalysis.structuredData.complianceRisks.map(item => ({
        regulation: "CMS Conditions of Participation",
        issue: item.issue,
        severity: "high",
        remediation: item.reason,
      })),
      documentationGaps: pocAnalysis.structuredData.missingInformation.map(item => ({
        gap: item.issue,
        impact: item.whyItMatters,
        recommendation: "Add missing information to ensure compliance",
      })),
      financialImpact: {
        currentRevenue: 0,
        optimizedRevenue: 0,
        increase: 0,
        breakdown: [],
      },
      pocQAAnalysis: pocAnalysis.qaAnalysis,
      pocStructuredData: pocAnalysis.structuredData,
      pocExtractedData: pocAnalysis.extractedData,
    }
  }

  const typeSpecificPrompt = DOCUMENT_TYPE_PROMPTS[documentType]

  const relatedDocsContext = relatedDocuments?.length
    ? `\n\nRELATED DOCUMENTS FOR CROSS-REFERENCE:\n${relatedDocuments.map((doc) => `${doc.type.toUpperCase()}:\n${doc.text.substring(0, 500)}`).join("\n\n")}`
    : ""

  // For PT notes, use more text to capture all pages
  const textLimit = documentType === "pt_note" ? 20000 : 4000
  
  // Enhanced prompt for PT notes with detailed extraction instructions
  const ptNoteExtractionInstructions = documentType === "pt_note" ? `

🔍 DETAILED EXTRACTION REQUIREMENTS FOR PT VISIT NOTES:

1. PATIENT DEMOGRAPHICS - Extract ALL:
   - Patient Name (exact format: "Last, First Middle")
   - MRN (Medical Record Number)
   - DOB (Date of Birth)
   - Visit Date
   - Time In / Time Out
   - Episode/Period dates
   - Physician name
   - Clinician name and credentials (PT, DPT, etc.)

2. HOMEBOUND REASONS - List ALL checked items:
   - Requires considerable and taxing effort
   - Needs assist with transfer
   - Needs assist leaving the home
   - Medical restriction
   - Needs assist with ambulation
   - Unable to be up for long period
   - Unsafe to go out of home alone
   - Severe SOB upon exertion
   - Any other checked reasons

3. FUNCTIONAL LIMITATIONS - List ALL checked items:
   - ROM/Strength
   - Safety Techniques
   - Balance/Gait
   - Transfer
   - Pain
   - W/C Mobility
   - Bed Mobility
   - Increased fall risk
   - Coordination
   - Any other limitations

4. VITAL SIGNS - Extract ALL values:
   - SBP (Systolic Blood Pressure)
   - DBP (Diastolic Blood Pressure)
   - HR (Heart Rate) and location (Radial, etc.)
   - Resp (Respiratory Rate)
   - Temp (Temperature) and unit (F or C)
   - Weight
   - O2 Sat (Oxygen Saturation) and delivery method (RA, NC, etc.)

5. SUBJECTIVE - Extract complete patient-reported information:
   - All patient complaints, symptoms, or reported issues
   - Include exact wording when possible

6. OBJECTIVE - Extract ALL exercise and intervention details:
   - Therapeutic Exercises: ROM, Active, Active/Assistive, Resistive (Manual/Weights), Stretching
   - Body parts (BLE, BUE, etc.)
   - Repetitions (x10x2 reps format)
   - Sets
   - Duration
   - Assistance levels (I, S, VC, CGA, Min A, Mod A, Max A, Total)
   - Comments

7. BED MOBILITY TRAINING - Extract ALL:
   - Rolling (assistance level and reps)
   - Sup-Sit (assistance level and reps)
   - Scooting Toward (assistance level and reps)
   - Sit to Stand (assistance level and reps)
   - Comments

8. TRANSFER TRAINING - Extract ALL:
   - Transfer Training (reps)
   - Assistive Device (4 wheeled walker, etc.)
   - Bed - Chair (assistance level)
   - Chair - Toilet (assistance level)
   - Chair - Car (assistance level or "Not Tested")
   - Sitting Balance Activities (Static and Dynamic with levels)
   - Standing Balance Activities (Static and Dynamic with levels)
   - Comments

9. GAIT TRAINING - Extract ALL:
   - Ambulation distance (e.g., "20ft")
   - Repetitions
   - Assistive Device
   - Assistance level
   - Gait Quality/Deviation (complete description)
   - Stairs (# of steps, Rail 1, Rail 2)
   - Any gait deviations or quality notes

10. TEACHING - Extract ALL checked items and descriptions:
    - Patient, Caregiver, HEP, Safe Transfer, Safe Gait
    - Breathing techniques (Diaphragmatic Breathing with full description)
    - Energy conservation techniques
    - Hip precautions
    - Any other teaching provided

11. PAIN ASSESSMENT - Extract ALL:
    - Pain level prior to therapy (0-10 scale)
    - Location
    - Pain level after therapy (0-10 scale)
    - Relieved by

12. ASSESSMENT - Extract complete clinical assessment:
    - All documented findings, patient status, clinical observations

13. PLAN - Extract ALL:
    - Continue Prescribed Plan (exact text)
    - Change Prescribed Plan (exact text)
    - Plan Discharge Comments

14. NARRATIVE - Extract complete narrative:
    - All exercise descriptions
    - Interventions provided
    - Education given
    - Complete detailed descriptions

15. PROGRESS MADE TOWARDS GOALS - Extract ALL:
    - Specific improvements documented
    - Goals Met status (checked/unchecked)
    - Detailed progress notes

16. SKILLED TREATMENT PROVIDED - List ALL checked interventions:
    - Therapeutic exercise
    - Balance Training
    - Functional mobility training
    - Teach fall prevention/safety
    - Bed Mobility Training
    - Gait Training
    - Teach safe and effective use of adaptive/assist device
    - Establish/upgrade home exercise
    - Transfer Training
    - Neuromuscular re-education
    - Teach safe stair climbing skills
    - Pt/caregiver education/training
    - Proprioceptive training
    - Relaxation technique
    - Electrical stimulation
    - Ultrasound
    - TENS
    - Postural control training
    - Teach safe and effective breathing technique
    - Pulse oximetry PRN
    - Teach energy conservation techniques
    - Teach hip precaution
    - Any other checked treatments

17. OTHER COMMENTS - Extract any additional comments

18. SIGNATURE - Extract:
    - Clinician name and credentials
    - Date
    - Electronic signature details

⚠️ IMPORTANT: Include ALL extracted details in the "flaggedIssues", "recommendations", and "documentationGaps" sections. Use specific extracted values, not generic descriptions!` : ""

  const prompt = `You are an expert clinical documentation QA specialist. ${typeSpecificPrompt}

⚠️⚠️⚠️ CRITICAL: Extract ALL data from EVERY page of this document! ⚠️⚠️⚠️
- Read through the ENTIRE document text below
- Extract patient info, vital signs, functional assessments, exercises, interventions, goals, progress, and ALL other documented information
- Include specific measurements, repetitions, sets, distances, assistance levels, assistive devices
- Capture all checked items, text fields, and detailed descriptions
- Do NOT skip any important clinical data
${ptNoteExtractionInstructions}

DOCUMENT TO ANALYZE (${documentType.toUpperCase()}) - ALL PAGES:
${extractedText.substring(0, textLimit)}${relatedDocsContext}

⚠️⚠️⚠️ CRITICAL FOR PT VISIT NOTES: You MUST extract ALL detailed information AND provide comprehensive optimization analysis! ⚠️⚠️⚠️

For PT Visit notes, you MUST perform a COMPREHENSIVE AI OPTIMIZATION ANALYSIS:

═══════════════════════════════════════════════════════════════════════════════
🔎 1. MISSING INFORMATION DETECTION
═══════════════════════════════════════════════════════════════════════════════

Analyze and report ALL missing or incomplete fields:

A. HEADER INFORMATION:
   - Missing signature? Date blank? Order # missing?
   - MRN layout inconsistent? Gender not shown?
   - Clinician credential placement issues?

B. VITAL SIGNS:
   - Weight missing unit (lbs/kg)?
   - BP method missing (sitting/standing)?
   - Any vital signs blank or incomplete?

C. THERAPEUTIC EXERCISES:
   - Which exercises have blank reps/sets?
   - Active/Assistive, Resistive Manual, Resistive w/Weights, Stretching - check all
   - Body parts missing? Duration missing?

D. BED MOBILITY TRAINING:
   - Rolling, Sup-Sit, Scooting, Sit-to-Stand - are reps filled in?
   - Assistance levels documented?
   - Comments section used?

E. TRANSFER TRAINING:
   - Transfer out of home environment missing?
   - Safety technique checked but no description?
   - Assist level partially incomplete?
   - Balance activities fully documented?

F. GAIT TRAINING:
   - Stair training count blank?
   - Rail 1/Rail 2 not selected?
   - No assistance level for stairs?
   - No deviation details for stairs?
   - Distance too short without justification?

G. PAIN SECTION:
   - Location is "NA" - why? Missing reason?
   - Pain scale values OK but context missing?
   - Relieved by field blank?

H. ASSESSMENT:
   - Very short and incomplete?
   - Missing clinical reasoning (strength grade, balance grade, gait deviation relation)?
   - No objective metrics documented?

I. PLAN OF CARE:
   - "Continue POC" but lacks:
     * Specific frequency
     * Duration
     * Long-term vs short-term goals
     * Measurable outcomes

J. PROGRESS TOWARD GOALS:
   - Only one improvement listed?
   - Missing full formal goal statement?
   - Missing objective values?
   - Missing comparison baseline?

═══════════════════════════════════════════════════════════════════════════════
⚠️ 2. INCONSISTENCIES & CLINICAL ISSUES
═══════════════════════════════════════════════════════════════════════════════

Detect and report ALL inconsistencies:

A. PATIENT INFORMATION INCONSISTENCIES:
   - Gender inconsistency (he/she mismatch in different sections)?
   - Name spelling variations?
   - Date inconsistencies?

B. CLINICAL INCONSISTENCIES:
   - Vital signs normal but functional status low - missing explanation?
   - Gait training distance too low without justification?
   - Assistance levels inconsistent across similar activities?
   - Pain level doesn't match functional limitations?

C. DOCUMENTATION INCONSISTENCIES:
   - Duplicate narrative information (Subjective and Assessment overlap)?
   - Irrelevant information (e.g., diaphragmatic breathing in PT gait visit)?
   - Assessment language not clinically strong?
   - Progress made toward goals too minimal compared to services provided?

D. TREATMENT INCONSISTENCIES:
   - Many services checked but no evidence they were performed?
   - No link between services and patient condition?
   - HEP insufficient or not detailed?

═══════════════════════════════════════════════════════════════════════════════
📉 3. CLINICAL DOCUMENTATION WEAK POINTS (For Quality Scoring)
═══════════════════════════════════════════════════════════════════════════════

Identify documentation gaps:

A. DOCUMENTATION GAPS:
   - No LTG/STG (long-term / short-term goals)?
   - No measurable benchmarks?
   - No comparison to previous visits?
   - No safety status details (falls? home hazards?)?
   - No medication changes affecting weakness/fatigue?

B. SKILLED INTERVENTION NOT JUSTIFIED:
   - Services checked but no evidence performed?
   - No link to patient condition?
   - Missing skilled need justification?

C. HOME EXERCISE PROGRAM INSUFFICIENT:
   - HEP not detailed?
   - Simply listing AROM reps is not a full program?
   - Missing frequency, duration, progression?

D. RISK FACTORS EXPLANATION MISSING:
   - Patient shows shuffling gait, lateral lean, knee buckling
   - But no fall risk score or test documented (TUG, BERG, etc.)?
   - No safety assessment documented?

═══════════════════════════════════════════════════════════════════════════════
✨ 4. OPTIMIZATION SUGGESTIONS
═══════════════════════════════════════════════════════════════════════════════

For each section, provide:
- Current state (what's documented)
- Suggested improvements (what should be added/changed)
- Clinical rationale (why the improvement is needed)
- Expected impact (outcome, compliance, safety, etc.)

1. EXTRACT all data from these sections (populate extractedPTData):
   - Homebound Reasons: Extract ALL checked items (☒) - list each reason with checked: true
   - Functional Limitations: Extract ALL checked items (☒) - list each limitation with checked: true
   - Vital Signs: Extract SBP, DBP, HR, Resp, Temp, Weight, O2 Sat with exact values
   - Functional Mobility Key: Extract assistance level definitions (I, S, VC, CGA, Min A, Mod A, Max A, Total)
   - Bed Mobility Training: Extract rolling, sup-sit, scooting, sit to stand with assistance levels and reps
   - Transfer Training: Extract bed-chair, chair-toilet, chair-car with assistance levels, assistive device, balance activities
   - Gait Training: Extract distance, assistive device, assistance level, gait quality/deviations (full text), stairs
   - Skilled Treatment Provided: Extract ALL checked interventions with checked: true
   - Teaching: Extract patient, caregiver, HEP, safe transfer, safe gait, breathing techniques
   - Pain Assessment: Extract before/after levels, location, relieved by
   - Assessment, Plan, Narrative, Progress toward goals: Extract complete text

2. ANALYZE and OPTIMIZE each section (populate ptOptimizations):
   - Compare current documentation with best practices and evidence-based guidelines
   - Identify missing or incomplete documentation that should be added
   - Suggest improvements for better patient outcomes, safety, and compliance
   - Provide clinical rationale for each optimization based on patient's condition and functional status
   - For assistance levels: Suggest progression or appropriate levels based on patient status
   - For exercises: Suggest appropriate progressions, repetitions, or modifications
   - For skilled treatment: Suggest additional interventions that may benefit the patient
   - For documentation: Suggest improvements to meet regulatory requirements

3. Populate arrays with ACTUAL extracted data and analysis:
   - "missingElements": ALL missing fields organized by section (Header, Vital Signs, Exercises, Bed Mobility, Transfer, Gait, Pain, Assessment, Plan, Progress)
   - "flaggedIssues": ALL inconsistencies detected (gender, clinical, documentation, treatment)
   - "documentationGaps": ALL documentation weak points (goals, benchmarks, safety, HEP, risk factors)
   - "recommendations": Specific actionable recommendations for each issue found
   - "riskFactors": Risk factors identified with severity and mitigation strategies

DO NOT return empty arrays! You MUST find and report issues, inconsistencies, and gaps!

Return ONLY a valid JSON object with this structure (no markdown, no extra text):
{
  "patientInfo": {
    "name": "EXTRACT actual patient name from document (e.g., 'Coles, Phyllis E.')",
    "mrn": "EXTRACT actual MRN from document (e.g., 'PHYLLIS09032025') - look for 'MRN:' field",
    "visitDate": "EXTRACT visit date (e.g., '10/28/2025')",
    "clinician": "EXTRACT clinician name from signature (e.g., 'Viral Shah')",
    "clinicianType": "PT"
  },
  "qualityScores": {"overall": 85, "completeness": 90, "accuracy": 88, "compliance": 92, "confidence": 87},
  "diagnoses": [{"code": "string", "description": "string", "confidence": 85, "source": "documented"}],
  "suggestedCodes": [{"code": "string", "description": "string", "reason": "string", "revenueImpact": 500, "confidence": 85}],
  "corrections": [{"field": "string", "current": "string", "suggested": "string", "reason": "string", "impact": "string", "revenueChange": 200}],
  "missingElements": [
    {
      "section": "Header Information",
      "element": "Signature (blank)",
      "category": "required",
      "severity": "high",
      "recommendation": "Add clinician signature with credentials"
    },
    {
      "section": "Vital Signs",
      "element": "Weight lacks unit context (lbs/kg?)",
      "category": "data quality",
      "severity": "medium",
      "recommendation": "Specify weight unit (lbs or kg)"
    },
    {
      "section": "Therapeutic Exercises",
      "element": "Active/Assistive to _____ x _____ reps (blanks)",
      "category": "incomplete",
      "severity": "high",
      "recommendation": "Fill in all exercise repetitions and sets"
    }
  ],
  "flaggedIssues": [
    {
      "issue": "Gender inconsistency detected - Page 1: 'He feels difficulty walking' vs Page 4: 'She feels difficulty in exercises'",
      "severity": "high",
      "location": "Patient information across pages",
      "suggestion": "Review and correct gender pronouns throughout document",
      "category": "inconsistency"
    },
    {
      "issue": "Vital signs normal but functional status low - Missing explanation for clinical mismatch",
      "severity": "medium",
      "location": "Vital Signs vs Functional Status",
      "suggestion": "Add clinical explanation (orthopedic? neuro? pain?) for why functional mobility requires Min A & CGA despite stable vitals",
      "category": "clinical"
    },
    {
      "issue": "Gait training distance too low (20ft) without justification",
      "severity": "medium",
      "location": "Gait Training section",
      "suggestion": "Document reason for extremely short walk distance or increase to 50-100ft for patient with 4-wheel walker",
      "category": "clinical"
    },
    {
      "issue": "Duplicate narrative information - Subjective and Assessment overlap",
      "severity": "low",
      "location": "Subjective and Assessment sections",
      "suggestion": "Consolidate or differentiate information between sections",
      "category": "documentation"
    },
    {
      "issue": "Assessment language not clinically strong - Missing objective metrics (strength grade, ROM limitation, gait speed, balance grade)",
      "severity": "high",
      "location": "Assessment section",
      "suggestion": "Add objective metrics: strength grade, ROM measurements, gait speed, balance grade",
      "category": "documentation"
    },
    {
      "issue": "Progress made toward goals too minimal - Only 1 goal updated but patient received multiple services",
      "severity": "medium",
      "location": "Progress Toward Goals section",
      "suggestion": "Document progress across all categories: gait training, balance training, transfers, therapeutic exercise",
      "category": "documentation"
    }
  ],
  "riskFactors": [
    {
      "factor": "Patient shows shuffling gait, lateral lean, knee buckling but no fall risk score documented",
      "severity": "high",
      "recommendation": "Perform and document fall risk assessment (TUG, BERG, etc.)",
      "mitigation": "Document fall risk score and implement appropriate safety measures"
    },
    {
      "factor": "No safety status details (falls? home hazards?)",
      "severity": "medium",
      "recommendation": "Document safety assessment including fall history and home environment hazards",
      "mitigation": "Complete safety assessment and document findings"
    }
  ],
  "recommendations": [
    {
      "category": "Documentation",
      "recommendation": "Add LTG/STG (long-term / short-term goals) with measurable benchmarks",
      "priority": "high",
      "expectedImpact": "Improved care planning and regulatory compliance"
    },
    {
      "category": "Clinical",
      "recommendation": "Add comparison to previous visits with objective values",
      "priority": "high",
      "expectedImpact": "Better tracking of patient progress"
    },
    {
      "category": "Documentation",
      "recommendation": "Justify skilled interventions - link services to patient condition",
      "priority": "high",
      "expectedImpact": "Regulatory compliance and reimbursement support"
    },
    {
      "category": "Clinical",
      "recommendation": "Expand HEP - provide detailed program with frequency, duration, progression, not just AROM reps",
      "priority": "medium",
      "expectedImpact": "Better patient outcomes and compliance"
    }
  ],
  "regulatoryIssues": [
    {
      "regulation": "CMS Therapy Documentation Requirements",
      "issue": "Skilled intervention not justified - services checked but no evidence they were performed",
      "severity": "high",
      "remediation": "Document evidence of each skilled service provided and link to patient condition"
    },
    {
      "regulation": "Medicare Documentation Requirements",
      "issue": "Missing measurable outcomes and benchmarks",
      "severity": "medium",
      "remediation": "Add measurable outcomes with baseline and current values"
    }
  ],
  "documentationGaps": [
    {
      "gap": "No LTG/STG (long-term / short-term goals)",
      "impact": "Cannot track progress or demonstrate skilled need",
      "recommendation": "Add formal long-term and short-term goals with measurable outcomes"
    },
    {
      "gap": "No measurable benchmarks",
      "impact": "Cannot demonstrate patient progress or treatment effectiveness",
      "recommendation": "Add objective measurements (strength grades, ROM, gait speed, balance scores)"
    },
    {
      "gap": "No comparison to previous visits",
      "impact": "Cannot demonstrate improvement or skilled need",
      "recommendation": "Compare current visit to previous visit with specific objective values"
    },
    {
      "gap": "No safety status details (falls? home hazards?)",
      "impact": "Missing critical safety information",
      "recommendation": "Document fall history, home environment assessment, and safety concerns"
    },
    {
      "gap": "No medication changes affecting weakness/fatigue",
      "impact": "Missing context for patient's functional limitations",
      "recommendation": "Document medication changes and their impact on patient function"
    },
    {
      "gap": "HEP insufficient - simply listing AROM reps is not a full program",
      "impact": "Patient may not have adequate home program",
      "recommendation": "Provide detailed HEP with exercises, frequency, duration, progression, and safety precautions"
    },
    {
      "gap": "No fall risk score or test documented (TUG, BERG, etc.) despite gait deviations",
      "impact": "Missing objective fall risk assessment",
      "recommendation": "Perform and document standardized fall risk assessment (TUG, BERG, Functional Reach)"
    }
  ],
  "financialImpact": {
    "currentRevenue": 3500,
    "optimizedRevenue": 4200,
    "increase": 700,
    "breakdown": [{"category": "string", "current": 1000, "optimized": 1200, "difference": 200}]
  },
  "extractedPTData": {
    "homeboundReasons": [{"reason": "Extracted reason text", "checked": true}],
    "functionalLimitations": [{"limitation": "Extracted limitation text", "checked": true}],
    "vitalSigns": {"sbp": 136, "dbp": 74, "hr": 84, "resp": 18, "temp": "97.7F", "o2Sat": "96% RA"},
    "functionalMobilityKey": {"independent": "I", "supervision": "S", "verbalCue": "VC", "contactGuardAssist": "CGA", "minAssist": "Min A = 25% Assist", "modAssist": "Mod A = 50% Assist", "maxAssist": "Max A = 75% Assist", "totalAssist": "Total = 100% Assist"},
    "bedMobilityTraining": {"rolling": {"level": "I = Independent", "reps": "x ___ reps"}, "supSit": {"level": "I = Independent", "reps": "x ___ reps"}, "scooting": {"level": "I = Independent", "reps": "x ___ reps"}, "sitToStand": {"level": "I = Independent", "reps": "x ___ reps"}},
    "transferTraining": {"reps": "X 2 reps", "assistiveDevice": "4 wheeled walker", "bedChair": {"level": "CGA = Contact Guard Assist"}, "chairToilet": {"level": "Min A = 25% Assist"}, "chairCar": {"level": "Not Tested"}, "sittingBalance": {"static": "G = Maintain static sitting/standing with moderate challenges", "dynamic": "G = Maintain dynamic sitting/standing balance through moderate excursions"}, "standingBalance": {"static": "F = Able to sit/stand unsupported", "dynamic": "F- = Maintain dynamic sitting/standing balance through minimal excursions with CG assist"}},
    "gaitTraining": {"distance": "20ft", "reps": "x1 reps", "assistiveDevice": "4 wheeled walker", "assistanceLevel": "Min A = 25% Assist", "qualityDeviation": "Patient is having slow and shuffling gait with decrease trunk rotation with lateral lean with sometimes buckling of knees with uneven step and stride length with decreased cadence"},
    "skilledTreatmentProvided": [{"treatment": "Therapeutic exercise", "checked": true}, {"treatment": "Balance Training", "checked": true}],
    "teaching": {"patient": true, "caregiver": false, "hep": true, "safeTransfer": true, "safeGait": true, "breathingTechniques": "Diaphragmatic Breathing with full description"},
    "painAssessment": {"levelBefore": 0, "location": "NA", "levelAfter": 0},
    "assessment": "Extracted assessment text",
    "plan": {"continuePlan": "cont POC with focus on muscle strengthening exes for BLE", "dischargeComments": "when goals are met"},
    "narrative": "Extracted narrative text with exercise descriptions",
    "progressTowardGoals": {"improvements": "improved sit to stand assistance level from VC to IND", "goalsMet": false}
  },
  "ptOptimizations": {
    "homeboundReasons": {"current": ["Extracted reasons"], "suggested": ["Additional reasons that may apply"], "rationale": "Clinical justification"},
    "functionalLimitations": {"current": ["Extracted limitations"], "suggested": ["Additional limitations to document"], "rationale": "Clinical justification"},
    "bedMobility": {"current": {"rolling": "I", "sitToStand": "I"}, "suggested": {"rolling": "S or CGA", "sitToStand": "Min A"}, "rationale": "Based on patient's functional status and safety needs"},
    "transferTraining": {"current": {"bedChair": "CGA", "chairToilet": "Min A"}, "suggested": {"bedChair": "CGA (appropriate)", "chairToilet": "CGA (improve independence)"}, "rationale": "Optimization based on patient progress and safety"},
    "gaitTraining": {"current": {"distance": "20ft", "assistanceLevel": "Min A"}, "suggested": {"distance": "50ft (progressive)", "assistanceLevel": "CGA (improve)"}, "rationale": "Progressive gait training recommendations"},
    "skilledTreatment": {"current": ["Current treatments"], "suggested": ["Additional treatments to consider"], "rationale": "Evidence-based treatment recommendations"},
    "documentationImprovements": [{"section": "Bed Mobility", "current": "Limited documentation", "suggested": "Add specific measurements and progress notes", "rationale": "Better documentation supports skilled need"}]
  }
}`

  try {
    console.log(`[v0] Analyzing ${documentType} document with OpenAI...`)

    // For PT notes, allow more tokens for detailed extraction
    const maxTokens = documentType === "pt_note" ? 8000 : 4000

    const { text } = await generateText({
      model: openai("gpt-4o-mini"), // Using GPT-4o-mini - same as OASIS analyzer
      prompt,
      temperature: 0.2,
      maxTokens: maxTokens,
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
      extractedPTData: analysis.extractedPTData || undefined,
      ptOptimizations: analysis.ptOptimizations || undefined,
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
