import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import {
  calculateHIPPS,
  calculateOptimizedRevenue,
  calculateFunctionalScore,
  type FunctionalStatusScores,
  type HIPPSResult
} from "./hipps-calculator"

// ✅ Use Gemini as primary AI (faster, more reliable for long documents)
// ✅ Use OpenAI as primary (more accurate for medical documents)
const useGemini = false // OpenAI only - Gemini requires billing

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
  activeDiagnoses?: Array<{
    code: string
    description: string
    active: boolean
  }>
  // Functional Status Items (M1800-M1870)
  functionalStatus?: Array<{
    item: string
    currentValue: string
    currentDescription: string
    suggestedValue?: string
    suggestedDescription?: string
    clinicalRationale?: string
  }>
  // Medication Management (M2001-M2030) - Same format as Functional Status
  medications?: Array<{
    item: string                    // e.g., "M2001 - Drug Regimen Review" or "M2020 - Management of Oral Medications"
    currentValue: string            // e.g., "0", "1", "2", "N/A"
    currentDescription: string      // e.g., "No - No issues found during review"
    suggestedValue?: string         // AI suggested value if optimization possible
    suggestedDescription?: string   // Description for suggested value
    clinicalRationale?: string      // Clinical reasoning for suggestion
  }>
  // Pain Status Section
  painStatus?: Array<{
    item: string                    // e.g., "Pain Location", "Pain Intensity", "Pain Frequency"
    currentValue: string            // e.g., "Back", "7/10", "Daily"
    currentDescription: string      // Full description from Pain Status section
    suggestedValue?: string         // AI suggested value if optimization possible
    suggestedDescription?: string   // Description for suggested value
    clinicalRationale?: string      // Clinical reasoning for suggestion
  }>
  // Integumentary Status Section
  integumentaryStatus?: Array<{
    item: string                    // e.g., "Skin Condition", "Wounds", "Pressure Ulcers"
    currentValue: string            
    currentDescription: string      
    suggestedValue?: string         
    suggestedDescription?: string   
    clinicalRationale?: string      
  }>
  // Respiratory Status Section
  respiratoryStatus?: Array<{
    item: string                    // e.g., "Breath Sounds", "Oxygen Use", "Dyspnea"
    currentValue: string            
    currentDescription: string      
    suggestedValue?: string         
    suggestedDescription?: string   
    clinicalRationale?: string      
  }>
  // Cardiac Status Section
  cardiacStatus?: Array<{
    item: string                    // e.g., "Heart Rate", "Blood Pressure", "Edema"
    currentValue: string            
    currentDescription: string      
    suggestedValue?: string         
    suggestedDescription?: string   
    clinicalRationale?: string      
  }>
  // Elimination Status Section
  eliminationStatus?: Array<{
    item: string                    // e.g., "Bowel", "Bladder", "Continence"
    currentValue: string            
    currentDescription: string      
    suggestedValue?: string         
    suggestedDescription?: string   
    clinicalRationale?: string      
  }>
  // Neuro/Emotional/Behavioral Status Section
  neuroEmotionalBehavioralStatus?: Array<{
    item: string                    // e.g., "Neurological Status", "Emotional State", "Behavioral Issues"
    currentValue: string            
    currentDescription: string      
    suggestedValue?: string         
    suggestedDescription?: string   
    clinicalRationale?: string      
  }>
  // Emotional Status (if separate section)
  emotionalStatus?: Array<{
    item: string                    
    currentValue: string            
    currentDescription: string      
    suggestedValue?: string         
    suggestedDescription?: string   
    clinicalRationale?: string      
  }>
  // Behavioral Status (if separate section)
  behavioralStatus?: Array<{
    item: string                    
    currentValue: string            
    currentDescription: string      
    suggestedValue?: string         
    suggestedDescription?: string   
    clinicalRationale?: string      
  }>
  // Extracted Data with additional OASIS fields
  extractedData?: {
    primaryDiagnosis?: any
    otherDiagnoses?: any[]
    oasisCorrections?: Array<{
      item: string
      currentValue: string
      suggestedValue: string
      rationale: string
    }>
    qualityMeasures?: Array<{
      measure: string
      status: string
      notes: string
    }>
    functionalStatus?: any[]
  }
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
  // Missing Information
  missingInformation?: Array<{
    field: string
    location: string
    impact: string
    recommendation: string
    required: boolean
  }>
  // Inconsistencies
  inconsistencies?: Array<{
    sectionA: string
    sectionB: string
    conflictType: string
    severity: string
    recommendation: string
    clinicalImpact: string
  }>
  // Comprehensive QA Review (Section C)
  qaReview?: {
    qualityScore: number
    issues: Array<{
      issue: string
      severity: string
      location: string
      recommendation: string
    }>
  }
  // Coding Review (Section D)
  codingReview?: {
    errors: Array<{
      error: string
      severity: string
      recommendation: string
    }>
    suggestions: Array<{
      code: string
      description: string
      reason: string
      revenueImpact: number
      clinicalRationale?: string
      documentationSupport?: string
    }>
    validatedCodes?: Array<{
      code: string
      description: string
      validationStatus: 'valid' | 'needs-review' | 'invalid'
      issues?: string[]
      recommendation?: string
    }>
    missingDiagnoses?: Array<{
      condition: string
      suggestedCode: string
      codeDescription: string
      medicalNecessity: string
      documentationSupport: string
      revenueImpact?: number
      comorbidityLevel?: 'low' | 'medium' | 'high'
      clinicalGroup?: string
    }>
    primaryDiagnosisOptimization?: Array<{
      currentCode: string
      suggestedCode: string
      currentDescription: string
      suggestedDescription: string
      reason: string
      documentationSupport: string
      currentClinicalGroup?: string
      suggestedClinicalGroup?: string
      revenueImpact?: number
      clinicalRationale?: string
    }>
    comorbidityOptimization?: {
      currentLevel: 'low' | 'medium' | 'high'
      suggestedLevel: 'low' | 'medium' | 'high'
      currentDiagnosisCount: number
      suggestedDiagnosisCount: number
      missingComorbidities: Array<{
        condition: string
        suggestedCode: string
        documentationSupport: string
        revenueImpact?: number
        comorbidityContribution?: string
      }>
      revenueImpact?: number
    }
  }
  // Financial Optimization (Section E)
  financialOptimization?: {
    currentRevenue: number
    optimizedRevenue: number
    breakdown: Array<{
      category: string
      current: number
      optimized: number
      difference: number
    }>
    documentationImpact?: Array<{
      documentationType: string
      impact: 'case-mix' | 'lupa' | 'reimbursement' | 'all'
      description: string
      revenueImpact: number
      recommendation: string
    }>
    missingFunctionalDeficits?: Array<{
      deficit: string
      location: string
      currentStatus: string
      suggestedDocumentation: string
      revenueImpact: number
      clinicalJustification: string
    }>
    improvements?: Array<{
      improvement: string
      category: 'documentation' | 'functional-status' | 'lupa-reduction' | 'therapy' | 'reimbursement'
      currentState: string
      suggestedState: string
      revenueImpact: number
      actionableSteps: string[]
      priority: 'high' | 'medium' | 'low'
    }>
  }
  // QAPI Audit (Section F)
  qapiAudit?: {
    deficiencies: Array<{
      deficiency: string
      category: string
      severity: string
      rootCause: string
      recommendation: string
    }>
    recommendations: Array<{
      category: string
      recommendation: string
      priority: string
    }>
    regulatoryDeficiencies?: Array<{
      deficiency: string
      regulation: string
      severity: 'critical' | 'high' | 'medium' | 'low'
      description: string
      impact: string
      recommendation: string
      correctiveAction: string
    }>
    planOfCareReview?: {
      completeness: 'complete' | 'incomplete' | 'missing'
      issues: Array<{
        issue: string
        location: string
        severity: string
        recommendation: string
      }>
      goals?: Array<{
        goal: string
        status: 'met' | 'in-progress' | 'not-met' | 'missing'
        issues?: string[]
        recommendation?: string
      }>
      riskMitigation?: Array<{
        risk: string
        mitigationStrategy: string
        status: 'documented' | 'missing' | 'inadequate'
        recommendation?: string
      }>
      safetyInstructions?: Array<{
        instruction: string
        status: 'present' | 'missing' | 'unclear'
        location: string
        recommendation?: string
      }>
    }
    incompleteElements?: Array<{
      element: string
      location: string
      missingInformation: string
      impact: string
      recommendation: string
      priority: 'high' | 'medium' | 'low'
    }>
    contradictoryElements?: Array<{
      elementA: string
      elementB: string
      contradiction: string
      location: string
      impact: string
      recommendation: string
      severity: 'critical' | 'high' | 'medium' | 'low'
    }>
  }
  // Debug Info
  debugInfo?: any
  qualityScore: number
  confidenceScore: number
  completenessScore: number
  financialImpact: {
    currentRevenue: number
    optimizedRevenue: number
    increase: number
    percentIncrease: number
    // HIPPS Details
    currentHipps?: string
    optimizedHipps?: string
    currentFunctionalScore?: number
    optimizedFunctionalScore?: number
    currentFunctionalLevel?: string
    optimizedFunctionalLevel?: string
    currentCaseMix?: number
    optimizedCaseMix?: number
    currentWeightedRate?: number
    optimizedWeightedRate?: number
    clinicalGroup?: string
    clinicalGroupName?: string
    admissionSource?: string
    timing?: string
    comorbidityLevel?: string
    breakdown: Array<{
      category: string
      current: number
      optimized: number
      difference: number
    }>
  }
  // Advanced Optimization Features
  comorbidityOpportunities?: {
    currentLevel: "None" | "Low" | "Medium" | "High"
    suggestedDiagnoses: Array<{
      code: string
      description: string
      revenueImpact: number
      supportingEvidence: string
      documentationNeeded: string
      confidence: number
    }>
    potentialIncrease: number
  }
  lupaRiskAnalysis?: {
    estimatedVisitCount: number
    threshold: number
    isAtRisk: boolean
    riskLevel: "Safe" | "Warning" | "High Risk" | "Critical"
    potentialPenalty: number
    recommendation: string
  }
  therapyThresholdAnalysis?: {
    currentTherapyVisits: number
    currentThreshold: string
    suggestedThreshold: string
    revenueImpact: number
    eligibilityCriteria: string[]
    recommendation: string
  }
  priorityActions?: Array<{
    rank: number
    action: string
    category: "Functional Status" | "Diagnosis" | "Visit Count" | "Therapy" | "Documentation"
    impact: "Critical" | "High" | "Medium" | "Low"
    revenueImpact: number
    timeRequired: string
    difficulty: "Easy" | "Medium" | "Hard"
    specificSteps: string[]
  }>
  documentationQualityScore?: {
    overallScore: number
    breakdown: {
      completeness: number
      accuracy: number
      clinicalJustification: number
      revenueOptimization: number
    }
    benchmarkComparison: "Top Quartile" | "Above Average" | "Average" | "Below Average" | "Needs Improvement"
    improvementAreas: Array<{
      area: string
      currentScore: number
      targetScore: number
      potentialGain: number
      recommendations: string[]
    }>
  }
}

// Function to validate extracted data against source text (prevent AI hallucination)
function validateExtractionAccuracy(analysis: OasisAnalysisResult, sourceText: string): OasisAnalysisResult {
  console.log("[OASIS] 🔍 Validating extraction accuracy against source document...")
  
  // Check if this is an OASIS form
  const isOASISForm = sourceText.includes('OASIS') || 
                      sourceText.includes('M1800') || 
                      sourceText.includes('M1810') ||
                      sourceText.includes('Functional Status')
  
  console.log(`[OASIS] Document type: ${isOASISForm ? 'OASIS Form' : 'Non-OASIS Document (will extract available data)'}`)
  
  // Validate functional status items against source
  // IMPORTANT: We validate each item, NOT clear everything if not OASIS form
  if (analysis.functionalStatus && analysis.functionalStatus.length > 0) {
    const originalCount = analysis.functionalStatus.length
    
    analysis.functionalStatus = analysis.functionalStatus.filter(item => {
      // Extract item code (e.g., "M1800" from "M1800 - Grooming")
      const itemCode = item.item.split(' - ')[0].trim()
      const foundInSource = sourceText.includes(itemCode)
      
      // ONLY remove if item code is NOT found in source AND it's not an OASIS form
      if (!foundInSource && !isOASISForm) {
        console.warn(`[OASIS] ⚠️ ${itemCode} not found in non-OASIS document - removing fabricated data`)
        return false
      }
      
      // Keep all items that are found in source
      return foundInSource
    })
    
    const removedCount = originalCount - analysis.functionalStatus.length
    if (removedCount > 0) {
      console.log(`[OASIS] ✅ Removed ${removedCount} fabricated/unverified functional status items`)
    }
    console.log(`[OASIS] ✅ Kept ${analysis.functionalStatus.length} verified functional status items`)
  }
  
  // Validate patient info - keep if found in source
  if (analysis.patientInfo) {
    console.log('[OASIS] 📋 Patient info:', {
      name: analysis.patientInfo.name ? 'Found' : 'Not found',
      mrn: analysis.patientInfo.mrn ? 'Found' : 'Not found',
      visitDate: analysis.patientInfo.visitDate ? 'Found' : 'Not found'
    })
  }
  
  // Validate diagnosis codes - keep if found in source
  if (analysis.primaryDiagnosis?.code && analysis.primaryDiagnosis.code !== "Not visible") {
    console.log('[OASIS] 🏥 Primary diagnosis found:', analysis.primaryDiagnosis.code)
  }
  
  if (analysis.secondaryDiagnoses && analysis.secondaryDiagnoses.length > 0) {
    console.log('[OASIS] 🏥 Secondary diagnoses found:', analysis.secondaryDiagnoses.length)
  }
  
  // Validate medications - preserve all medications found
  if (analysis.medications && analysis.medications.length > 0) {
    console.log('[OASIS] 💊 Medications found:', analysis.medications.length)
    // Log each medication for debugging
    analysis.medications.forEach((med, idx) => {
      console.log(`[OASIS] 💊 Med ${idx + 1}: item="${med?.item}", value="${med?.currentValue}", desc="${med?.currentDescription?.substring(0, 50)}..."`)
    })
    
    // Keep medications that have valid item names (especially OASIS codes M2001, M2010, M2020, M2030)
    // Also keep actual medication names (e.g., "Metformin 500mg")
    const beforeFilterCount = analysis.medications.length
    analysis.medications = analysis.medications.filter(med => {
      if (!med || !med.item) {
        console.log(`[OASIS] ⚠️ Filtering out medication with no item`)
        return false
      }
      const item = med.item.trim()
      if (item === "" || item === "Not visible" || item === "Not found") {
        console.log(`[OASIS] ⚠️ Filtering out medication with invalid item: "${item}"`)
        return false
      }
      
      // Always keep OASIS medication fields (M2001, M2010, M2020, M2030)
      if (item.includes("M2001") || item.includes("M2010") || item.includes("M2020") || item.includes("M2030") || item.includes("N0415")) {
        console.log(`[OASIS] ✅ Keeping OASIS medication field: ${item} = ${med.currentValue}`)
        return true
      }
      
      // Keep if has valid currentValue (not "Not visible" or "Not found")
      if (med.currentValue && 
          med.currentValue !== "Not visible" && 
          med.currentValue !== "Not found" &&
          med.currentValue.trim() !== "") {
        console.log(`[OASIS] ✅ Keeping medication with valid value: ${item} = ${med.currentValue}`)
        return true
      }
      
      // Keep if item name looks like a real medication (not placeholder)
      if (item.length > 3 && !item.includes("Not ") && !item.includes("OASIS Medication")) {
        console.log(`[OASIS] ✅ Keeping medication by name: ${item}`)
        return true
      }
      
      console.log(`[OASIS] ⚠️ Filtering out: ${item}`)
      return false
    })
    console.log(`[OASIS] 💊 Medication filtering: ${beforeFilterCount} → ${analysis.medications.length} items`)
  } else {
    console.log('[OASIS] ⚠️ No medications found in analysis')
  }
  
  // Validate Pain Status - preserve all pain items found
  if (analysis.painStatus && analysis.painStatus.length > 0) {
    console.log('[OASIS] 🩹 Pain Status found:', analysis.painStatus.length)
    analysis.painStatus.forEach((pain, idx) => {
      console.log(`[OASIS] 🩹 Pain ${idx + 1}: item="${pain?.item}", value="${pain?.currentValue}", desc="${pain?.currentDescription?.substring(0, 50)}..."`)
    })
    
    const beforeFilterCount = analysis.painStatus.length
    analysis.painStatus = analysis.painStatus.filter(pain => {
      if (!pain || !pain.item) return false
      const item = pain.item.trim()
      if (item === "" || item === "Not found") return false
      
      // Keep all Pain Status items - even if "Not visible"
      if (pain.currentValue && pain.currentValue.trim() !== "") {
        console.log(`[OASIS] ✅ Keeping Pain Status item: ${item} = ${pain.currentValue}`)
        return true
      }
      
      if (item.length > 3 && item.toLowerCase().includes("pain")) {
        console.log(`[OASIS] ✅ Keeping Pain Status by name: ${item}`)
        return true
      }
      
      return false
    })
    console.log(`[OASIS] 🩹 Pain Status filtering: ${beforeFilterCount} → ${analysis.painStatus.length} items`)
  } else {
    console.log('[OASIS] ⚠️ No Pain Status data found')
  }
  
  // Validate Integumentary Status
  if (analysis.integumentaryStatus && analysis.integumentaryStatus.length > 0) {
    console.log('[OASIS] 🩹 Integumentary Status found:', analysis.integumentaryStatus.length)
    const beforeCount = analysis.integumentaryStatus.length
    analysis.integumentaryStatus = analysis.integumentaryStatus.filter(item => 
      item && item.item && item.item.trim() !== "" && item.item !== "Not found"
    )
    console.log(`[OASIS] 🩹 Integumentary Status: ${beforeCount} → ${analysis.integumentaryStatus.length} items`)
  }
  
  // Validate Respiratory Status
  if (analysis.respiratoryStatus && analysis.respiratoryStatus.length > 0) {
    console.log('[OASIS] 🫁 Respiratory Status found:', analysis.respiratoryStatus.length)
    const beforeCount = analysis.respiratoryStatus.length
    analysis.respiratoryStatus = analysis.respiratoryStatus.filter(item => 
      item && item.item && item.item.trim() !== "" && item.item !== "Not found"
    )
    console.log(`[OASIS] 🫁 Respiratory Status: ${beforeCount} → ${analysis.respiratoryStatus.length} items`)
  }
  
  // Validate Cardiac Status
  if (analysis.cardiacStatus && analysis.cardiacStatus.length > 0) {
    console.log('[OASIS] ❤️ Cardiac Status found:', analysis.cardiacStatus.length)
    const beforeCount = analysis.cardiacStatus.length
    analysis.cardiacStatus = analysis.cardiacStatus.filter(item => 
      item && item.item && item.item.trim() !== "" && item.item !== "Not found"
    )
    console.log(`[OASIS] ❤️ Cardiac Status: ${beforeCount} → ${analysis.cardiacStatus.length} items`)
  }
  
  // Validate Elimination Status
  if (analysis.eliminationStatus && analysis.eliminationStatus.length > 0) {
    console.log('[OASIS] 🚽 Elimination Status found:', analysis.eliminationStatus.length)
    const beforeCount = analysis.eliminationStatus.length
    analysis.eliminationStatus = analysis.eliminationStatus.filter(item => 
      item && item.item && item.item.trim() !== "" && item.item !== "Not found"
    )
    console.log(`[OASIS] 🚽 Elimination Status: ${beforeCount} → ${analysis.eliminationStatus.length} items`)
  }
  
  // Validate Neuro/Emotional/Behavioral Status
  if (analysis.neuroEmotionalBehavioralStatus && analysis.neuroEmotionalBehavioralStatus.length > 0) {
    console.log('[OASIS] 🧠 Neuro/Emotional/Behavioral Status found:', analysis.neuroEmotionalBehavioralStatus.length)
    const beforeCount = analysis.neuroEmotionalBehavioralStatus.length
    analysis.neuroEmotionalBehavioralStatus = analysis.neuroEmotionalBehavioralStatus.filter(item => 
      item && item.item && item.item.trim() !== "" && item.item !== "Not found"
    )
    console.log(`[OASIS] 🧠 Neuro/Emotional/Behavioral: ${beforeCount} → ${analysis.neuroEmotionalBehavioralStatus.length} items`)
  }
  
  // Validate Emotional Status (if separate)
  if (analysis.emotionalStatus && analysis.emotionalStatus.length > 0) {
    console.log('[OASIS] 😊 Emotional Status found:', analysis.emotionalStatus.length)
    const beforeCount = analysis.emotionalStatus.length
    analysis.emotionalStatus = analysis.emotionalStatus.filter(item => 
      item && item.item && item.item.trim() !== "" && item.item !== "Not found"
    )
    console.log(`[OASIS] 😊 Emotional Status: ${beforeCount} → ${analysis.emotionalStatus.length} items`)
  }
  
  // Validate Behavioral Status (if separate)
  if (analysis.behavioralStatus && analysis.behavioralStatus.length > 0) {
    console.log('[OASIS] 🎭 Behavioral Status found:', analysis.behavioralStatus.length)
    const beforeCount = analysis.behavioralStatus.length
    analysis.behavioralStatus = analysis.behavioralStatus.filter(item => 
      item && item.item && item.item.trim() !== "" && item.item !== "Not found"
    )
    console.log(`[OASIS] 🎭 Behavioral Status: ${beforeCount} → ${analysis.behavioralStatus.length} items`)
  }
  
  console.log(`[OASIS] ✅ Validation complete - Functional: ${analysis.functionalStatus?.length || 0}, Medications: ${analysis.medications?.length || 0}, Pain: ${analysis.painStatus?.length || 0}, Integumentary: ${analysis.integumentaryStatus?.length || 0}, Respiratory: ${analysis.respiratoryStatus?.length || 0}, Cardiac: ${analysis.cardiacStatus?.length || 0}, Elimination: ${analysis.eliminationStatus?.length || 0}, Neuro/Emotional/Behavioral: ${analysis.neuroEmotionalBehavioralStatus?.length || 0}`)
  
  return analysis
}

// Function to detect missing required OASIS fields
function detectMissingRequiredFields(analysis: OasisAnalysisResult): OasisAnalysisResult {
  console.log("[OASIS] 🔍 Detecting missing required fields...")
  
  const missingFields: Array<{
    field: string
    location: string
    impact: string
    recommendation: string
    required: boolean
  }> = []
  
  // Check Primary Diagnosis
  if (!analysis.primaryDiagnosis?.code || 
      analysis.primaryDiagnosis.code === "Not visible" ||
      analysis.primaryDiagnosis.code === "Z99.89") {
    console.log("[OASIS] ❌ Missing: Primary Diagnosis")
    missingFields.push({
      field: "Primary Diagnosis Code (M1021)",
      location: "Section M1021 - Diagnosis Codes (typically pages 3-5 of OASIS form)",
      impact: "CRITICAL - Primary diagnosis is required for Medicare billing and case mix calculation. Without this, the claim cannot be processed.",
      recommendation: "Review the OASIS document and locate M1021 Primary Diagnosis section. Enter the appropriate ICD-10 code that represents the primary reason for home health services.",
      required: true,
    })
  }
  
  // Check Secondary Diagnoses
  if (!analysis.secondaryDiagnoses || analysis.secondaryDiagnoses.length === 0) {
    console.log("[OASIS] ❌ Missing: Secondary Diagnoses")
    missingFields.push({
      field: "Secondary Diagnoses (M1023)",
      location: "Section M1023 - Other Diagnoses (typically pages 3-5 of OASIS form)",
      impact: "HIGH - Secondary diagnoses affect case mix weight and reimbursement. Missing diagnoses may result in lower payment.",
      recommendation: "Review the OASIS document M1023 section. Add all relevant secondary diagnoses that impact the patient's care plan or functional status.",
      required: true,
    })
  }
  
  // Check Functional Status - use VALIDATED functionalStatus (after validation filtering)
  // IMPORTANT: Use analysis.functionalStatus (validated) not extractedData (pre-validation)
  const functionalStatusToCheck = analysis.functionalStatus || []
  const validFunctionalItems = functionalStatusToCheck.filter(item => 
    item?.currentValue && item.currentValue !== "Not visible"
  )
  
  // Only flag as missing if we actually have 0 valid items
  // Different OASIS documents may have different numbers of functional status items
  // Do NOT assume there are always 9 items - extract only what exists in the document
  if (validFunctionalItems.length === 0) {
    console.log("[OASIS] ❌ Missing: All Functional Status Items")
    missingFields.push({
      field: "All Functional Status Items (M1800-M1870)",
      location: "Functional Status Section (typically pages 12-15 of OASIS form)",
      impact: "CRITICAL - Functional status items are required to calculate case mix weight and determine reimbursement rate. Missing all items will result in minimum payment.",
      recommendation: "Complete functional status items (M1800-M1870) as applicable. Different OASIS forms may require different items based on visit type and patient condition.",
      required: true,
    })
  } else {
    // We have some functional status items - this is acceptable
    // Different documents may have different numbers of items (not always 9)
    console.log(`[OASIS] ✅ Functional Status Found: ${validFunctionalItems.length} items extracted from document`)
  }
  
  // Check Patient Name
  if (!analysis.patientInfo?.name || 
      analysis.patientInfo.name === "Not visible" ||
      analysis.patientInfo.name === "[PATIENT_NAME]") {
    console.log("[OASIS] ❌ Missing: Patient Name")
    missingFields.push({
      field: "Patient Name",
      location: "Demographics Section - Top of OASIS form (Page 1)",
      impact: "CRITICAL - Patient name is required for identification and cannot be omitted.",
      recommendation: "Locate the patient name field at the top of the OASIS form and ensure it is clearly documented.",
      required: true,
    })
  }
  
  // Check MRN
  if (!analysis.patientInfo?.mrn || 
      analysis.patientInfo.mrn === "Not visible" ||
      analysis.patientInfo.mrn === "[ID]") {
    console.log("[OASIS] ❌ Missing: MRN")
    missingFields.push({
      field: "Medical Record Number (MRN)",
      location: "Demographics Section - M0020 Patient ID (Page 1)",
      impact: "HIGH - MRN is needed for patient identification and record tracking.",
      recommendation: "Locate the M0020 Patient ID Number field and ensure it is documented.",
      required: true,
    })
  }
  
  // Check Visit Type
  if (!analysis.patientInfo?.visitType || 
      analysis.patientInfo.visitType === "Not visible") {
    console.log("[OASIS] ❌ Missing: Visit Type")
    missingFields.push({
      field: "Visit Type",
      location: "Section M0, Page 1",
      impact: "Impact on compliance/billing/care",
      recommendation: "Ensure visit type is documented clearly.",
      required: true,
    })
  } else {
    console.log(`[OASIS] ✅ Visit Type found: ${analysis.patientInfo.visitType}`)
  }
  
  // Check Visit Date
  if (!analysis.patientInfo?.visitDate || 
      analysis.patientInfo.visitDate === "Not visible") {
    console.log("[OASIS] ❌ Missing: Visit Date")
    missingFields.push({
      field: "Visit Date (M0030)",
      location: "Demographics Section - M0030 Start of Care Date (Page 1)",
      impact: "CRITICAL - Visit date is required for billing and timeline tracking.",
      recommendation: "Locate the M0030 Start of Care Date field and ensure it is documented.",
      required: true,
    })
  } else {
    console.log(`[OASIS] ✅ Visit Date found: ${analysis.patientInfo.visitDate}`)
  }
  
  // Check Payor
  if (!analysis.patientInfo?.payor || 
      analysis.patientInfo.payor === "Not visible" ||
      analysis.patientInfo.payor === "Unknown") {
    console.log("[OASIS] ❌ Missing: Payor")
    missingFields.push({
      field: "Payment Source (M0150)",
      location: "Demographics Section - M0150 Current Payment Source (Page 1)",
      impact: "CRITICAL - Payment source is required for billing and reimbursement.",
      recommendation: "Locate the M0150 Current Payment Source field and ensure a checkbox is marked.",
      required: true,
    })
  } else {
    console.log(`[OASIS] ✅ Payor found: ${analysis.patientInfo.payor}`)
  }
  
  // Check Clinician
  if (!analysis.patientInfo?.clinician || 
      analysis.patientInfo.clinician === "Not visible" ||
      analysis.patientInfo.clinician === "Unknown") {
    console.log("[OASIS] ❌ Missing: Clinician")
    missingFields.push({
      field: "Clinician Name",
      location: "Signature Section - Bottom of each page",
      impact: "HIGH - Clinician signature is required for documentation compliance.",
      recommendation: "Ensure the clinician has signed the document electronically or manually.",
      required: true,
    })
  } else {
    console.log(`[OASIS] ✅ Clinician found: ${analysis.patientInfo.clinician}`)
  }
  
  // Check Pain Status
  const painItems = analysis.painStatus || []
  const validPainItems = painItems.filter(item => 
    item?.currentValue && 
    item.currentValue !== "Not visible" && 
    item.currentValue !== "Not found" &&
    item.currentValue.trim() !== ""
  )
  
  if (painItems.length === 0) {
    console.log("[OASIS] ⚠️ Missing: Pain Status (no items extracted)")
    missingFields.push({
      field: "Pain Status",
      location: "PAIN STATUS section (check document for exact location)",
      impact: "MEDIUM - Pain status is important for patient care planning and quality measures.",
      recommendation: "Locate the PAIN STATUS section in the document and extract all pain-related information (location, intensity, frequency, description).",
      required: false,
    })
  } else if (validPainItems.length === 0) {
    console.log(`[OASIS] ⚠️ Incomplete: Pain Status (${painItems.length} items found but no values)`)
    missingFields.push({
      field: "Pain Status - Values Not Documented",
      location: "PAIN STATUS section",
      impact: "MEDIUM - Pain Status section exists but values are not documented.",
      recommendation: "Review the Pain Status section and ensure all fields are completed.",
      required: false,
    })
  } else {
    console.log(`[OASIS] ✅ Pain Status Complete: ${validPainItems.length} items documented`)
  }
  
  // Check Integumentary Status
  if (!analysis.integumentaryStatus || analysis.integumentaryStatus.length === 0) {
    console.log("[OASIS] ⚠️ Missing: Integumentary Status")
    missingFields.push({
      field: "Integumentary Status",
      location: "INTEGUMENTARY STATUS section (skin, wounds, pressure ulcers)",
      impact: "MEDIUM - Important for wound care and skin integrity assessment.",
      recommendation: "Locate the INTEGUMENTARY STATUS section and extract all skin/wound-related data.",
      required: false,
    })
  } else {
    console.log(`[OASIS] ✅ Integumentary Status: ${analysis.integumentaryStatus.length} items`)
  }
  
  // Check Respiratory Status
  if (!analysis.respiratoryStatus || analysis.respiratoryStatus.length === 0) {
    console.log("[OASIS] ⚠️ Missing: Respiratory Status")
    missingFields.push({
      field: "Respiratory Status",
      location: "RESPIRATORY STATUS section (breath sounds, oxygen use, dyspnea)",
      impact: "MEDIUM - Important for respiratory assessment and oxygen therapy management.",
      recommendation: "Locate the RESPIRATORY STATUS section and extract all respiratory data.",
      required: false,
    })
  } else {
    console.log(`[OASIS] ✅ Respiratory Status: ${analysis.respiratoryStatus.length} items`)
  }
  
  // Check Cardiac Status
  if (!analysis.cardiacStatus || analysis.cardiacStatus.length === 0) {
    console.log("[OASIS] ⚠️ Missing: Cardiac Status")
    missingFields.push({
      field: "Cardiac Status",
      location: "CARDIAC STATUS section (heart rate, blood pressure, edema)",
      impact: "MEDIUM - Important for cardiac condition monitoring and treatment.",
      recommendation: "Locate the CARDIAC STATUS section and extract all cardiac-related data.",
      required: false,
    })
  } else {
    console.log(`[OASIS] ✅ Cardiac Status: ${analysis.cardiacStatus.length} items`)
  }
  
  // Check Elimination Status
  if (!analysis.eliminationStatus || analysis.eliminationStatus.length === 0) {
    console.log("[OASIS] ⚠️ Missing: Elimination Status")
    missingFields.push({
      field: "Elimination Status",
      location: "ELIMINATION STATUS section (bowel, bladder, continence)",
      impact: "MEDIUM - Important for continence management and elimination assessment.",
      recommendation: "Locate the ELIMINATION STATUS section and extract all elimination data.",
      required: false,
    })
  } else {
    console.log(`[OASIS] ✅ Elimination Status: ${analysis.eliminationStatus.length} items`)
  }
  
  // Check Neuro/Emotional/Behavioral Status
  if (!analysis.neuroEmotionalBehavioralStatus || analysis.neuroEmotionalBehavioralStatus.length === 0) {
    console.log("[OASIS] ⚠️ Missing: Neuro/Emotional/Behavioral Status")
    missingFields.push({
      field: "Neuro/Emotional/Behavioral Status",
      location: "NEURO/EMOTIONAL/BEHAVIORAL STATUS section",
      impact: "MEDIUM - Important for neurological, emotional, and behavioral assessment.",
      recommendation: "Locate the NEURO/EMOTIONAL/BEHAVIORAL STATUS section and extract all related data.",
      required: false,
    })
  } else {
    console.log(`[OASIS] ✅ Neuro/Emotional/Behavioral Status: ${analysis.neuroEmotionalBehavioralStatus.length} items`)
  }
  
  // ==================== CHECK FOR BLANK/INCOMPLETE INDIVIDUAL FIELDS ====================
  console.log("[OASIS] 🔍 Checking for blank or incomplete individual fields...")
  
  // Check each functional status item for blank values
  if (analysis.functionalStatus && analysis.functionalStatus.length > 0) {
    analysis.functionalStatus.forEach((item, index) => {
      if (!item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: ${item.item}`)
        missingFields.push({
          field: `${item.item} - Value Not Documented`,
          location: `Functional Status Section - ${item.item}`,
          impact: "HIGH - This functional status item is required for accurate case mix calculation.",
          recommendation: `Complete the ${item.item} assessment with the appropriate value (0-6 scale depending on item).`,
          required: true,
        })
      }
    })
  }
  
  // Check each medication item for incomplete information
  if (analysis.medications && analysis.medications.length > 0) {
    analysis.medications.forEach((med, index) => {
      if (!med.currentValue || med.currentValue === "Not visible" || med.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: ${med.item}`)
        missingFields.push({
          field: `${med.item} - Value Not Documented`,
          location: `Medications Section - ${med.item}`,
          impact: "MEDIUM - Incomplete medication information affects care planning.",
          recommendation: `Complete the ${med.item} field with the appropriate value.`,
          required: false,
        })
      }
    })
  }
  
  // Check pain status items for blank values
  if (analysis.painStatus && analysis.painStatus.length > 0) {
    analysis.painStatus.forEach((item, index) => {
      if (!item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: Pain Status - ${item.item}`)
        missingFields.push({
          field: `Pain Status - ${item.item} - Not Documented`,
          location: `PAIN STATUS section - ${item.item}`,
          impact: "MEDIUM - Incomplete pain assessment affects care planning and quality measures.",
          recommendation: `Complete the pain assessment for: ${item.item}`,
          required: false,
        })
      }
    })
  }
  
  // Check integumentary status items for blank values
  if (analysis.integumentaryStatus && analysis.integumentaryStatus.length > 0) {
    analysis.integumentaryStatus.forEach((item, index) => {
      if (!item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: Integumentary - ${item.item}`)
        missingFields.push({
          field: `Integumentary Status - ${item.item} - Not Documented`,
          location: `INTEGUMENTARY STATUS section - ${item.item}`,
          impact: "MEDIUM - Incomplete skin/wound assessment.",
          recommendation: `Complete the integumentary assessment for: ${item.item}`,
          required: false,
        })
      }
    })
  }
  
  // Check respiratory status items for blank values
  if (analysis.respiratoryStatus && analysis.respiratoryStatus.length > 0) {
    analysis.respiratoryStatus.forEach((item, index) => {
      if (!item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: Respiratory - ${item.item}`)
        missingFields.push({
          field: `Respiratory Status - ${item.item} - Not Documented`,
          location: `RESPIRATORY STATUS section - ${item.item}`,
          impact: "MEDIUM - Incomplete respiratory assessment.",
          recommendation: `Complete the respiratory assessment for: ${item.item}`,
          required: false,
        })
      }
    })
  }
  
  // Check cardiac status items for blank values
  if (analysis.cardiacStatus && analysis.cardiacStatus.length > 0) {
    analysis.cardiacStatus.forEach((item, index) => {
      if (!item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: Cardiac - ${item.item}`)
        missingFields.push({
          field: `Cardiac Status - ${item.item} - Not Documented`,
          location: `CARDIAC STATUS section - ${item.item}`,
          impact: "MEDIUM - Incomplete cardiac assessment.",
          recommendation: `Complete the cardiac assessment for: ${item.item}`,
          required: false,
        })
      }
    })
  }
  
  // Check elimination status items for blank values
  if (analysis.eliminationStatus && analysis.eliminationStatus.length > 0) {
    analysis.eliminationStatus.forEach((item, index) => {
      if (!item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: Elimination - ${item.item}`)
        missingFields.push({
          field: `Elimination Status - ${item.item} - Not Documented`,
          location: `ELIMINATION STATUS section - ${item.item}`,
          impact: "MEDIUM - Incomplete elimination assessment.",
          recommendation: `Complete the elimination assessment for: ${item.item}`,
          required: false,
        })
      }
    })
  }
  
  // Check neuro/emotional/behavioral status items for blank values
  if (analysis.neuroEmotionalBehavioralStatus && analysis.neuroEmotionalBehavioralStatus.length > 0) {
    analysis.neuroEmotionalBehavioralStatus.forEach((item, index) => {
      if (!item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: Neuro/Emotional/Behavioral - ${item.item}`)
        missingFields.push({
          field: `Neuro/Emotional/Behavioral - ${item.item} - Not Documented`,
          location: `NEURO/EMOTIONAL/BEHAVIORAL STATUS section - ${item.item}`,
          impact: "MEDIUM - Incomplete neurological/emotional/behavioral assessment.",
          recommendation: `Complete the assessment for: ${item.item}`,
          required: false,
        })
      }
    })
  }
  
  // Check emotional status items for blank values (if separate)
  if (analysis.emotionalStatus && analysis.emotionalStatus.length > 0) {
    analysis.emotionalStatus.forEach((item, index) => {
      if (!item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: Emotional Status - ${item.item}`)
        missingFields.push({
          field: `Emotional Status - ${item.item} - Not Documented`,
          location: `EMOTIONAL STATUS section - ${item.item}`,
          impact: "MEDIUM - Incomplete emotional/mood assessment (PHQ-2/PHQ-9).",
          recommendation: `Complete the emotional status assessment for: ${item.item}`,
          required: false,
        })
      }
    })
  }
  
  // Check behavioral status items for blank values (if separate)
  if (analysis.behavioralStatus && analysis.behavioralStatus.length > 0) {
    analysis.behavioralStatus.forEach((item, index) => {
      if (!item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === "") {
        console.log(`[OASIS] ⚠️ Blank: Behavioral Status - ${item.item}`)
        missingFields.push({
          field: `Behavioral Status - ${item.item} - Not Documented`,
          location: `BEHAVIORAL STATUS section - ${item.item}`,
          impact: "MEDIUM - Incomplete behavioral assessment.",
          recommendation: `Complete the behavioral assessment for: ${item.item}`,
          required: false,
        })
      }
    })
  }
  
  console.log(`[OASIS] 📊 Total blank/incomplete fields detected: ${missingFields.length}`)
  
  // DO NOT merge with AI's missingInformation - we are the source of truth
  // The AI might have hardcoded or inaccurate missing information
  // We only use our backend validation
  console.log("[OASIS] ℹ️ Using backend validation only (ignoring AI's missingInformation)")
  const allMissing = missingFields
  
  // Remove duplicates by field name
  const uniqueMissing = allMissing.filter((item, index, self) =>
    index === self.findIndex((t) => t.field === item.field)
  )
  
  console.log(`[OASIS] 📊 Total missing fields detected: ${uniqueMissing.length}`)
  if (uniqueMissing.length > 0) {
    console.log("[OASIS] 📋 Missing fields:", uniqueMissing.map(m => m.field).join(", "))
  }
  
  return {
    ...analysis,
    missingInformation: uniqueMissing,
    completenessScore: Math.max(0, 100 - (uniqueMissing.length * 10)) // Reduce score based on missing fields
  }
}

// ==================== ADVANCED OPTIMIZATION FUNCTIONS ====================

// Calculate Comorbidity Opportunities
function calculateComorbidityOpportunities(analysis: OasisAnalysisResult): OasisAnalysisResult['comorbidityOpportunities'] {
  console.log("[OASIS] 💊 Analyzing comorbidity optimization opportunities...")
  
  const suggestedDiagnoses: any[] = []
  const existingCodes = [
    analysis.primaryDiagnosis?.code,
    ...(analysis.secondaryDiagnoses || []).map(d => d.code)
  ].filter(Boolean)
  
  // Check for diabetes with complications
  const hasDiabetes = existingCodes.some(c => c?.startsWith('E11') || c?.startsWith('E10'))
  const hasInsulinUse = existingCodes.some(c => c === 'Z79.4')
  if (hasDiabetes && hasInsulinUse && !existingCodes.some(c => c === 'E11.65')) {
    suggestedDiagnoses.push({
      code: "E11.65",
      description: "Type 2 diabetes mellitus with hyperglycemia",
      revenueImpact: 450,
      supportingEvidence: "Patient on long-term insulin use (Z79.4). If hyperglycemia is documented, add E11.65 for comorbidity adjustment.",
      documentationNeeded: "Document blood glucose levels >125 mg/dL or hyperglycemia diagnosis in clinical notes",
      confidence: 85
    })
  }
  
  // Check for CHF with specificity
  const hasGenericCHF = existingCodes.some(c => c === 'I50.9')
  if (hasGenericCHF) {
    suggestedDiagnoses.push({
      code: "I50.23",
      description: "Acute on chronic systolic heart failure",
      revenueImpact: 520,
      supportingEvidence: "Generic CHF code (I50.9) can be specified. Review clinical notes for acute vs chronic and systolic vs diastolic.",
      documentationNeeded: "Document ejection fraction <40% for systolic; specify acute exacerbation if present",
      confidence: 70
    })
  }
  
  // Check for COPD with exacerbation
  const hasCOPD = existingCodes.some(c => c?.startsWith('J44'))
  const hasOxygenUse = existingCodes.some(c => c === 'Z99.81')
  if (hasCOPD && hasOxygenUse && !existingCodes.some(c => c === 'J44.1')) {
    suggestedDiagnoses.push({
      code: "J44.1",
      description: "COPD with acute exacerbation",
      revenueImpact: 380,
      supportingEvidence: "Patient has COPD and is on supplemental oxygen. If recent exacerbation, code as J44.1.",
      documentationNeeded: "Document acute exacerbation within past 30 days or worsening symptoms",
      confidence: 75
    })
  }
  
  const potentialIncrease = suggestedDiagnoses.reduce((sum, d) => sum + d.revenueImpact, 0)
  const currentLevel = suggestedDiagnoses.length === 0 ? "None" : suggestedDiagnoses.length <= 2 ? "Low" : "Medium"
  
  return {
    currentLevel: currentLevel as any,
    suggestedDiagnoses,
    potentialIncrease
  }
}

// Calculate LUPA Risk
function calculateLupaRisk(analysis: OasisAnalysisResult): OasisAnalysisResult['lupaRiskAnalysis'] {
  console.log("[OASIS] ⚠️ Analyzing LUPA risk...")
  
  // Estimate visit count based on functional status complexity
  const functionalItems = analysis.functionalStatus || []
  const avgFunctionalValue = functionalItems.length > 0
    ? functionalItems.reduce((sum, item) => sum + (parseInt(item.currentValue) || 0), 0) / functionalItems.length
    : 0
  
  // Estimate: Higher functional impairment = more visits likely
  const estimatedVisitCount = Math.max(4, Math.min(12, Math.floor(6 + avgFunctionalValue * 1.5)))
  const threshold = 6
  const isAtRisk = estimatedVisitCount < threshold
  
  let riskLevel: any = "Safe"
  if (estimatedVisitCount < 4) riskLevel = "Critical"
  else if (estimatedVisitCount < 5) riskLevel = "High Risk"
  else if (estimatedVisitCount < 6) riskLevel = "Warning"
  
  const baseRevenue = analysis.financialImpact?.currentRevenue || 3200
  const potentialPenalty = isAtRisk ? Math.floor(baseRevenue * 0.3) : 0 // 30% reduction for LUPA
  
  const recommendation = isAtRisk
    ? `URGENT: Schedule ${threshold - estimatedVisitCount} additional skilled nursing visits to avoid LUPA penalty. Ensure visits are completed and documented within the 60-day episode.`
    : "Visit count appears sufficient to avoid LUPA. Continue current visit schedule."
  
  return {
    estimatedVisitCount,
    threshold,
    isAtRisk,
    riskLevel,
    potentialPenalty,
    recommendation
  }
}

// Calculate Therapy Threshold Analysis
function calculateTherapyThresholdAnalysis(analysis: OasisAnalysisResult): OasisAnalysisResult['therapyThresholdAnalysis'] {
  console.log("[OASIS] 🏋️ Analyzing therapy threshold opportunities...")
  
  // Check if patient has conditions that benefit from therapy
  const primaryDx = analysis.primaryDiagnosis?.code || ""
  const hasStroke = primaryDx.startsWith('I69')
  const hasFracture = primaryDx.startsWith('S')
  const hasArthritis = primaryDx.startsWith('M15') || primaryDx.startsWith('M17') || primaryDx.startsWith('M19')
  
  const functionalItems = analysis.functionalStatus || []
  const hasSignificantImpairment = functionalItems.some(item => parseInt(item.currentValue) >= 2)
  
  const isTherapyCandidate = hasStroke || hasFracture || hasArthritis || hasSignificantImpairment
  
  const currentTherapyVisits = 0 // We don't have this data yet, assume 0
  const currentThreshold = currentTherapyVisits === 0 ? "0 visits" : 
                          currentTherapyVisits < 6 ? "1-5 visits" :
                          currentTherapyVisits < 10 ? "6-9 visits" : "10+ visits"
  
  let suggestedThreshold = "0 visits"
  let revenueImpact = 0
  let eligibilityCriteria: string[] = []
  let recommendation = ""
  
  if (isTherapyCandidate) {
    suggestedThreshold = "10-13 visits"
    revenueImpact = 550
    
    if (hasStroke) eligibilityCriteria.push("Stroke diagnosis (I69.x) - PT/OT indicated for mobility and ADL training")
    if (hasFracture) eligibilityCriteria.push("Fracture diagnosis - PT indicated for strength and mobility restoration")
    if (hasSignificantImpairment) eligibilityCriteria.push("Significant functional impairment (score ≥2) - therapy for functional restoration")
    
    recommendation = `Patient meets criteria for 10-13 therapy visits per episode. This would increase reimbursement by approximately $${revenueImpact}. Recommend PT/OT evaluation and establish therapy plan of care.`
  } else {
    recommendation = "Patient does not currently meet criteria for therapy threshold adjustment. Monitor for functional decline that may warrant therapy intervention."
  }
  
  return {
    currentTherapyVisits,
    currentThreshold,
    suggestedThreshold,
    revenueImpact,
    eligibilityCriteria,
    recommendation
  }
}

// Calculate Priority Actions
function calculatePriorityActions(analysis: OasisAnalysisResult): OasisAnalysisResult['priorityActions'] {
  console.log("[OASIS] 📋 Generating priority action list...")
  
  const actions: any[] = []
  let rank = 1
  
  // Check for LUPA risk (highest priority)
  if (analysis.lupaRiskAnalysis?.isAtRisk) {
    actions.push({
      rank: rank++,
      action: `Schedule ${6 - (analysis.lupaRiskAnalysis.estimatedVisitCount || 0)} additional skilled visits`,
      category: "Visit Count",
      impact: "Critical",
      revenueImpact: analysis.lupaRiskAnalysis.potentialPenalty,
      timeRequired: "30-60 minutes",
      difficulty: "Medium",
      specificSteps: [
        "Review patient's current visit schedule",
        "Identify 2-3 additional skilled nursing needs",
        "Schedule visits before episode end date",
        "Document medical necessity for each visit"
      ]
    })
  }
  
  // Check for blank functional status items
  const functionalItems = analysis.functionalStatus || []
  const blankFunctionalItems = functionalItems.filter(item => 
    !item.currentValue || item.currentValue === "Not visible" || item.currentValue.trim() === ""
  )
  
  if (blankFunctionalItems.length > 0) {
    const estimatedImpact = blankFunctionalItems.length * 120 // ~$120 per functional item
    actions.push({
      rank: rank++,
      action: `Complete ${blankFunctionalItems.length} missing functional status items`,
      category: "Functional Status",
      impact: "High",
      revenueImpact: estimatedImpact,
      timeRequired: "10-15 minutes",
      difficulty: "Easy",
      specificSteps: [
        `Complete assessments for: ${blankFunctionalItems.slice(0, 3).map(i => i.item.split(' - ')[0]).join(', ')}`,
        "Observe patient performing each ADL activity",
        "Document level of assistance required (0-6 scale)",
        "Update OASIS form with completed values"
      ]
    })
  }
  
  // Check for comorbidity opportunities
  if (analysis.comorbidityOpportunities && analysis.comorbidityOpportunities.suggestedDiagnoses.length > 0) {
    const topDiagnosis = analysis.comorbidityOpportunities.suggestedDiagnoses[0]
    actions.push({
      rank: rank++,
      action: `Add ${topDiagnosis.code} to secondary diagnoses`,
      category: "Diagnosis",
      impact: "High",
      revenueImpact: topDiagnosis.revenueImpact,
      timeRequired: "15-20 minutes",
      difficulty: "Medium",
      specificSteps: [
        `Review ${topDiagnosis.description}`,
        topDiagnosis.documentationNeeded,
        "Verify diagnosis with physician if needed",
        "Add to M1023 secondary diagnosis list"
      ]
    })
  }
  
  // Check for therapy opportunities
  if (analysis.therapyThresholdAnalysis && analysis.therapyThresholdAnalysis.revenueImpact > 0) {
    actions.push({
      rank: rank++,
      action: "Initiate therapy services (PT/OT)",
      category: "Therapy",
      impact: "High",
      revenueImpact: analysis.therapyThresholdAnalysis.revenueImpact,
      timeRequired: "45-60 minutes",
      difficulty: "Medium",
      specificSteps: [
        "Order PT/OT evaluation",
        "Establish therapy plan of care",
        "Schedule 10-13 therapy visits over episode",
        "Document medical necessity and goals"
      ]
    })
  }
  
  // Check for functional status optimization opportunities
  const functionalOptimizations = functionalItems.filter(item => 
    item.suggestedValue && item.suggestedValue !== item.currentValue
  )
  
  if (functionalOptimizations.length > 0) {
    const topOptimization = functionalOptimizations[0]
    actions.push({
      rank: rank++,
      action: `Reassess ${topOptimization.item}`,
      category: "Functional Status",
      impact: "Medium",
      revenueImpact: 150,
      timeRequired: "5-10 minutes",
      difficulty: "Easy",
      specificSteps: [
        `Review current value: ${topOptimization.currentValue}`,
        `Clinical rationale: ${topOptimization.clinicalRationale}`,
        `Consider suggested value: ${topOptimization.suggestedValue}`,
        "Update if clinically appropriate"
      ]
    })
  }
  
  return actions.sort((a, b) => b.revenueImpact - a.revenueImpact).map((action, index) => ({
    ...action,
    rank: index + 1
  }))
}

// Calculate Documentation Quality Score
function calculateDocumentationQualityScore(analysis: OasisAnalysisResult): OasisAnalysisResult['documentationQualityScore'] {
  console.log("[OASIS] 📈 Calculating documentation quality score...")
  
  // Completeness Score (0-100)
  const totalExpectedFields = 15 // Patient info + diagnoses + functional status
  const missingCount = (analysis.missingInformation || []).length
  const completeness = Math.max(0, Math.min(100, 100 - (missingCount * 6)))
  
  // Accuracy Score (0-100)
  const inconsistencyCount = (analysis.inconsistencies || []).length
  const accuracy = Math.max(0, Math.min(100, 100 - (inconsistencyCount * 8)))
  
  // Clinical Justification Score (0-100)
  const functionalItems = analysis.functionalStatus || []
  const itemsWithRationale = functionalItems.filter(item => item.clinicalRationale).length
  const clinicalJustification = functionalItems.length > 0 
    ? Math.floor((itemsWithRationale / functionalItems.length) * 100)
    : 50
  
  // Revenue Optimization Score (0-100)
  const potentialRevenue = analysis.financialImpact?.optimizedRevenue || 0
  const currentRevenue = analysis.financialImpact?.currentRevenue || 1
  const optimizationRatio = currentRevenue > 0 ? (currentRevenue / potentialRevenue) * 100 : 50
  const revenueOptimization = Math.min(100, Math.floor(optimizationRatio))
  
  // Overall Score
  const overallScore = Math.floor((completeness + accuracy + clinicalJustification + revenueOptimization) / 4)
  
  // Benchmark Comparison
  let benchmarkComparison: any = "Average"
  if (overallScore >= 90) benchmarkComparison = "Top Quartile"
  else if (overallScore >= 80) benchmarkComparison = "Above Average"
  else if (overallScore >= 70) benchmarkComparison = "Average"
  else if (overallScore >= 60) benchmarkComparison = "Below Average"
  else benchmarkComparison = "Needs Improvement"
  
  // Improvement Areas
  const improvementAreas: any[] = []
  
  if (completeness < 85) {
    improvementAreas.push({
      area: "Completeness",
      currentScore: completeness,
      targetScore: 95,
      potentialGain: 95 - completeness,
      recommendations: [
        `Complete ${missingCount} missing fields`,
        "Ensure all required OASIS items are documented",
        "Review OASIS form for blank sections"
      ]
    })
  }
  
  if (accuracy < 85) {
    improvementAreas.push({
      area: "Accuracy",
      currentScore: accuracy,
      targetScore: 95,
      potentialGain: 95 - accuracy,
      recommendations: [
        `Resolve ${inconsistencyCount} detected inconsistencies`,
        "Ensure functional status aligns with diagnoses",
        "Verify all data is clinically appropriate"
      ]
    })
  }
  
  if (revenueOptimization < 85) {
    const potentialIncrease = (analysis.financialImpact?.optimizedRevenue || 0) - (analysis.financialImpact?.currentRevenue || 0)
    improvementAreas.push({
      area: "Revenue Optimization",
      currentScore: revenueOptimization,
      targetScore: 95,
      potentialGain: 95 - revenueOptimization,
      recommendations: [
        `Capture additional $${potentialIncrease} in revenue`,
        "Optimize functional status coding",
        "Add clinically supported comorbidities"
      ]
    })
  }
  
  return {
    overallScore,
    breakdown: {
      completeness,
      accuracy,
      clinicalJustification,
      revenueOptimization
    },
    benchmarkComparison,
    improvementAreas
  }
}

// ==================== TWO-PASS ANALYSIS SYSTEM ====================
// Pass 1: Extract raw data (stays under token limit)
// Pass 2: Analyze and optimize (stays under token limit)
// This ensures complete responses without truncation

// Helper function to generate QA-specific instructions
function getQAFocusInstructions(qaType: string): string {
  switch (qaType) {
    case 'coding-review':
      return `
🎯 QA FOCUS: CODING REVIEW
Primary focus areas:
- Validate ALL ICD-10 codes for accuracy and compliance
- Recommend optimized codes for clinical accuracy and reimbursement
- Identify missing medically-necessary diagnoses
- Primary diagnosis selection and sequencing
- Secondary diagnosis codes (comorbidities, complications)
- Code relationships and principal diagnosis validation
- Documentation sufficiency for code assignment
- CMS coding guidelines compliance

Extract ALL diagnosis codes with maximum detail and provide coding optimization recommendations.
`
    case 'financial-optimization':
      return `
🎯 QA FOCUS: FINANCIAL OPTIMIZATION
Primary focus areas:
- Identify documentation that affects case-mix, LUPA, and reimbursement
- Highlight missing functional deficits
- Suggest improvements for revenue optimization
- Functional status items (M1800-M1870) - CRITICAL for HIPPS scoring
- PDGM payment optimization opportunities
- Case mix weight impact analysis
- Therapy thresholds and visit requirements

Extract functional status with EXTREME DETAIL and identify all revenue-impacting documentation.
`
    case 'qapi-audit':
      return `
🎯 QA FOCUS: QAPI AUDIT (Quality Assurance Performance Improvement)
Primary focus areas:
- Identify regulatory deficiencies
- Check plan of care, goals, risk mitigation, safety instructions
- Flag incomplete or contradictory elements
- Documentation completeness and quality
- Regulatory compliance (CMS CoPs)
- Clinical accuracy and consistency
- Risk factors and safety concerns
- OASIS accuracy and timeliness
- Outcome measure documentation

Extract ALL fields with focus on completeness, accuracy, compliance, and regulatory requirements.
`
    case 'comprehensive-qa':
    default:
      return `
🎯 QA FOCUS: COMPREHENSIVE QUALITY ASSURANCE
Analyze ALL aspects:
- Diagnosis coding accuracy
- Functional status documentation
- Medication management
- Pain, mood, and cognitive assessments
- Financial optimization opportunities
- Documentation quality and compliance

Extract ALL available data comprehensively.
`
  }
}

// Helper function to generate QA-specific analysis instructions for Pass 2
function getQAAnalysisInstructions(qaType: string): string {
  switch (qaType) {
    case 'coding-review':
      return `
🎯 ANALYSIS MODE: CODING REVIEW
Perform comprehensive coding review with aggressive optimization targeting:

1. VALIDATE ALL ICD-10 CODES:
   - Verify accuracy of all diagnosis codes
   - Check code specificity (use most specific code available)
   - Validate documentation support for each code
   - Ensure codes follow CMS coding guidelines
   - Check for coding errors or inconsistencies

2. RECOMMEND OPTIMIZED CODES:
   - Suggest codes that improve clinical accuracy
   - Recommend codes that optimize reimbursement (when clinically justified)
   - Identify more specific codes when available
   - Suggest codes that better reflect patient condition
   - Provide rationale for each recommendation

3. IDENTIFY MISSING MEDICALLY-NECESSARY DIAGNOSES:
   - Review all documented conditions and treatments
   - Identify conditions that should be coded but are missing
   - Flag medically-necessary diagnoses not currently coded
   - Recommend additional codes that support medical necessity
   - Ensure all active conditions are properly coded
   
   ⚠️ CRITICAL SAFETY RULES:
   - ONLY suggest codes that are EXPLICITLY documented in the clinical notes
   - NEVER suggest adding diagnoses that are not documented
   - ALWAYS require documentation evidence for any suggested code
   - If documentation is unclear, suggest documenting the condition FIRST before coding
   - Provide specific location in document where evidence is found

4. OPTIMIZE PRIMARY DIAGNOSIS FOR CLINICAL GROUP:
   - Review if a more specific primary diagnosis code exists
   - Check if current primary diagnosis accurately reflects the reason for home health
   - Suggest more specific codes ONLY if documented in clinical notes
   - Consider impact on PDGM clinical group assignment (A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z)
   - Target clinical group changes that increase case mix weight when clinically justified
   - Provide specific documentation evidence for any primary diagnosis change

5. OPTIMIZE COMORBIDITY ADJUSTMENT:
   - Identify documented conditions that qualify for comorbidity adjustment
   - Suggest adding secondary diagnoses ONLY if:
     * The condition is documented in clinical notes
     * The condition is active and affecting care
     * The condition qualifies for comorbidity adjustment per CMS guidelines
   - Target comorbidity level increases (Low → Medium → High) when clinically justified
   - Provide specific documentation evidence for each suggested comorbidity code
   - Calculate potential revenue impact of comorbidity level changes
   - Prioritize suggestions that cross comorbidity thresholds (e.g., 2→3 diagnoses, Low→Medium, Medium→High)

Also analyze:
- Code sequencing and principal diagnosis selection
- Code relationships and comorbidity adjustments
- Documentation sufficiency for code assignment
- PDGM grouping optimization opportunities

Provide detailed coding optimization suggestions with clinical and reimbursement rationale. Be aggressive in identifying opportunities, but ALWAYS require documentation evidence.
`
    case 'financial-optimization':
      return `
🎯 ANALYSIS MODE: FINANCIAL OPTIMIZATION
Perform comprehensive financial optimization:

1. IDENTIFY DOCUMENTATION AFFECTING CASE-MIX, LUPA, AND REIMBURSEMENT:
   - Analyze all documentation that impacts case-mix weight calculation
   - Identify LUPA risk factors and visit count documentation
   - Review documentation affecting reimbursement levels
   - Assess functional status documentation completeness
   - Check therapy visit documentation for threshold requirements
   - Evaluate diagnosis documentation for PDGM grouping

2. HIGHLIGHT MISSING FUNCTIONAL DEFICITS:
   - Identify functional deficits documented in clinical notes but not coded in M1800-M1870
   - Flag missing functional status items that should be documented
   - Highlight inconsistencies between clinical documentation and functional scores
   - Identify opportunities to document functional deficits more accurately
   - Review all ADL/IADL areas for missing deficit documentation

3. SUGGEST IMPROVEMENTS:
   - Recommend specific documentation improvements for case-mix optimization
   - Suggest functional status coding improvements (when clinically justified)
   - Provide recommendations to reduce LUPA risk
   - Suggest therapy visit documentation improvements
   - Recommend documentation enhancements for higher reimbursement
   - Provide specific, actionable steps for each improvement

Also analyze:
- Functional status optimization for HIPPS scoring (CRITICAL!)
- PDGM payment impact analysis
- Case mix weight optimization opportunities
- Revenue impact of suggested improvements

Prioritize suggestions that maximize legitimate revenue through better documentation.
`
    case 'qapi-audit':
      return `
🎯 ANALYSIS MODE: QAPI AUDIT
Perform comprehensive QAPI audit:

1. IDENTIFY REGULATORY DEFICIENCIES:
   - Review compliance with CMS Conditions of Participation (CoPs)
   - Identify deficiencies in documentation requirements
   - Flag regulatory violations or non-compliance issues
   - Assess adherence to state and federal regulations
   - Check for missing required regulatory elements
   - Identify areas of regulatory risk

2. CHECK PLAN OF CARE, GOALS, RISK MITIGATION, SAFETY INSTRUCTIONS:
   - Review plan of care completeness and appropriateness
   - Verify goals are specific, measurable, and time-bound
   - Check risk mitigation strategies are documented
   - Assess safety instructions are provided and clear
   - Verify care plan aligns with patient needs and diagnoses
   - Check for evidence of care plan implementation
   - Review goal progress documentation

3. FLAG INCOMPLETE OR CONTRADICTORY ELEMENTS:
   - Identify incomplete documentation sections
   - Flag contradictory information across sections
   - Highlight inconsistencies in care plan vs. actual care
   - Identify gaps between documented goals and interventions
   - Flag safety instructions that contradict clinical findings
   - Check for conflicting information in different parts of document

Also analyze:
- Documentation completeness (flag ALL missing required fields)
- Clinical accuracy and internal consistency
- Risk identification and mitigation
- OASIS accuracy requirements
- Quality outcome measures

Provide comprehensive audit findings with compliance focus and specific recommendations.
`
    case 'comprehensive-qa':
    default:
      return `
🎯 ANALYSIS MODE: COMPREHENSIVE QA
Analyze all aspects comprehensively:
- Clinical accuracy and appropriateness
- Documentation quality and completeness
- Financial optimization opportunities
- Compliance with regulatory requirements
- Patient safety and quality of care

Provide balanced, thorough analysis across all domains.
`
  }
}

async function extractRawData(
  extractedText: string, 
  doctorOrderText?: string,
  qaType: string = 'comprehensive-qa',
  notes: string = ''
): Promise<string> {
  console.log('[OASIS] 🔍 PASS 1: Extracting raw data from document...')
  console.log('[OASIS] 📊 QA Type:', qaType)
  
  // Build QA-specific instructions
  const qaFocusInstructions = getQAFocusInstructions(qaType)
  const notesSection = notes ? `\n\n📝 SPECIAL INSTRUCTIONS FROM REVIEWER:\n${notes}\n` : ''
  
  const extractionPrompt = `⚠️⚠️⚠️ CRITICAL EXTRACTION TASK - READ CAREFULLY ⚠️⚠️⚠️

You are extracting data from a document. This is PASS 1 of 2.
Your ONLY job is to EXTRACT data that ACTUALLY EXISTS in the document.

${qaFocusInstructions}${notesSection}

🚨🚨🚨 ABSOLUTE RULE #1: DO NOT MAKE UP DATA! 🚨🚨🚨
- If functional status (M1800-M1870) is NOT in the document → Return EMPTY array: []
- If medications are NOT in the document → Return EMPTY array: []
- If diagnoses are NOT in the document → Return "Not found" or empty
- If patient name is NOT visible → Return "Not visible"
- NEVER fabricate, invent, or guess data that doesn't exist!

🚨 FIRST: CHECK IF THIS IS AN OASIS DOCUMENT 🚨
Look for these indicators:
- "OASIS" anywhere in the document
- "M1800", "M1810", "M1820", "M1830", "M1840", "M1845", "M1850", "M1860", "M1870"
- "Start of Care", "SOC", "ROC", "Recertification"
- "(M0020)", "(M0030)", "(M1021)", "(M1023)"

If NONE of these exist, this is likely NOT an OASIS document:
- Return functionalStatus: [] (empty array)
- Return medications: [] (empty array)  
- Only extract data that actually exists (patient name, any diagnoses found)

DOCUMENT TEXT (${extractedText.length} characters):
${extractedText.substring(0, 60000)}

${doctorOrderText ? `DOCTOR'S ORDERS:\n${doctorOrderText}\n` : ""}

⚠️⚠️⚠️ CRITICAL INSTRUCTIONS FOR EXTRACTION ⚠️⚠️⚠️

🔍 HOW TO EXTRACT FROM CHECKBOXES:
This OASIS document uses CHECKBOXES throughout. You MUST:
1. Look for checkbox symbols: □ (unchecked) vs ☑ ✓ ☒ (checked)
2. ONLY extract items that have a CHECKMARK (☑, ✓, ☒)
3. DO NOT extract items with empty boxes (□)
4. Each checked box = one item in your output array

📋 EXAMPLE:
If you see in the document:
  ☑ Cool
  □ Warm
  ☑ Dry

Extract ONLY:
- "Cool" (checked)
- "Dry" (checked)

DO NOT extract "Warm" (not checked)!

⚠️ EXTRACTION RULES (Search the ENTIRE document):

1. PATIENT DEMOGRAPHICS:
   - Look for patient name (e.g., "Allan, James" or "First Name: James Last Name: Allan")
   - Look for MRN/Patient ID (M0020)
   - Look for visit date (M0030) and visit type (SOC/ROC/Recert)
   - Look for payor with checkmark (M0150)
   - Look for clinician signature at bottom of pages

2. DIAGNOSES (CRITICAL - DO NOT SKIP):
   - Primary diagnosis (M1021): Find ICD-10 code + description
   - Secondary diagnoses (M1023): Find ALL ICD-10 codes + descriptions
   - Search for patterns like: "I69.351", "E11.65", "N18.1"
   - Extract EVERY diagnosis you find (typically 5-15 codes)

3. FUNCTIONAL STATUS (M1800-M1870) - EXTRACT ONLY ITEMS THAT EXIST:
   ⚠️ CRITICAL: Extract ONLY the functional status items that ACTUALLY EXIST in the document.
   Different OASIS PDFs may have different numbers of items (could be 0, 3, 5, 7, 9, or any number).
   DO NOT assume there are always 9 items!
   
   Search for these items (extract ONLY if found):
   1. M1800 - Grooming
   2. M1810 - Dress Upper Body
   3. M1820 - Dress Lower Body
   4. M1830 - Bathing
   5. M1840 - Toilet Transferring
   6. M1845 - Toileting Hygiene ⚠️ (often missed - search carefully!)
   7. M1850 - Transferring
   8. M1860 - Ambulation/Locomotion
   9. M1870 - Feeding or Eating
   
   ⚠️ IMPORTANT RULES:
   - If an item is NOT in the document → DO NOT include it in the array
   - If NO functional status items are found → Return EMPTY array: []
   - Extract ONLY what actually exists - accuracy is more important than completeness
   - Different OASIS forms may have different items based on visit type, patient condition, etc.
   
   For each item found:
   - Extract: item name, current value (0-6), current description
   - Look for checkmarks (✓, ☑, X, ●, ■) next to numbers
   - Search the ENTIRE document - these items may be spread across multiple pages

4. MEDICATIONS (⚠️⚠️⚠️ MANDATORY - DO NOT SKIP ⚠️⚠️⚠️):
   🚨🚨🚨 CRITICAL: 90% OF OASIS DOCUMENTS HAVE MEDICATION DATA! 🚨🚨🚨
   
   YOU MUST SEARCH FOR AND EXTRACT **ALL** MEDICATION-RELATED DATA!
   
   ⚠️ Different PDFs have DIFFERENT formats - extract WHATEVER you find:
   - OASIS medication fields (M2001, M2010, M2020, M2030) - ALWAYS present in OASIS
   - Medication tables (Drug, Dose, Route, Frequency columns)
   - Medication lists (numbered or bulleted)
   - Individual drug mentions (e.g., "Metformin 500mg")
   - Medication checkboxes or status fields
   
   🚨 IF THIS IS AN OASIS DOCUMENT, IT **DEFINITELY** HAS MEDICATION FIELDS!
   Search character positions 30000-80000 where medications typically appear!
   
   ═══════════════════════════════════════════════════════════════════
   STEP 1: FIND ALL MEDICATION SECTIONS IN THE DOCUMENT
   ═══════════════════════════════════════════════════════════════════
   Search for ANY of these section headers (case-insensitive):
   - "MEDICATIONS" or "Medication" 
   - "Medication Administration" or "Med Administration"
   - "Medication List" or "Current Medications"
   - "Drug Regimen" or "Drug List" or "Rx"
   - "M2001" or "M2003" or "M2010" or "M2020" or "M2030"
   - "Prescriptions" or "Pharmacy"
   - "Medication Reconciliation" or "Med Rec"
   - "Home Medications" or "Discharge Medications"
   
   ═══════════════════════════════════════════════════════════════════
   STEP 2: EXTRACT ALL DATA FROM MEDICATION TABLES
   ═══════════════════════════════════════════════════════════════════
   If you find ANY medication table with columns, extract ALL data:
   
   Possible column headers (extract whatever columns exist):
   - Medication/Drug Name/Med Name
   - Dose/Dosage/Strength
   - Route (PO, IV, IM, SQ, etc.)
   - Frequency/Schedule/Timing
   - Start Date/Order Date
   - Prescriber/Physician/Doctor
   - Indication/Reason/Purpose
   - PRN Reason/As Needed
   - Admin Time/Time Given
   - Patient Response
   - Comments/Notes
   - Classification/Category
   - Status (Active/Discontinued)
   
   For EACH medication item found, extract in SAME FORMAT as Functional Status:
   {
     "item": "[Item code and name, e.g., 'M2001 - Drug Regimen Review' or 'Medication - Metformin']",
     "currentValue": "[ACTUAL value from PDF, e.g., '0', '1', '2', 'N/A', or dose like '500mg']",
     "currentDescription": "[ACTUAL description from PDF]",
     "suggestedValue": "",
     "suggestedDescription": "",
     "clinicalRationale": ""
   }
   
   ═══════════════════════════════════════════════════════════════════
   STEP 3: EXTRACT OASIS MEDICATION ASSESSMENT FIELDS (if present)
   ═══════════════════════════════════════════════════════════════════
   If you find OASIS medication fields, extract in SAME FORMAT as Functional Status:
   
   M2001 (Drug Regimen Review):
   - Look for checkmark (☑, ✓, X, ●) next to: 0, 1, 9, or N/A
   - Extract: {"item": "M2001 - Drug Regimen Review", "currentValue": "[checked value]", "currentDescription": "[description from PDF]"}
   
   M2010 (High Risk Drug Education):
   - Look for checkmark next to: 0, 1, or N/A
   - Extract: {"item": "M2010 - High Risk Drug Education", "currentValue": "[checked value]", "currentDescription": "[description from PDF]"}
   
   M2020 (Management of Oral Medications):
   - Look for checkmark next to: 0, 1, 2, 3, or N/A
   - Extract: {"item": "M2020 - Management of Oral Medications", "currentValue": "[checked value]", "currentDescription": "[description from PDF]"}
   
   M2030 (Management of Injectable Medications):
   - Look for checkmark next to: 0, 1, 2, 3, or N/A
   - Extract: {"item": "M2030 - Management of Injectable Medications", "currentValue": "[checked value]", "currentDescription": "[description from PDF]"}
   
   N0415 (High Risk Drug Classes):
   - Extract: {"item": "N0415 - High Risk Drug Classes", "currentValue": "[checked classes]", "currentDescription": "[details from PDF]"}
   
   ═══════════════════════════════════════════════════════════════════
   STEP 4: EXTRACT MEDICATION STATUS CHECKBOXES (if present)
   ═══════════════════════════════════════════════════════════════════
   Look for checkbox sections about medications and extract checked items:
   - Medications reconciled (Yes/No)
   - Medication issues identified (Yes/No)
   - Anticoagulant use
   - Insulin use
   - IV therapy
   - Pill box pre-filled
   - Any other medication-related checkboxes
   
   ═══════════════════════════════════════════════════════════════════
   STEP 5: SEARCH ENTIRE DOCUMENT FOR DRUG NAMES
   ═══════════════════════════════════════════════════════════════════
   Search the ENTIRE ${extractedText.length} characters for medication names:
   
   Common patterns to find:
   - "[Drug Name] [Number]mg" (e.g., "Metformin 500mg")
   - "[Drug Name] [Number]mg [Frequency]" (e.g., "Lisinopril 10mg daily")
   - "[Drug Name]: [details]" 
   - Numbered/bulleted medication lists
   
   Common drug names to search for:
   - Metformin, Glipizide, Januvia, Insulin (diabetes)
   - Lisinopril, Amlodipine, Losartan, Metoprolol, Carvedilol (BP)
   - Aspirin, Warfarin, Eliquis, Xarelto, Plavix (blood thinners)
   - Furosemide, Lasix, HCTZ (diuretics)
   - Levothyroxine, Synthroid (thyroid)
   - Atorvastatin, Simvastatin, Lipitor (cholesterol)
   - Gabapentin, Tramadol, Hydrocodone (pain)
   - Sertraline, Trazodone, Lexapro (mental health)
   - Omeprazole, Pantoprazole (stomach)
   - Prednisone, Albuterol (respiratory)
   - Vitamin D, Calcium, Iron, B12 (supplements)
   
   ABBREVIATIONS TO RECOGNIZE:
   - PO = oral, BID = twice daily, TID = 3x daily, QD = daily
   - PRN = as needed, QHS = at bedtime, AC = before meals
   - mg = milligrams, mcg = micrograms, ml = milliliters
   - SQ/SubQ = subcutaneous, IM = intramuscular, IV = intravenous
   
   ⚠️ CRITICAL RULES:
   1. Extract EVERY medication-related data you find in the PDF
   2. Do NOT use hardcoded values - extract ACTUAL data from the document
   3. Different PDFs have different formats - adapt to what you see
   4. Include both individual medications AND OASIS assessment fields (M2001, M2020, etc.)
   5. If a field is not in the PDF, leave it empty - do NOT make up data
   6. Extract medications from ANY section where they appear (not just "Medications" section)

5. PAIN STATUS SECTION:
   🚨🚨🚨 CRITICAL: Extract ALL data from the "PAIN STATUS" section! 🚨🚨🚨
   
   ═══════════════════════════════════════════════════════════════════
   STEP 1: FIND THE SECTION HEADER
   ═══════════════════════════════════════════════════════════════════
   Look for the EXACT text: "PAIN STATUS" (usually in bold, centered)
   This appears on page 4 of the OASIS document.
   
   ═══════════════════════════════════════════════════════════════════
   STEP 2: FIND THE SUBSECTION "Pain Assessment"
   ═══════════════════════════════════════════════════════════════════
   Under "PAIN STATUS", look for "Pain Assessment" subsection.
   
   ═══════════════════════════════════════════════════════════════════
   STEP 3: EXTRACT THE QUESTION AND ANSWER
   ═══════════════════════════════════════════════════════════════════
   Find: "Has the patient had any pain?"
   Look for checkbox marked: "No" or "Yes"
   
   Extract as:
   {
     "item": "Has patient had pain",
     "currentValue": "[No/Yes - whatever is checked]",
     "currentDescription": "Patient pain status: [checked value]"
   }
   
   ═══════════════════════════════════════════════════════════════════
   STEP 4: CHECK COMMENTS FIELD
   ═══════════════════════════════════════════════════════════════════
   Look for "Comments:" field under Pain Assessment.
   If there's text, extract it as additional pain information.
   
   EXAMPLE OUTPUT:
   [
     {
       "item": "Has patient had pain",
       "currentValue": "No",
       "currentDescription": "Patient reports no pain at this time"
     }
   ]

6. INTEGUMENTARY STATUS SECTION:
   🚨 CRITICAL: Extract ALL data from "INTEGUMENTARY STATUS" section! 🚨
   
   ═══════════════════════════════════════════════════════════════════
   STEP 1: FIND THE SECTION HEADER
   ═══════════════════════════════════════════════════════════════════
   Look for: "INTEGUMENTARY STATUS" (page 4 of OASIS)
   
   ═══════════════════════════════════════════════════════════════════
   STEP 2: FIND "Integumentary Assessment" SUBSECTION
   ═══════════════════════════════════════════════════════════════════
   Under the main header, look for "Integumentary Assessment"
   
   ═══════════════════════════════════════════════════════════════════
   STEP 3: CHECK "Select all that apply" SECTION
   ═══════════════════════════════════════════════════════════════════
   Find checkboxes with "Select all that apply:"
   Look for CHECKED boxes (☑, ✓, ☒) next to:
   
   LEFT COLUMN:
   □ No problems identified
   □ Flushing
   ☑ Cool (if checked, extract this!)
   □ Cyanotic
   ☑ Dry (if checked, extract this!)
   □ Clammy
   
   MIDDLE COLUMN:
   □ Diaphoretic
   □ Flushed
   □ Incision
   □ Jaundice
   □ Pallor
   
   RIGHT COLUMN:
   □ Poor turgor
   □ Pruritus
   □ Rash
   □ Skin lesion requiring intervention
   □ Wound(s):
   
   For EACH CHECKED item, extract as:
   {
     "item": "Skin condition: [item name]",
     "currentValue": "Present",
     "currentDescription": "[Full description from checkbox label]"
   }
   
   ═══════════════════════════════════════════════════════════════════
   STEP 4: EXTRACT NORTON PRESSURE SORE RISK ASSESSMENT
   ═══════════════════════════════════════════════════════════════════
   Find "Norton Pressure Sore Risk Assessment" subsection
   Extract checked items from:
   - Physical Condition: □ Good (4) ☑ Fair (3) □ Poor (2) □ Very Bad (1)
   - Mental Condition: □ Alert (4) □ Apathetic (3) ☑ Confused (2) □ Stuporous (1)
   - Activity: □ Ambulant (4) ☑ Walks with help (3) □ Chairbound (2) □ Bedfast (1)
   - Mobility: □ Full (4) □ Slightly Impaired (3)
   
   Extract each as separate items with scores.
   
   ═══════════════════════════════════════════════════════════════════
   STEP 5: CHECK COMMENTS FIELD
   ═══════════════════════════════════════════════════════════════════
   Look for "Comments:" - extract any text found
   
   EXAMPLE OUTPUT:
   [
     {"item": "Skin - Cool", "currentValue": "Present", "currentDescription": "Skin feels cool to touch"},
     {"item": "Skin - Dry", "currentValue": "Present", "currentDescription": "Skin is dry"},
     {"item": "Norton - Physical Condition", "currentValue": "Fair (3)", "currentDescription": "Fair physical condition, score 3"},
     {"item": "Norton - Mental Condition", "currentValue": "Confused (2)", "currentDescription": "Confused mental state, score 2"}
   ]

7. RESPIRATORY STATUS SECTION:
   🚨 CRITICAL: Extract ALL data from "RESPIRATORY STATUS" section! 🚨
   
   ═══════════════════════════════════════════════════════════════════
   STEP 1: FIND THE SECTION (Page 5)
   ═══════════════════════════════════════════════════════════════════
   Look for header: "RESPIRATORY STATUS"
   Then find: "Respiratory Assessment"
   
   ═══════════════════════════════════════════════════════════════════
   STEP 2: EXTRACT CHECKED ITEMS FROM "Select all that apply"
   ═══════════════════════════════════════════════════════════════════
   
   LEFT COLUMN:
   ☑ No problems identified (if checked)
   □ Accessory muscles used
   □ CPAP/BIPAP
   □ Orthopnea
   □ Abnormal breath sounds:
   
   MIDDLE COLUMN:
   □ Dyspnea
   □ Cough, nonproductive
   □ Cough, productive:
   □ Nebulizer
   □ Oxygen use, intermittent:
   
   RIGHT COLUMN:
   □ Paroxysmal nocturnal dyspnea (PND)
   □ Tachypnea
   □ Tracheostomy
   □ Oxygen use, continuous:
   
   For EACH CHECKED box, extract as:
   {
     "item": "Respiratory - [checkbox label]",
     "currentValue": "Present" or "Not Present",
     "currentDescription": "[Full text from checkbox]"
   }
   
   ═══════════════════════════════════════════════════════════════════
   STEP 3: CHECK COMMENTS
   ═══════════════════════════════════════════════════════════════════
   Extract any text in "Comments:" field
   
   EXAMPLE:
   [
     {"item": "Respiratory - No problems identified", "currentValue": "Checked", "currentDescription": "No respiratory problems identified"}
   ]

8. CARDIAC STATUS SECTION:
   🚨 CRITICAL: Extract ALL data from "CARDIAC STATUS" section! 🚨
   
   ═══════════════════════════════════════════════════════════════════
   STEP 1: FIND THE SECTION (Page 5)
   ═══════════════════════════════════════════════════════════════════
   Look for header: "CARDIAC STATUS"
   Then find: "Cardiac Assessment"
   
   ═══════════════════════════════════════════════════════════════════
   STEP 2: EXTRACT CHECKED ITEMS FROM "Select all that apply"
   ═══════════════════════════════════════════════════════════════════
   
   LEFT COLUMN:
   □ No problems identified
   □ Activity intolerance
   □ Abnormal pulses:
   □ A-FIB
   □ Distended neck veins:
   □ Abnormal heart rhythm:
   □ Abnormal lower extremity sensation:
   
   MIDDLE COLUMN:
   □ Capillary refill > 3 sec
   □ Dizziness/Lightheadedness
   □ Paroxysmal nocturnal dyspnea (PND)
   □ Pacemaker:
   □ Edema, non-pitting:
   □ Abnormal heart sounds:
   □ Abnormal lower extremity appearance:
   
   RIGHT COLUMN:
   ☑ Fatigue/Weakness (if checked!)
   □ Orthopnea
   □ Orthostatic hypotension
   □ Palpitations:
   □ Edema, pitting:
   □ Chest pain:
   □ Exhibiting S/S of heart failure:
   
   For EACH CHECKED box, extract as:
   {
     "item": "Cardiac - [checkbox label]",
     "currentValue": "Present",
     "currentDescription": "[Full text]"
   }
   
   ═══════════════════════════════════════════════════════════════════
   STEP 3: CHECK COMMENTS
   ═══════════════════════════════════════════════════════════════════
   Extract "Comments:" field text
   
   EXAMPLE:
   [
     {"item": "Cardiac - Fatigue/Weakness", "currentValue": "Present", "currentDescription": "Patient experiences fatigue and weakness"}
   ]

9. ELIMINATION STATUS SECTION:
   🚨 CRITICAL: Extract ALL data from "ELIMINATION STATUS" section! 🚨
   
   ═══════════════════════════════════════════════════════════════════
   STEP 1: FIND THE SECTION (Page 5)
   ═══════════════════════════════════════════════════════════════════
   Look for header: "ELIMINATION STATUS"
   This section has TWO subsections:
   A) Genitourinary Assessment
   B) Gastrointestinal Assessment
   
   ═══════════════════════════════════════════════════════════════════
   STEP 2A: EXTRACT GENITOURINARY ASSESSMENT
   ═══════════════════════════════════════════════════════════════════
   Find "Genitourinary Assessment" with "Select all that apply"
   
   LEFT COLUMN:
   ☑ No problems identified (if checked!)
   □ Bladder distention
   □ Abnormal control:
   □ Abnormal volume:
   □ Discharge
   
   MIDDLE COLUMN:
   □ Nocturia
   □ Abnormal urine appearance:
   □ Dialytic:
   □ Suprapubic catheter:
   
   RIGHT COLUMN:
   □ Urostomy
   □ Indwelling/foley catheter:
   □ Intermittent catheterization:
   □ UTI signs/symptoms:
   
   Extract EACH CHECKED item.
   
   ═══════════════════════════════════════════════════════════════════
   STEP 2B: EXTRACT GASTROINTESTINAL ASSESSMENT
   ═══════════════════════════════════════════════════════════════════
   Find "Last BM [date]" - extract date if present
   Find "Gastrointestinal Assessment" with "Select all that apply"
   
   LEFT COLUMN:
   ☑ No problems identified (if checked!)
   □ Ascites
   □ Hemorrhoids
   □ Nausea
   □ Tenderness
   □ Abnormal bowel sounds:
   
   MIDDLE COLUMN:
   □ Bowel incontinence
   □ Hard
   □ Laxative/Enema use
   □ Pain
   □ Vomiting
   □ Abnormal stool:
   
   RIGHT COLUMN:
   □ Distended
   □ Heartburn/Reflux
   □ Laxative/Enema abuse
   □ Rectal bleeding
   □ Ostomy:
   
   Extract EACH CHECKED item separately.
   
   ═══════════════════════════════════════════════════════════════════
   STEP 3: CHECK COMMENTS
   ═══════════════════════════════════════════════════════════════════
   Extract any "Comments:" text
   
   EXAMPLE:
   [
     {"item": "Genitourinary - No problems identified", "currentValue": "Checked", "currentDescription": "No genitourinary problems identified"},
     {"item": "Last BM", "currentValue": "11/06/2025", "currentDescription": "Last bowel movement on 11/06/2025"},
     {"item": "Gastrointestinal - No problems identified", "currentValue": "Checked", "currentDescription": "No gastrointestinal problems identified"}
   ]

10. NEURO/EMOTIONAL/BEHAVIORAL STATUS SECTION:
    🚨 CRITICAL: Extract ALL data from "NEURO/EMOTIONAL/BEHAVIORAL STATUS" section! 🚨
    
    ═══════════════════════════════════════════════════════════════════
    STEP 1: FIND THE SECTION (Page 5-6)
    ═══════════════════════════════════════════════════════════════════
    Look for header: "NEURO/EMOTIONAL/BEHAVIORAL STATUS"
    Then find: "Neurological Assessment"
    
    ═══════════════════════════════════════════════════════════════════
    STEP 2: EXTRACT "ORIENTED TO" SECTION
    ═══════════════════════════════════════════════════════════════════
    Find "Oriented To" with checkboxes:
    ☑ Person (if checked!)
    ☑ Place (if checked!)
    ☑ Time (if checked!)
    
    Extract:
    - If all 3 are checked: "Oriented x3 (Person, Place, Time)"
    - If only some checked: list which ones
    
    ═══════════════════════════════════════════════════════════════════
    STEP 3: EXTRACT "Select all that apply" CHECKBOXES
    ═══════════════════════════════════════════════════════════════════
    
    LEFT COLUMN:
    ☑ No problems identified (if checked!)
    □ Dizziness
    □ Spasticity:
    □ Tremors:
    
    MIDDLE COLUMN:
    □ Forgetful
    □ Headache
    □ Rigidity
    □ Abnormal behavior:
    
    RIGHT COLUMN:
    □ Loss of sensation
    □ Lethargic
    □ Seizure precautions
    □ Neuromuscular weakness/loss:
    
    Extract EACH CHECKED item.
    
    ═══════════════════════════════════════════════════════════════════
    STEP 4: EXTRACT "Plan of Care: Mental/Cognitive Status"
    ═══════════════════════════════════════════════════════════════════
    Find section "Plan of Care: Mental/Cognitive Status"
    Look for "Select all that apply. Selections will populate in the plan of care."
    
    Checkboxes may include:
    □ Oriented X3
    □ Oriented to self only
    □ Oriented to self and place
    □ Agitated
    ☑ Disoriented (if checked!)
    □ Comatose
    □ Forgetful
    □ Depressed
    ☑ Lethargic (if checked!)
    □ Other:
    
    Extract EACH CHECKED item from plan of care.
    
    ═══════════════════════════════════════════════════════════════════
    STEP 5: CHECK COMMENTS
    ═══════════════════════════════════════════════════════════════════
    Extract any "Comments:" text
    
    EXAMPLE:
    [
      {"item": "Oriented To", "currentValue": "Person, Place, Time", "currentDescription": "Patient is oriented to person, place, and time (x3)"},
      {"item": "Neuro - No problems identified", "currentValue": "Checked", "currentDescription": "No neurological problems identified"},
      {"item": "Plan of Care - Disoriented", "currentValue": "Selected", "currentDescription": "Disorientation documented in plan of care"},
      {"item": "Plan of Care - Lethargic", "currentValue": "Selected", "currentDescription": "Lethargy documented in plan of care"}
    ]

11. EMOTIONAL STATUS (if separate section):
    If you find a separate "Emotional Status" section, extract it.
    
12. BEHAVIORAL STATUS (if separate section):
    If you find a separate "Behavioral Status" section, extract it.
    
⚠️⚠️⚠️ CRITICAL EXTRACTION RULES FOR ALL STATUS SECTIONS ⚠️⚠️⚠️

1. FIND SECTION HEADERS: Look for exact text like "PAIN STATUS", "CARDIAC STATUS", etc.
2. FIND CHECKBOXES: Look for checkbox symbols: □ ☑ ✓ ☒ ✗ (checked vs unchecked)
3. EXTRACT ONLY CHECKED ITEMS: Only extract items that have a checkmark (☑, ✓, ☒)
4. IGNORE UNCHECKED ITEMS: Do NOT extract items with empty boxes (□)
5. EXTRACT CHECKBOX LABELS: Get the full text next to the checked box
6. FORMAT CORRECTLY: Use the item name, mark as "Present" or "Checked", include description
7. CHECK COMMENTS: Always look for "Comments:" fields and extract any text
8. BE PRECISE: Only extract what you actually see - do NOT make up data
9. EMPTY SECTIONS: If no checkboxes are marked, extract "No problems identified" if checked
10. STRUCTURED DATA: Each checkbox = one item in the array

EXAMPLE OF GOOD EXTRACTION:
If you see:
  ☑ Cool
  □ Warm
  ☑ Dry
  □ Moist

Extract:
[
  {"item": "Skin - Cool", "currentValue": "Present", "currentDescription": "Skin is cool"},
  {"item": "Skin - Dry", "currentValue": "Present", "currentDescription": "Skin is dry"}
]

DO NOT extract "Warm" or "Moist" because they are UNCHECKED!

⚠️⚠️⚠️ BEFORE YOU RETURN - FINAL MEDICATION CHECK! ⚠️⚠️⚠️
Have you extracted medications? If this is an OASIS document, it MUST have:
- M2001 (Drug Regimen Review) - nearly ALWAYS present
- M2010 (High Risk Drug Education) - often present  
- M2020 (Management of Oral Medications) - ALWAYS present if patient takes meds
- M2030 (Management of Injectable Medications) - present if patient takes injections

🚨 If you haven't found ANY medication fields, GO BACK and search again!
Search for: "M2001", "M2010", "M2020", "M2030", "Drug Regimen", "Medication Management"

RETURN THIS EXACT JSON STRUCTURE:
⚠️ IMPORTANT: Use EMPTY arrays [] ONLY if data truly doesn't exist!

{
  "patientInfo": {
    "name": "ACTUAL patient name OR 'Not visible' if not found",
    "mrn": "ACTUAL MRN OR 'Not visible' if not found",
    "visitType": "SOC/ROC/Recert OR 'Not visible' if not found",
    "payor": "FULL payor text OR 'Not visible' if not found",
    "visitDate": "MM/DD/YYYY OR 'Not visible' if not found",
    "clinician": "Clinician name OR 'Not visible' if not found"
  },
  "primaryDiagnosis": {
    "code": "ACTUAL ICD-10 code OR 'Not found' if not in document",
    "description": "ACTUAL description OR 'Not found' if not in document",
    "confidence": 95
  },
  "secondaryDiagnoses": [],
  "activeDiagnoses": [],  // M1028 - Active diagnoses being treated
  "functionalStatus": [],
  "medications": [],  // ⚠️ Should have M2001, M2020 at minimum if OASIS!
  "painStatus": [],
  "integumentaryStatus": [],
  "respiratoryStatus": [],
  "cardiacStatus": [],
  "eliminationStatus": [],
  "neuroEmotionalBehavioralStatus": [],
  "emotionalStatus": [],
  "behavioralStatus": []
}

⚠️ IF THIS IS AN OASIS DOCUMENT with data, extract it like this:

EXAMPLE 1 - OASIS Medication Fields (MOST COMMON):
{
  "medications": [
    {"item": "M2001 - Drug Regimen Review", "currentValue": "0", "currentDescription": "No - No issues found during review"},
    {"item": "M2010 - High Risk Drug Education", "currentValue": "1", "currentDescription": "Yes - Patient/caregiver received education"},
    {"item": "M2020 - Management of Oral Medications", "currentValue": "1", "currentDescription": "Independent - Able to take correct medication(s)"},
    {"item": "M2030 - Management of Injectable Medications", "currentValue": "N/A", "currentDescription": "Patient not taking injectable medications"}
  ]
}

EXAMPLE 2 - Individual Medications (if medication list present):
{
  "medications": [
    {"item": "M2001 - Drug Regimen Review", "currentValue": "0", "currentDescription": "No issues found"},
    {"item": "Medication - Metformin", "currentValue": "500mg", "currentDescription": "500mg PO BID for diabetes"},
    {"item": "Medication - Lisinopril", "currentValue": "10mg", "currentDescription": "10mg PO daily for hypertension"}
  ]
}

EXAMPLE 3 - Pain Status Section:
{
  "painStatus": [
    {"item": "Pain Location", "currentValue": "Lower back", "currentDescription": "Patient reports lower back pain, radiating to right leg"},
    {"item": "Pain Intensity", "currentValue": "7/10", "currentDescription": "Current pain level: 7 out of 10, described as severe"},
    {"item": "Pain Frequency", "currentValue": "Daily", "currentDescription": "Pain occurs daily, constant throughout the day"},
    {"item": "Pain Type", "currentValue": "Sharp", "currentDescription": "Sharp, shooting pain with movement"}
  ]
}

EXAMPLE 4 - Integumentary Status Section:
{
  "integumentaryStatus": [
    {"item": "Skin Integrity", "currentValue": "Intact", "currentDescription": "Skin warm, dry, intact, no lesions noted"},
    {"item": "Pressure Ulcer", "currentValue": "Stage 2", "currentDescription": "Stage 2 pressure ulcer on sacrum, 2cm x 2cm, shallow"},
    {"item": "Wound Treatment", "currentValue": "Hydrocolloid", "currentDescription": "Hydrocolloid dressing applied daily to sacral wound"}
  ]
}

EXAMPLE 5 - Respiratory Status Section:
{
  "respiratoryStatus": [
    {"item": "Breath Sounds", "currentValue": "Clear", "currentDescription": "Bilateral breath sounds clear, no wheezing or crackles"},
    {"item": "Oxygen Use", "currentValue": "2L NC", "currentDescription": "Oxygen at 2 liters per minute via nasal cannula"},
    {"item": "Respiratory Rate", "currentValue": "18", "currentDescription": "Respiratory rate 18 breaths per minute"}
  ]
}

EXAMPLE 6 - Cardiac Status Section:
{
  "cardiacStatus": [
    {"item": "Heart Rate", "currentValue": "78", "currentDescription": "Heart rate 78 beats per minute, regular rhythm"},
    {"item": "Blood Pressure", "currentValue": "138/82", "currentDescription": "Blood pressure 138/82 mmHg"},
    {"item": "Edema", "currentValue": "1+ bilateral", "currentDescription": "1+ pitting edema bilateral lower extremities"}
  ]
}

EXAMPLE 7 - Elimination Status Section:
{
  "eliminationStatus": [
    {"item": "Bowel", "currentValue": "Daily", "currentDescription": "Bowel movement daily, soft, brown, no issues"},
    {"item": "Bladder", "currentValue": "Continent", "currentDescription": "Continent of bladder, voids without difficulty"},
    {"item": "Catheter", "currentValue": "None", "currentDescription": "No catheter or ostomy present"}
  ]
}

EXAMPLE 8 - Neuro/Emotional/Behavioral Status Section:
{
  "neuroEmotionalBehavioralStatus": [
    {"item": "Alert and Oriented", "currentValue": "A&Ox3", "currentDescription": "Alert and oriented to person, place, and time"},
    {"item": "Emotional State", "currentValue": "Stable", "currentDescription": "Mood stable, no signs of depression or anxiety"},
    {"item": "Behavior", "currentValue": "Cooperative", "currentDescription": "Patient cooperative with care, follows instructions"}
  ]
}

EXAMPLE 9 - Emotional Status (D0150 Patient Mood Interview PHQ-2/PHQ-9):
🚨 CRITICAL: If you find "Emotional Status" or "D0150" or "Patient Mood Interview (PHQ 2-9)" as a SEPARATE section → Extract as "emotionalStatus"!
{
  "emotionalStatus": [
    {"item": "D0150 - Little interest or pleasure in doing things", "currentValue": "1", "currentDescription": "Symptom Presence: Yes | Symptom Frequency: Never or 1 day"},
    {"item": "D0150 - Feeling down, depressed or hopeless", "currentValue": "1", "currentDescription": "Symptom Presence: Yes | Symptom Frequency: Never or 1 day"},
    {"item": "PHQ-2 Screening Result", "currentValue": "Positive", "currentDescription": "Patient screens positive on PHQ-2. Further assessment may be indicated."}
  ]
}

EXAMPLE 10 - Behavioral Status (if separate from Emotional/Neuro):
{
  "behavioralStatus": [
    {"item": "E0200 - Behavioral symptoms", "currentValue": "0", "currentDescription": "No behavioral symptoms observed"},
    {"item": "Agitation/Aggression", "currentValue": "Not present", "currentDescription": "No signs of agitation or aggression"}
  ]
}

EXAMPLE 11 - Functional Status (if M1800-M1870 present):
{
  "functionalStatus": [
    {"item": "M1800 - Grooming", "currentValue": "0", "currentDescription": "Able to groom self unaided"}
  ]
}

🚨 IF DATA DOES NOT EXIST IN THE DOCUMENT:
{
  "functionalStatus": [],
  "medications": [],
  "secondaryDiagnoses": []
}

⚠️ CRITICAL RULES:
1. Extract ACTUAL values from the document - no placeholders, no examples
2. Search the ENTIRE ${extractedText.length} characters
3. 🚨 FUNCTIONAL STATUS: 
   - ONLY extract if M1800-M1870 items ACTUALLY EXIST in the document
   - If document does NOT have these items → Return EMPTY array: []
   - If document HAS these items → Extract ALL that exist (may be 0, 3, 5, 7, 9, or any number)
   - Different OASIS PDFs have DIFFERENT numbers of functional status items - this is NORMAL
   - DO NOT assume there are always 9 items - extract only what exists
   - DO NOT make up functional status data!
4. 🚨 MEDICATIONS:
   - ONLY extract medications that ACTUALLY EXIST in the document
   - If document does NOT have medication section → Return EMPTY array: []
   - If found: Extract ALL medications with full details
   - DO NOT make up medication data!
5. 🚨 DIAGNOSES:
   - ONLY extract diagnoses that ACTUALLY EXIST in the document
   - If no ICD-10 codes found → Return "Not found" for primary, empty array for secondary
   - DO NOT make up diagnosis codes!
6. Return valid JSON only - no markdown, no explanations

⚠️ FINAL MANDATORY CHECKS BEFORE RETURNING:

🚨🚨🚨 MOST IMPORTANT CHECK: DID YOU MAKE UP ANY DATA? 🚨🚨🚨
- Is every piece of data you're returning ACTUALLY in the document?
- If you cannot find functional status (M1800-M1870) → Return functionalStatus: []
- If you cannot find medications → Return medications: []
- If you cannot find diagnoses → Return "Not found"
- NEVER INVENT DATA THAT DOESN'T EXIST!

CHECK 1 - FUNCTIONAL STATUS:
- Did you find M1800, M1810, M1820, etc. in the document?
- If YES → Extract what you found (could be 1-9 items)
- If NO → Return EMPTY array: [] (DO NOT MAKE UP DATA!)

CHECK 2 - MEDICATIONS (⚠️ CRITICAL - READ CAREFULLY):
🚨 MEDICATIONS ARE IN 90% OF OASIS DOCUMENTS - SEARCH THOROUGHLY! 🚨

Have you searched these specific locations?
- ✓ Character positions 30000-70000 (where medications usually are)
- ✓ Searched for "M2001", "M2010", "M2020", "M2030"? 
- ✓ Searched for "Medication", "Drug", "Rx", "Med"?
- ✓ Searched for common drug names (Metformin, Lisinopril, Aspirin)?
- ✓ Looked for medication tables with columns?
- ✓ Looked for checkboxes with medication fields?

If you found ANY of these → EXTRACT THEM ALL!
- M2001, M2010, M2020, M2030 fields (even if N/A or 0)
- ANY individual medications mentioned
- ANY medication-related checkboxes

⚠️ ONLY return medications: [] if you have searched ALL locations above and found NOTHING!

Common medication field formats to recognize:
- "(M2001) Drug Regimen Review: ☑ 0"
- "(M2020) Management of Oral Medications: ☑ 1"
- "Medication: Metformin 500mg PO BID"
- "Current Medications: [list of drugs]"

CHECK 3 - PAIN ASSESSMENT:
Have you searched for Pain Status section?
- ✓ Searched for "PAIN STATUS", "Pain Assessment", "Section J"?
- ✓ Searched for "J0510", "J0520", "J0530"?
- ✓ Looked for narrative pain data (intensity, frequency, site)?
- ✓ Checked pages 4-7 where pain data usually appears?

If you found ANY of these → EXTRACT THEM ALL!
- J0510, J0520, J0530, M1242 fields
- Narrative pain information (intensity, site, interference)
- Pain description and frequency

⚠️ ONLY return painAssessment: [] if you have searched ALL locations and found NOTHING!

Common pain data formats:
- "(J0510) Pain Effect on Sleep: ☑ 3 - Frequently"
- "Current Pain Intensity: 6 - Intense"
- "Has patient had any pain? Yes"
- "Pain interferes with activity: Daily"

CHECK 4 - EMOTIONAL STATUS:
🚨🚨🚨 CRITICAL - EMOTIONAL STATUS MUST BE A SEPARATE FIELD! 🚨🚨🚨

⚠️ DO NOT combine emotional data with neuro or behavioral data!
⚠️ If you see "Emotional Status" as a section header → Extract as SEPARATE "emotionalStatus" field!
⚠️ If you see "D0150" or "Patient Mood Interview (PHQ 2-9)" → Extract as SEPARATE "emotionalStatus" field!

MANDATORY SEARCH LOCATIONS:
- ✓ Page 11 (typical location for Emotional Status section)
- ✓ Search for exact text: "Emotional Status" as section header
- ✓ Search for "D0150", "PHQ-2", "PHQ-9", "Patient Mood Interview"
- ✓ Search for "Little interest or pleasure in doing things"
- ✓ Search for "Feeling down, depressed or hopeless"
- ✓ Look for "Symptom Presence" and "Symptom Frequency" columns

🚨 IF YOU FIND A SECTION WITH HEADER "Emotional Status" OR "D0150":
→ MUST extract as "emotionalStatus": [...]
→ DO NOT put in "neuroEmotionalBehavioralStatus"
→ Keep them SEPARATE!

WHAT TO EXTRACT AS "emotionalStatus":
- D0150 Patient Mood Interview items
- PHQ-2 questions: "Little interest or pleasure", "Feeling down, depressed or hopeless"
- PHQ-9 extended questions (if present)
- Symptom Presence values (0=No, 1=Yes)
- Symptom Frequency values (0=Never or 1 day, 1=2-6 days, 2=7-11 days, 3=12-14 days)
- Any depression or anxiety screening data

⚠️ ONLY return emotionalStatus: [] if "Emotional Status" section does NOT exist in document!

Common emotional status data formats:
- "[D0150] Patient Mood Interview (PHQ 2-9)"
- "Little interest or pleasure in doing things: 1. Yes (enter 0-3 in column 2)"
- "Symptom Presence: 1. Yes  |  Symptom Frequency: 0. Never or 1 day"
- "Feeling down, depressed or hopeless: A2. Symptom frequency: 0. Never or 1 day"
- "B. Feeling down, depressed or hopeless: B1. Symptom Presence: 1. Yes"

CHECK 5 - BEHAVIORAL STATUS:
Have you searched for Behavioral Status section (if separate from Emotional)?
- ✓ Searched for "Behavioral Status", "Behavior", "E0200", "E0800"?
- ✓ Looked for behavioral symptoms (wandering, verbal disruption, physical aggression)?
- ✓ Checked for behavioral intervention data?

If you found ANY of these as SEPARATE from Emotional → EXTRACT AS "behavioralStatus"!
- E0200 (Behavioral symptoms)
- E0800 (Behavior intervention)
- ANY behavioral assessment data

⚠️ If behavioral data is COMBINED with emotional/neuro data → Put it in "neuroEmotionalBehavioralStatus"!
⚠️ ONLY return behavioralStatus: [] if truly separate section not found!

CHECK 6 - EMOTIONAL STATUS (CRITICAL VERIFICATION):
🚨 IF YOU SAW "Emotional Status" OR "D0150" AS A SECTION HEADER:
- Did you extract it as SEPARATE "emotionalStatus" field? → MUST BE YES!
- Did you accidentally put it in "neuroEmotionalBehavioralStatus"? → MUST BE NO!
- Emotional Status MUST be its own field if the section exists!

⚠️ DOUBLE CHECK:
- "emotionalStatus": [] is ONLY correct if "Emotional Status" section does NOT exist
- "emotionalStatus": [...] MUST have data if you saw "D0150" or "Patient Mood Interview"

CHECK 7 - DIAGNOSES:
- Did you find ICD-10 codes in the document?
- If YES → Extract what you found
- If NO → Return "Not found" for primary, empty array for secondary

⚠️ REMEMBER: It's better to return EMPTY data than FAKE data!
- Empty functionalStatus: [] is CORRECT for non-OASIS documents
- Empty medications: [] is CORRECT if no medications found
- Empty painStatus: [] is CORRECT if no pain data found
- Empty emotionalStatus: [] is CORRECT ONLY if "Emotional Status" section does NOT exist
- Empty behavioralStatus: [] is CORRECT if behavioral data is not separate
- "Not found" is CORRECT if data doesn't exist

DO NOT RETURN fabricated/invented data!`

  // Use same retry logic for reliability
  let lastError: Error | null = null
  let attempt = 0
  const maxAttempts = 2 // OPTIMIZED: 2 attempts with 3-min timeout each for faster extraction
  let text = ''

  while (attempt < maxAttempts) {
    attempt++
    try {
      // ✅ Use Gemini (faster, 1M context) with OpenAI fallback
      const aiModel = useGemini 
        ? google("gemini-2.0-flash")
        : openai("gpt-4o-mini")
      
      console.log(`[OASIS] PASS 1 - ${useGemini ? 'Gemini' : 'OpenAI'} call attempt ${attempt}/${maxAttempts}`)
      
      const response = await generateText({
        model: aiModel,
        prompt: extractionPrompt,
        temperature: 0.1,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(180000), // OPTIMIZED: 3 minutes for faster extraction
      })
      
      text = response.text
      console.log(`[OASIS] ✅ PASS 1 complete on attempt ${attempt} - Raw data extracted:`, text.length, 'characters')
      lastError = null
      break
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[OASIS] ⚠️ PASS 1 Attempt ${attempt} failed:`, lastError.message)
      
      // Check if retryable
      const errorMsg = lastError.message.toLowerCase()
      const isRetryable = 
        errorMsg.includes('timeout') || 
        errorMsg.includes('socket') ||
        errorMsg.includes('aborted') ||
        errorMsg.includes('connect') ||
        errorMsg.includes('network')
      
      if (attempt < maxAttempts && isRetryable) {
        const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000) // 5s → 10s → 20s → 30s max (for rate limits)
        console.log(`[OASIS] Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else if (!isRetryable) {
        throw lastError
      }
    }
  }

  if (lastError && !text) {
    throw lastError
  }
  
  return text
}

async function analyzeAndOptimize(
  rawDataJson: string, 
  extractedText: string,
  qaType: string = 'comprehensive-qa',
  notes: string = ''
): Promise<string> {
  console.log('[OASIS] 🎯 PASS 2: Analyzing and optimizing extracted data...')
  console.log('[OASIS] 📊 QA Type:', qaType)
  
  // Build QA-specific analysis instructions
  const qaAnalysisInstructions = getQAAnalysisInstructions(qaType)
  const notesSection = notes ? `\n\n📝 SPECIAL INSTRUCTIONS FROM REVIEWER:\n${notes}\nConsider these instructions when analyzing and optimizing.\n` : ''
  
  const analysisPrompt = `⚠️⚠️⚠️ CRITICAL ANALYSIS TASK - PASS 2 OF 2 ⚠️⚠️⚠️

You received extracted data in PASS 1. Now you MUST perform comprehensive multi-domain analysis.

${qaAnalysisInstructions}${notesSection}

EXTRACTED DATA FROM PASS 1:
${rawDataJson}

ORIGINAL DOCUMENT TEXT (for reference):
${extractedText.substring(0, 60000)}

===========================================================
COMPREHENSIVE ANALYSIS REQUIREMENTS
===========================================================

Based on the extracted data above, perform analysis across these domains:

SECTION C — COMPREHENSIVE QA REVIEW:
• Evaluate missing required OASIS fields
• Identify contradictions
• Check functional inconsistencies
• Verify diagnosis mismatch
• Check medication mismatch
• Review clinical status inconsistencies
• Identify missing wound or pain documentation
• Check date conflicts
• Return QA score and list of issues

SECTION D — CODING REVIEW (ICD-10 + PDGM):
Perform comprehensive coding review:

1. VALIDATE ALL ICD-10 CODES:
   • Verify accuracy of all diagnosis codes (primary and secondary)
   • Check code specificity (use most specific code available)
   • Validate documentation support for each code
   • Ensure codes follow CMS coding guidelines
   • Check for coding errors or inconsistencies

2. RECOMMEND OPTIMIZED CODES:
   • Suggest codes that improve clinical accuracy
   • Recommend codes that optimize reimbursement (when clinically justified)
   • Identify more specific codes when available
   • Suggest codes that better reflect patient condition
   • Provide rationale for each recommendation with clinical and reimbursement impact

3. IDENTIFY MISSING MEDICALLY-NECESSARY DIAGNOSES:
   • Review all documented conditions and treatments
   • Identify conditions that should be coded but are missing
   • Flag medically-necessary diagnoses not currently coded
   • Recommend additional codes that support medical necessity
   • Ensure all active conditions are properly coded

Also analyze:
• Appropriateness of primary diagnosis
• Secondary diagnosis alignment
• Comorbidity group validation
• PDGM grouping risk
• Downcoding risk
• Missing severity-supporting details
• Code sequencing and principal diagnosis selection

Return coding errors, optimized code recommendations, and missing diagnoses with detailed rationale.

SECTION E — FINANCIAL OPTIMIZATION REVIEW:
Perform comprehensive financial optimization:

1. IDENTIFY DOCUMENTATION AFFECTING CASE-MIX, LUPA, AND REIMBURSEMENT:
   • Analyze all documentation that impacts case-mix weight calculation
   • Identify LUPA risk factors and visit count documentation
   • Review documentation affecting reimbursement levels
   • Assess functional status documentation completeness
   • Check therapy visit documentation for threshold requirements
   • Evaluate diagnosis documentation for PDGM grouping

2. HIGHLIGHT MISSING FUNCTIONAL DEFICITS:
   • Identify functional deficits documented in clinical notes but not coded in M1800-M1870
   • Flag missing functional status items that should be documented
   • Highlight inconsistencies between clinical documentation and functional scores
   • Identify opportunities to document functional deficits more accurately
   • Review all ADL/IADL areas for missing deficit documentation

3. SUGGEST IMPROVEMENTS:
   • Recommend specific documentation improvements for case-mix optimization
   • Suggest functional status coding improvements (when clinically justified)
   • Provide recommendations to reduce LUPA risk
   • Suggest therapy visit documentation improvements
   • Recommend documentation enhancements for higher reimbursement
   • Provide specific, actionable steps for each improvement

Also evaluate:
• Functional scores affecting payment
• Calculate potential optimized revenue
• Return financial score, current vs optimized revenue, detailed breakdown

SECTION F — QAPI AUDIT REVIEW:
Perform comprehensive QAPI audit:

1. IDENTIFY REGULATORY DEFICIENCIES:
   • Review compliance with CMS Conditions of Participation (CoPs)
   • Identify deficiencies in documentation requirements
   • Flag regulatory violations or non-compliance issues
   • Assess adherence to state and federal regulations
   • Check for missing required regulatory elements
   • Identify areas of regulatory risk

2. CHECK PLAN OF CARE, GOALS, RISK MITIGATION, SAFETY INSTRUCTIONS:
   • Review plan of care completeness and appropriateness
   • Verify goals are specific, measurable, and time-bound
   • Check risk mitigation strategies are documented
   • Assess safety instructions are provided and clear
   • Verify care plan aligns with patient needs and diagnoses
   • Check for evidence of care plan implementation
   • Review goal progress documentation

3. FLAG INCOMPLETE OR CONTRADICTORY ELEMENTS:
   • Identify incomplete documentation sections
   • Flag contradictory information across sections
   • Highlight inconsistencies in care plan vs. actual care
   • Identify gaps between documented goals and interventions
   • Flag safety instructions that contradict clinical findings
   • Check for conflicting information in different parts of document

Also:
• Detect systemic patterns
• Identify staff training gaps
• Provide root cause analysis
• Return QAPI improvement recommendations with specific actions

SECTION G — FUNCTIONAL STATUS OPTIMIZATION (REQUIRED):
For EACH functional item (M1800–M1870) found in PASS 1:
1. Give current value (from PASS 1)
2. Determine if value is appropriate based on extracted diagnoses
3. Suggest optimized value ONLY if clinically justified
Justify using actual diagnoses:
• Stroke → assistance required
• Diabetes + neuropathy → higher ADL support
• CHF/COPD → elevated dyspnea support
• Arthritis → mobility impairment
DO NOT suggest values without real justification.

SECTION H — INCONSISTENCY DETECTION (REQUIRED):
Flag real conflicts ONLY using extracted data:
• Stroke diagnosis + all ADLs = 0
• Diabetes diagnosis + no diabetic meds
• Transferring = 4 but Ambulation = 0
• Medication dates conflicting with visit dates
• Pain level high but analgesics missing
Include: sectionA, sectionB, conflictType, severity, recommendation, clinicalImpact

🚨🚨🚨 FIRST: CHECK IF THIS IS AN OASIS DOCUMENT 🚨🚨🚨

Look at the PASS 1 data above:
- If functionalStatus is EMPTY array [] → This is NOT an OASIS document
- If medications is EMPTY array [] → No medications found
- If primaryDiagnosis is "Not found" → No diagnosis codes found

⚠️ IF THIS IS NOT AN OASIS DOCUMENT (empty functionalStatus):
- Do NOT make up functional status data
- Do NOT make up medication data
- Do NOT make up inconsistencies
- Return the data as-is with empty arrays
- Return empty inconsistencies: []

═══════════════════════════════════════════════════════════════════════════════
⚠️⚠️⚠️ TASK #1: FUNCTIONAL STATUS OPTIMIZATION (ONLY IF DATA EXISTS) ⚠️⚠️⚠️
═══════════════════════════════════════════════════════════════════════════════

🚨 ONLY provide suggestions if functionalStatus array has items from PASS 1 🚨
🚨 If functionalStatus is EMPTY [] → Keep it empty, do NOT add fake items! 🚨

For EACH of the 9 functional status items (M1800-M1870), you MUST:
1. Analyze if optimization is clinically appropriate based on diagnoses
2. Provide suggestedValue (REQUIRED - never leave empty!)
3. Provide suggestedDescription (REQUIRED - never leave empty!)
4. Provide clinicalRationale (REQUIRED - reference specific ICD-10 codes!)

OPTIMIZATION LOGIC FOR EACH ITEM:
- If patient has STROKE (I69.xxx) → Most functional items should be 2-3 (requires assistance)
- If patient has HEART FAILURE (I50.xxx) → Bathing, Ambulation should be 2-4 (limited endurance)
- If patient has DIABETES (E11.xxx) → Consider neuropathy impact on ambulation/dressing
- If patient has DEMENTIA (F01-F03) → Consider cognitive impact on all activities
- If patient has ARTHRITIS (M15-M19) → Dressing, grooming affected by joint pain
- If patient has WEAKNESS (R53.xx) → Transferring, ambulation affected

SCORING GUIDE FOR SUGGESTIONS:
- M1800 Grooming: 0=independent, 1=setup help, 2=someone assists, 3=dependent
- M1810 Dress Upper: 0=independent, 1=setup help, 2=someone helps, 3=dependent
- M1820 Dress Lower: 0=independent, 1=setup help, 2=someone helps, 3=dependent  
- M1830 Bathing: 0-6 scale (higher = more dependent)
- M1840 Toilet Transfer: 0-4 scale (higher = more dependent)
- M1845 Toileting Hygiene: 0-3 scale (higher = more dependent)
- M1850 Transferring: 0-5 scale (higher = more dependent)
- M1860 Ambulation: 0-6 scale (higher = more dependent)
- M1870 Feeding: 0-5 scale (higher = more dependent)

⚠️ RULE: If current value = 0 (independent) but patient has ANY diagnosis suggesting impairment,
          you MUST suggest a higher value (1, 2, or 3) with clinical justification!

═══════════════════════════════════════════════════════════════════════════════
⚠️ MANDATORY TASK #2: MEDICATION MANAGEMENT OPTIMIZATION
═══════════════════════════════════════════════════════════════════════════════

For EACH medication item (M2001, M2010, M2020, M2030), provide suggestions:
- If patient has cognitive impairment + M2020=0 → Suggest 1-2 (needs reminders)
- If patient on high-risk drugs + M2010=0 → Suggest 1 (needs education)
- Reference specific medications and diagnoses in rationale

═══════════════════════════════════════════════════════════════════════════════
⚠️ MANDATORY TASK #3: PAIN ASSESSMENT OPTIMIZATION (IF PAIN DATA EXISTS)
═══════════════════════════════════════════════════════════════════════════════

🚨 ONLY provide suggestions if painAssessment array has items from PASS 1 🚨
🚨 If painAssessment is EMPTY [] → Keep it empty, do NOT add fake items! 🚨

For EACH pain item found in PASS 1, you MUST:
1. Analyze if optimization is clinically appropriate
2. Provide suggestedValue (REQUIRED if optimization possible!)
3. Provide suggestedDescription (REQUIRED if optimization possible!)
4. Provide clinicalRationale (REQUIRED - reference diagnoses and pain patterns!)

OPTIMIZATION LOGIC FOR PAIN:
- If J0510/J0520/J0530 = 0 (no pain) BUT patient has painful conditions → Suggest higher value
- If pain intensity is HIGH (6-10) BUT interference scores are LOW → Suggest consistency
- If patient has chronic pain diagnosis BUT reports no pain → Flag as inconsistency
- Consider pain conditions: arthritis, neuropathy, back pain, post-surgical, cancer

PAIN SCORING GUIDE:
- J0510 (Sleep): 0=no impact, 1=rarely, 2=occasionally, 3=frequently
- J0520 (Therapy): 0=no impact, 1=rarely, 2=occasionally, 3=frequently  
- J0530 (Activities): 0=no impact, 1=rarely, 2=occasionally, 3=frequently
- M1242 (Frequency): 0=no pain, 1=<daily, 2=daily not constant, 3=constant

EXAMPLE: If pain intensity is 8/10 but J0510=0, suggest J0510=2 or 3 with rationale

═══════════════════════════════════════════════════════════════════════════════
⚠️ MANDATORY TASK #4: MOOD ASSESSMENT OPTIMIZATION (IF MOOD DATA EXISTS)
═══════════════════════════════════════════════════════════════════════════════

🚨 ONLY provide suggestions if moodAssessment array has items from PASS 1 🚨
🚨 If moodAssessment is EMPTY [] → Keep it empty, do NOT add fake items! 🚨

For EACH mood item found in PASS 1, you MUST:
1. Analyze if optimization is clinically appropriate
2. Provide suggestedValue (REQUIRED if optimization possible!)
3. Provide suggestedDescription (REQUIRED if optimization possible!)
4. Provide clinicalRationale (REQUIRED - reference diagnoses and behavioral patterns!)

OPTIMIZATION LOGIC FOR MOOD:
- If D0200 PHQ-2 = "No/No" BUT patient has depression diagnosis (F32/F33) → Flag inconsistency
- If D0300 anxiety = 0 BUT patient has anxiety diagnosis (F41) → Suggest higher value
- If patient reports feeling down BUT D0500 depression score = 0 → Suggest rescreening
- Consider mood-affecting conditions: dementia, stroke, chronic pain, COPD

MOOD SCORING GUIDE:
- D0200 PHQ-2: Yes/No for each question (2 Yes = positive screen)
- D0300 Anxiety: 0=not anxious, 1-3=varying degrees
- D0500 Depression: 0-27 score (0-4=minimal, 5-9=mild, 10-14=moderate, 15+=severe)

EXAMPLE: If patient has F32.9 depression but D0200="No, No", flag for clinical review

═══════════════════════════════════════════════════════════════════════════════
⚠️ MANDATORY TASK #5: COGNITIVE ASSESSMENT OPTIMIZATION (IF COGNITIVE DATA EXISTS)
═══════════════════════════════════════════════════════════════════════════════

🚨 ONLY provide suggestions if cognitiveAssessment array has items from PASS 1 🚨
🚨 If cognitiveAssessment is EMPTY [] → Keep it empty, do NOT add fake items! 🚨

For EACH cognitive item found in PASS 1, you MUST:
1. Analyze if optimization is clinically appropriate
2. Provide suggestedValue (REQUIRED if optimization possible!)
3. Provide suggestedDescription (REQUIRED if optimization possible!)
4. Provide clinicalRationale (REQUIRED - reference diagnoses and cognitive patterns!)

OPTIMIZATION LOGIC FOR COGNITIVE:
- If C0200 Delirium components present BUT not documented → Suggest proper assessment
- If BIMS "Not visible" BUT patient has dementia diagnosis → Flag for completion
- If patient independent in all ADLs BUT has severe dementia → Flag inconsistency
- Consider cognitive conditions: dementia, delirium, stroke, TBI

COGNITIVE SCORING GUIDE:
- C0200 Delirium (CAM): Requires acute onset + inattention + (disorganized thinking OR altered consciousness)
- C0500 BIMS: 0-15 (0-7=severely impaired, 8-12=moderately impaired, 13-15=intact)

EXAMPLE: If BIMS score = 5 (severe impairment) but all functional status = 0 (independent), flag inconsistency

═══════════════════════════════════════════════════════════════════════════════
⚠️ MANDATORY TASK #6: INCONSISTENCY DETECTION  
═══════════════════════════════════════════════════════════════════════════════

Detect 2-4 inconsistencies between:
- Diagnosis codes vs functional status values
- Functional status items vs each other
- Medications vs diagnoses
- Pain intensity vs pain interference scores
- Mood/cognitive status vs diagnoses
- Mood/cognitive status vs functional independence

═══════════════════════════════════════════════════════════════════════════════
RETURN THIS JSON STRUCTURE:
═══════════════════════════════════════════════════════════════════════════════
{
  "patientInfo": { ...copy from PASS 1... },
  "primaryDiagnosis": { ...copy from PASS 1... },
  "secondaryDiagnoses": [ ...copy from PASS 1... ],
  "functionalStatus": [
    {
      "item": "M1800 - Grooming",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "2",
      "suggestedDescription": "Someone must assist the patient to groom self",
      "clinicalRationale": "Patient has I69.351 (stroke with hemiplegia). Patients with hemiplegia typically require assistance with bilateral grooming tasks. Current value of 0 is inconsistent with diagnosis."
    },
    {
      "item": "M1810 - Dress Upper Body",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "2",
      "suggestedDescription": "Someone must help patient put on upper body clothing",
      "clinicalRationale": "Patient has I69.351 (stroke with hemiplegia). Upper extremity weakness affects ability to dress independently."
    },
    {
      "item": "M1820 - Dress Lower Body",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "2",
      "suggestedDescription": "Someone must help patient dress lower body",
      "clinicalRationale": "Patient has I69.351 and potential balance issues. Lower body dressing requires standing balance which is typically impaired post-stroke."
    },
    {
      "item": "M1830 - Bathing",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "3",
      "suggestedDescription": "Requires assistance with bathing in shower/tub",
      "clinicalRationale": "Patient has stroke diagnosis. Bathing requires safe transfers and balance. Post-stroke patients typically need supervision or assistance for safety."
    },
    {
      "item": "M1840 - Toilet Transferring",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "2",
      "suggestedDescription": "Requires human assistance for toilet transfers",
      "clinicalRationale": "Patient has I69.351 affecting balance and lower extremity strength. Safe toilet transfers typically require assistance."
    },
    {
      "item": "M1845 - Toileting Hygiene",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "1",
      "suggestedDescription": "Able to manage toileting hygiene with minimal assistance",
      "clinicalRationale": "Patient has hemiplegia. One-handed manipulation for hygiene may require setup assistance."
    },
    {
      "item": "M1850 - Transferring",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "2",
      "suggestedDescription": "Requires minimal human assistance with transfers",
      "clinicalRationale": "Patient has stroke with hemiplegia affecting balance and strength. Safe transfers typically require standby or minimal assistance."
    },
    {
      "item": "M1860 - Ambulation/Locomotion",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "3",
      "suggestedDescription": "Requires human supervision or assistance for ambulation",
      "clinicalRationale": "Patient has I69.351 (stroke with hemiplegia). Gait impairment and fall risk are common. Supervision or assistance typically needed for safe ambulation."
    },
    {
      "item": "M1870 - Feeding or Eating",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "1",
      "suggestedDescription": "Able to feed self with setup help only",
      "clinicalRationale": "Patient has hemiplegia. May need setup assistance (opening containers, cutting food) but can typically feed self once set up."
    }
  ],
  "medications": [
    {
      "item": "M2001 - Drug Regimen Review",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "0",
      "suggestedDescription": "No medication issues identified",
      "clinicalRationale": "Medication regimen reviewed and reconciled."
    },
    {
      "item": "M2020 - Management of Oral Medications",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "2",
      "suggestedDescription": "Requires supervision or reminders for medications",
      "clinicalRationale": "Patient with stroke may have cognitive changes affecting medication compliance. Recommend supervision or pill box setup."
    },
    {
      "item": "M2030 - Management of Injectable Medications",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "2",
      "suggestedDescription": "Requires assistance with injectable medications",
      "clinicalRationale": "Patient with hemiplegia may have difficulty with self-injection. If on insulin or anticoagulant, assistance likely needed."
    }
  ],
  "painStatus": [
    {
      "item": "Has patient had pain",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "",
      "suggestedDescription": "",
      "clinicalRationale": ""
    }
  ],
  "integumentaryStatus": [
    {
      "item": "Skin - [checkbox name]",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "",
      "suggestedDescription": "",
      "clinicalRationale": ""
    }
  ],
  "respiratoryStatus": [
    {
      "item": "Respiratory - [checkbox name]",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "",
      "suggestedDescription": "",
      "clinicalRationale": ""
    }
  ],
  "cardiacStatus": [
    {
      "item": "Cardiac - [checkbox name]",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "",
      "suggestedDescription": "",
      "clinicalRationale": ""
    }
  ],
  "eliminationStatus": [
    {
      "item": "Elimination - [checkbox name]",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "",
      "suggestedDescription": "",
      "clinicalRationale": ""
    }
  ],
  "neuroEmotionalBehavioralStatus": [
    {
      "item": "Neuro - [checkbox name]",
      "currentValue": "[from PASS 1]",
      "currentDescription": "[from PASS 1]",
      "suggestedValue": "",
      "suggestedDescription": "",
      "clinicalRationale": ""
    }
  ],
  "inconsistencies": [
    {
      "sectionA": "Primary Diagnosis: I69.351 (Hemiplegia following stroke)",
      "sectionB": "M1800 Grooming: Value 0 (Independent)",
      "conflictType": "Diagnosis-Functional Status Conflict",
      "severity": "high",
      "recommendation": "Review functional status coding. Patient with hemiplegia should show some impairment.",
      "clinicalImpact": "Current coding may underrepresent patient care needs."
    }
  ],
  "missingInformation": [
    {
      "field": "missing field name",
      "location": "where it should be in OASIS form",
      "impact": "impact on compliance/billing/care",
      "recommendation": "how to complete this field",
      "required": true
    }
  ],
  "qaReview": {
    "qualityScore": 85,
    "issues": [
      {
        "issue": "Missing required OASIS field",
        "severity": "high",
        "location": "Section M0",
        "recommendation": "Complete missing field"
      }
    ]
  },
    "codingReview": {
      "errors": [
        {
          "error": "Primary diagnosis may not be appropriate",
          "severity": "medium",
          "recommendation": "Review diagnosis selection"
        }
      ],
      "suggestions": [
        {
          "code": "optimized ICD-10 code",
          "description": "code description",
          "reason": "rationale for recommendation",
          "revenueImpact": 150,
          "clinicalRationale": "clinical justification for the code",
          "documentationSupport": "where in document this is supported"
        }
      ],
    "validatedCodes": [
      {
        "code": "ICD-10 code",
        "description": "code description",
        "validationStatus": "valid/needs-review/invalid",
        "issues": ["list of issues if any"],
        "recommendation": "recommendation if needs review"
      }
    ],
    "missingDiagnoses": [
      {
        "condition": "condition name documented but not coded",
        "suggestedCode": "ICD-10 code to add",
        "codeDescription": "description of the code",
        "medicalNecessity": "explanation of medical necessity",
        "documentationSupport": "where in document this is supported",
        "revenueImpact": 200,
        "comorbidityLevel": "low/medium/high",
        "clinicalGroup": "PDGM clinical group if applicable"
      }
    ],
    "primaryDiagnosisOptimization": [
      {
        "currentCode": "current primary diagnosis code",
        "suggestedCode": "more specific or optimized code",
        "currentDescription": "current diagnosis description",
        "suggestedDescription": "suggested diagnosis description",
        "reason": "rationale for optimization",
        "documentationSupport": "where in document this is supported",
        "currentClinicalGroup": "current PDGM clinical group",
        "suggestedClinicalGroup": "suggested PDGM clinical group",
        "revenueImpact": 300,
        "clinicalRationale": "clinical justification"
      }
    ],
    "comorbidityOptimization": {
      "currentLevel": "low/medium/high",
      "suggestedLevel": "low/medium/high",
      "currentDiagnosisCount": 0,
      "suggestedDiagnosisCount": 0,
      "missingComorbidities": [
        {
          "condition": "documented condition not coded",
          "suggestedCode": "ICD-10 code",
          "documentationSupport": "where documented",
          "revenueImpact": 250,
          "comorbidityContribution": "explanation of how this affects comorbidity level"
        }
      ],
      "revenueImpact": 400
    }
  },
  "financialOptimization": {
    "currentRevenue": 3000,
    "optimizedRevenue": 3800,
    "breakdown": [
      {
        "category": "Functional Status Optimization",
        "current": 3000,
        "optimized": 3800,
        "difference": 800
      }
    ],
    "documentationImpact": [
      {
        "documentationType": "type of documentation",
        "impact": "case-mix/lupa/reimbursement/all",
        "description": "how it affects revenue",
        "revenueImpact": 150,
        "recommendation": "how to improve"
      }
    ],
    "missingFunctionalDeficits": [
      {
        "deficit": "functional deficit name",
        "location": "where documented in clinical notes",
        "currentStatus": "current functional status value",
        "suggestedDocumentation": "suggested functional status value",
        "revenueImpact": 200,
        "clinicalJustification": "clinical reason for suggestion"
      }
    ],
    "improvements": [
      {
        "improvement": "improvement description",
        "category": "documentation/functional-status/lupa-reduction/therapy/reimbursement",
        "currentState": "current state",
        "suggestedState": "suggested improvement",
        "revenueImpact": 300,
        "actionableSteps": ["step 1", "step 2"],
        "priority": "high/medium/low"
      }
    ]
  },
  "qapiAudit": {
    "deficiencies": [
      {
        "deficiency": "Missing documentation",
        "category": "Documentation Error",
        "severity": "high",
        "rootCause": "Staff training needed",
        "recommendation": "Provide training on OASIS completion"
      }
    ],
    "recommendations": [
      {
        "category": "Training",
        "recommendation": "Staff training on OASIS documentation",
        "priority": "high"
      }
    ],
    "regulatoryDeficiencies": [
      {
        "deficiency": "regulatory deficiency description",
        "regulation": "CMS CoP or regulation reference",
        "severity": "critical/high/medium/low",
        "description": "detailed description",
        "impact": "impact on compliance",
        "recommendation": "how to fix",
        "correctiveAction": "specific corrective action needed"
      }
    ],
    "planOfCareReview": {
      "completeness": "complete/incomplete/missing",
      "issues": [
        {
          "issue": "issue description",
          "location": "where in document",
          "severity": "high/medium/low",
          "recommendation": "how to fix"
        }
      ],
      "goals": [
        {
          "goal": "goal description",
          "status": "met/in-progress/not-met/missing",
          "issues": ["list of issues"],
          "recommendation": "recommendation for goal"
        }
      ],
      "riskMitigation": [
        {
          "risk": "risk identified",
          "mitigationStrategy": "strategy documented",
          "status": "documented/missing/inadequate",
          "recommendation": "recommendation if missing"
        }
      ],
      "safetyInstructions": [
        {
          "instruction": "safety instruction type",
          "status": "present/missing/unclear",
          "location": "where should be documented",
          "recommendation": "recommendation if missing"
        }
      ]
    },
    "incompleteElements": [
      {
        "element": "incomplete element name",
        "location": "where in document",
        "missingInformation": "what is missing",
        "impact": "impact on care/compliance",
        "recommendation": "how to complete",
        "priority": "high/medium/low"
      }
    ],
    "contradictoryElements": [
      {
        "elementA": "first contradictory element",
        "elementB": "second contradictory element",
        "contradiction": "description of contradiction",
        "location": "where found",
        "impact": "impact on care/compliance",
        "recommendation": "how to resolve",
        "severity": "critical/high/medium/low"
      }
    ]
  },
  "suggestedCodes": [
    {
      "code": "additional code",
      "description": "code description",
      "reason": "reason for including",
      "revenueImpact": 150,
      "confidence": 85
    }
  ],
  "corrections": [
    {
      "field": "form field",
      "current": "current value",
      "suggested": "suggested value",
      "reason": "reason for correction",
      "impact": "impact description",
      "revenueChange": 100
    }
  ],
  "riskFactors": [
    {
      "factor": "risk factor",
      "severity": "high",
      "recommendation": "mitigation recommendation"
    }
  ],
  "recommendations": [
    {
      "category": "Documentation",
      "recommendation": "Review and update functional status coding",
      "priority": "high",
      "expectedImpact": "Accurate case mix calculation"
    }
  ],
  "flaggedIssues": [
    {
      "issue": "identified problem",
      "severity": "high",
      "location": "where found",
      "suggestion": "how to resolve"
    }
  ],
  "extractedData": {
    "primaryDiagnosis": { ...copy... },
    "otherDiagnoses": [ ...copy... ],
    "functionalStatus": [ ...with ALL suggestions... ],
    "medications": [ ...with suggestions... ],
    "painStatus": [ ...copy from PASS 1... ],
    "integumentaryStatus": [ ...copy from PASS 1... ],
    "respiratoryStatus": [ ...copy from PASS 1... ],
    "cardiacStatus": [ ...copy from PASS 1... ],
    "eliminationStatus": [ ...copy from PASS 1... ],
    "neuroEmotionalBehavioralStatus": [ ...copy from PASS 1... ],
    "emotionalStatus": [ ...copy from PASS 1 if separate... ],
    "behavioralStatus": [ ...copy from PASS 1 if separate... ]
  },
  "debugInfo": {
    "pagesProcessed": "estimated",
    "extractionQuality": "good/fair/poor",
    "functionalSuggestionsProvided": 9
  },
  "qualityScore": 85,
  "confidenceScore": 90,
  "completenessScore": 88,
  "financialImpact": {
    "currentRevenue": 3000,
    "optimizedRevenue": 3800,
    "increase": 800,
    "breakdown": [{"category": "Functional Status Optimization", "current": 3000, "optimized": 3800, "difference": 800}]
  }
}

═══════════════════════════════════════════════════════════════════════════════
🚨🚨🚨 ABSOLUTE REQUIREMENTS - DO NOT SKIP 🚨🚨🚨
═══════════════════════════════════════════════════════════════════════════════

1. ⚠️ FUNCTIONAL STATUS: ALL 9 items MUST have suggestedValue (NEVER EMPTY!)
   - M1800 Grooming → MUST have suggestedValue
   - M1810 Dress Upper → MUST have suggestedValue  
   - M1820 Dress Lower → MUST have suggestedValue
   - M1830 Bathing → MUST have suggestedValue
   - M1840 Toilet Transfer → MUST have suggestedValue
   - M1845 Toileting Hygiene → MUST have suggestedValue
   - M1850 Transferring → MUST have suggestedValue
   - M1860 Ambulation → MUST have suggestedValue
   - M1870 Feeding → MUST have suggestedValue

2. ⚠️ Each suggestion MUST include clinicalRationale with ICD-10 code reference

3. ⚠️ If current value seems appropriate, still provide suggestion with explanation
   Example: "suggestedValue": "2", "clinicalRationale": "Current value of 2 is appropriate given patient's stroke diagnosis..."

4. ⚠️ MEDICATIONS: M2020, M2030 should have suggestedValue based on patient cognition/function

5. ⚠️ INCONSISTENCIES: Detect 2-4 conflicts between diagnosis and function

6. Return valid JSON only - no markdown, no text before/after JSON`

  // Use same retry logic as callOpenAI for reliability
  let lastError: Error | null = null
  let attempt = 0
  const maxAttempts = 2 // OPTIMIZED: 2 attempts with 3-min timeout each for faster analysis
  let text = ''

  while (attempt < maxAttempts) {
    attempt++
    try {
      // ✅ Use Gemini (faster, 1M context) with OpenAI fallback
      const aiModel = useGemini 
        ? google("gemini-2.0-flash")
        : openai("gpt-4o-mini")
      
      console.log(`[OASIS] PASS 2 - ${useGemini ? 'Gemini' : 'OpenAI'} call attempt ${attempt}/${maxAttempts}`)
      
      const response = await generateText({
        model: aiModel,
        prompt: analysisPrompt,
        temperature: 0.1,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(180000), // OPTIMIZED: 3 minutes for faster analysis
      })
      
      text = response.text
      console.log(`[OASIS] ✅ PASS 2 complete on attempt ${attempt} - Analysis done:`, text.length, 'characters')
      lastError = null
      break
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[OASIS] ⚠️ PASS 2 Attempt ${attempt} failed:`, lastError.message)
      
      // Check if retryable
      const errorMsg = lastError.message.toLowerCase()
      const isRetryable = 
        errorMsg.includes('timeout') || 
        errorMsg.includes('socket') ||
        errorMsg.includes('aborted') ||
        errorMsg.includes('connect') ||
        errorMsg.includes('network')
      
      if (attempt < maxAttempts && isRetryable) {
        const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000) // 5s → 10s → 20s → 30s max (for rate limits)
        console.log(`[OASIS] Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else if (!isRetryable) {
        throw lastError
      }
    }
  }

  if (lastError && !text) {
    throw lastError
  }
  
  return text
}

// ==================== SCORE CALCULATION FUNCTIONS ====================

// Calculate quality score based on data completeness and accuracy
function calculateQualityScore(analysis: OasisAnalysisResult): number {
  // Start with a high base score (85-90) - assume good quality unless proven otherwise
  // This gives more accurate scores in the 80-95% range as requested
  let score = 88
  
  // Check if we have extracted data
  const hasPatientInfo = analysis.patientInfo?.name && analysis.patientInfo?.mrn
  const hasPrimaryDiagnosis = analysis.primaryDiagnosis && 
    analysis.primaryDiagnosis.code && 
    analysis.primaryDiagnosis.code !== 'Not found' && 
    analysis.primaryDiagnosis.code !== 'Z99.89'
  const hasFunctionalStatus = analysis.functionalStatus && analysis.functionalStatus.length > 0
  const hasMedications = analysis.medications && analysis.medications.length > 0
  const hasSecondaryDiagnoses = analysis.secondaryDiagnoses && analysis.secondaryDiagnoses.length > 0
  
  // Deduct points more gently for missing critical data
  if (!hasPatientInfo) {
    score -= 8
  }
  
  if (!hasPrimaryDiagnosis) {
    score -= 10
  }
  
  // Functional status: Don't penalize if it's not always 9 items (different OASIS forms have different counts)
  if (!hasFunctionalStatus) {
    score -= 5
  } else if (analysis.functionalStatus && analysis.functionalStatus.length < 3) {
    // Only penalize if very few items (less than 3)
    score -= 3
  }
  
  if (!hasMedications) {
    score -= 3
  }
  
  if (!hasSecondaryDiagnoses) {
    score -= 2
  }
  
  // Deduct points more gently for missing required fields
  if (analysis.missingInformation) {
    const criticalMissing = analysis.missingInformation.filter(item => item.required).length
    const nonCriticalMissing = analysis.missingInformation.length - criticalMissing
    // More lenient: deduct less points
    score -= (criticalMissing * 2) + (nonCriticalMissing * 0.5)
  }
  
  // Deduct points more gently for inconsistencies
  if (analysis.inconsistencies) {
    const critical = analysis.inconsistencies.filter(i => i.severity?.toLowerCase() === 'critical').length
    const high = analysis.inconsistencies.filter(i => i.severity?.toLowerCase() === 'high').length
    const medium = analysis.inconsistencies.filter(i => i.severity?.toLowerCase() === 'medium').length
    // More lenient: deduct less points
    score -= (critical * 4) + (high * 2) + (medium * 1)
  }
  
  // Add bonus points for complete data (reward good documentation)
  if (hasPatientInfo) {
    score += 1
  }
  
  if (hasPrimaryDiagnosis) {
    score += 1
  }
  
  if (hasFunctionalStatus && analysis.functionalStatus && analysis.functionalStatus.length >= 5) {
    score += 2
  }
  
  if (hasMedications) {
    score += 1
  }
  
  if (hasSecondaryDiagnoses && analysis.secondaryDiagnoses.length >= 3) {
    score += 1
  }
  
  if (analysis.painStatus && analysis.painStatus.length > 0) {
    score += 1
  }
  
  if (analysis.integumentaryStatus && analysis.integumentaryStatus.length > 0) {
    score += 0.5
  }
  
  if (analysis.respiratoryStatus && analysis.respiratoryStatus.length > 0) {
    score += 0.5
  }
  
  if (analysis.cardiacStatus && analysis.cardiacStatus.length > 0) {
    score += 0.5
  }
  
  if (analysis.eliminationStatus && analysis.eliminationStatus.length > 0) {
    score += 0.5
  }
  
  if (analysis.neuroEmotionalBehavioralStatus && analysis.neuroEmotionalBehavioralStatus.length > 0) {
    score += 1
  }
  
  // Ensure score is between 80 and 100 - minimum 80% for all documents
  return Math.max(80, Math.min(100, Math.round(score)))
}

// Calculate confidence score based on data presence and AI extraction confidence
function calculateConfidenceScore(analysis: OasisAnalysisResult, validatedData: OasisAnalysisResult): number {
  let score = 100
  let factors = 0
  let totalConfidence = 0
  
  // Check primary diagnosis confidence
  if (analysis.primaryDiagnosis && typeof analysis.primaryDiagnosis.confidence === 'number') {
    totalConfidence += analysis.primaryDiagnosis.confidence
    factors++
  } else if (analysis.primaryDiagnosis && analysis.primaryDiagnosis.code !== 'Not found') {
    totalConfidence += 85 // Default confidence if diagnosis exists
    factors++
  } else {
    score -= 20 // No primary diagnosis
  }
  
  // Check functional status completeness
  if (analysis.functionalStatus && analysis.functionalStatus.length >= 9) {
    totalConfidence += 95
    factors++
  } else if (analysis.functionalStatus && analysis.functionalStatus.length > 0) {
    totalConfidence += 70
    factors++
    score -= 10 // Partial functional status
  } else {
    score -= 25 // No functional status
  }
  
  // Check medication data
  if (analysis.medications && analysis.medications.length > 0) {
    totalConfidence += 80
    factors++
  } else {
    score -= 10 // No medications
  }
  
  // Check patient info completeness
  if (analysis.patientInfo) {
    const hasName = analysis.patientInfo.name && analysis.patientInfo.name !== 'Not visible' && analysis.patientInfo.name !== 'Patient Name Not Available'
    const hasMRN = analysis.patientInfo.mrn && analysis.patientInfo.mrn !== 'Not visible' && analysis.patientInfo.mrn !== 'MRN Not Available'
    
    if (hasName && hasMRN) {
      totalConfidence += 90
      factors++
    } else if (hasName || hasMRN) {
      totalConfidence += 70
      factors++
      score -= 5
    } else {
      score -= 15
    }
  }
  
  // Check secondary diagnoses
  if (analysis.secondaryDiagnoses && analysis.secondaryDiagnoses.length > 0) {
    totalConfidence += 85
    factors++
  }
  
  // Calculate average confidence from all factors
  const avgConfidence = factors > 0 ? Math.round(totalConfidence / factors) : 60
  
  // Combine base score with average confidence
  const finalScore = Math.round((score * 0.6) + (avgConfidence * 0.4))
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, finalScore))
}

export async function analyzeOasisDocument(
  extractedText: string,
  doctorOrderText?: string,
  options?: {
    qaType?: 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit'
    notes?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    patientId?: string
  }
): Promise<OasisAnalysisResult> {
  
  // Extract options with defaults
  const qaType = options?.qaType || 'comprehensive-qa'
  const notes = options?.notes || ''
  const priority = options?.priority || 'medium'
  const patientId = options?.patientId || ''
  
  // Don't anonymize - let AI extract real patient info directly
  console.log('[OASIS] 📋 Using TWO-PASS analysis system for complete extraction')
  console.log('[OASIS] 📊 QA Type:', qaType)
  console.log('[OASIS] 🎯 Priority:', priority)
  if (patientId) console.log('[OASIS] 👤 Patient ID:', patientId)
  if (notes) console.log('[OASIS] 📝 Special Notes:', notes.substring(0, 100) + (notes.length > 100 ? '...' : ''))
  console.log('[OASIS] Text length:', extractedText.length, 'characters')
  
  // Helper function to get QA type-specific focus instructions
  const getQATypeFocus = (qaType: string): string => {
    switch (qaType) {
      case 'coding-review':
        return `
🎯 PRIMARY FOCUS: CODING REVIEW
Emphasize Section D (Coding Review) with maximum detail:

1. VALIDATE ALL ICD-10 CODES:
   - Verify accuracy of all diagnosis codes (primary and secondary)
   - Check code specificity and documentation support
   - Validate compliance with CMS coding guidelines

2. RECOMMEND OPTIMIZED CODES:
   - Suggest codes for improved clinical accuracy
   - Recommend codes that optimize reimbursement (when clinically justified)
   - Provide rationale for each recommendation

3. IDENTIFY MISSING MEDICALLY-NECESSARY DIAGNOSES:
   - Review all documented conditions and treatments
   - Identify conditions that should be coded but are missing
   - Flag medically-necessary diagnoses not currently coded

Also:
- Assess PDGM grouping support
- Analyze code sequencing and principal diagnosis
- Provide detailed coding recommendations with clinical and reimbursement impact
- Still analyze other sections but prioritize coding elements
`
      case 'financial-optimization':
        return `
🎯 PRIMARY FOCUS: FINANCIAL OPTIMIZATION
Emphasize Section E (Financial Optimization) with maximum detail:

1. IDENTIFY DOCUMENTATION AFFECTING CASE-MIX, LUPA, AND REIMBURSEMENT:
   - Analyze all documentation impacting case-mix weight
   - Identify LUPA risk factors and visit count documentation
   - Review documentation affecting reimbursement levels

2. HIGHLIGHT MISSING FUNCTIONAL DEFICITS:
   - Identify functional deficits in clinical notes but not coded
   - Flag missing functional status items
   - Highlight documentation inconsistencies

3. SUGGEST IMPROVEMENTS:
   - Recommend specific documentation improvements
   - Suggest functional status coding improvements (when clinically justified)
   - Provide actionable steps for revenue optimization

Also:
- Analyze PDGM category alignment
- Calculate financial impact of suggested changes
- Still analyze other sections but prioritize financial elements
`
      case 'qapi-audit':
        return `
🎯 PRIMARY FOCUS: QAPI AUDIT
Emphasize Section F (QAPI Audit) with maximum detail:

1. IDENTIFY REGULATORY DEFICIENCIES:
   - Review CMS CoPs compliance
   - Identify regulatory violations
   - Flag missing regulatory elements

2. CHECK PLAN OF CARE, GOALS, RISK MITIGATION, SAFETY INSTRUCTIONS:
   - Review plan of care completeness
   - Verify goals are appropriate
   - Check risk mitigation strategies
   - Assess safety instructions

3. FLAG INCOMPLETE OR CONTRADICTORY ELEMENTS:
   - Identify incomplete sections
   - Flag contradictions
   - Highlight inconsistencies

Also:
- Provide detailed root cause analysis
- Categorize findings by type
- Offer specific training recommendations
- Still analyze other sections but prioritize QAPI elements
`
      case 'comprehensive-qa':
      default:
        return `
🎯 PRIMARY FOCUS: COMPREHENSIVE QA
Analyze ALL sections with equal emphasis:
- Provide thorough analysis across all domains
- Balance clinical, coding, financial, and compliance perspectives
- Ensure comprehensive coverage of all aspects
`
    }
  }

  const qaTypeFocus = getQATypeFocus(qaType)
  const notesSection = notes ? `\n\n📝 SPECIAL INSTRUCTIONS FROM REVIEWER:\n${notes}\n` : ''
  const prioritySection = priority !== 'medium' ? `\n\n⚡ PRIORITY: ${priority.toUpperCase()}\n` : ''

  const prompt = `You are an OASIS Expert System specialized in:

• Comprehensive QA Review
• Coding Review (ICD-10, PDGM)
• Financial Optimization
• QAPI Audit
• Medication Review
• Functional Status Analysis (M1800–M1870)
• Clinical Status Extraction (pain, integumentary, respiratory, cardiac, elimination, emotional)
• Diagnosis Consistency Validation

Your task is to extract ALL real information from the OASIS text below and then perform a complete multi-domain QA, coding, financial, and QAPI audit.

${qaTypeFocus}${notesSection}${prioritySection}

RULE #1 — NEVER invent or guess data.  
RULE #2 — Extract ONLY real information from the document.  
RULE #3 — If something does not exist → return "Not visible" or empty array.  
RULE #4 — JSON output ONLY, following the structure provided at the end.

===========================================================
SECTION A — DATA EXTRACTION
===========================================================

Extract EXACT patient information:

• Name  
• MRN / Patient ID  
• DOB  
• Visit Date  
• Visit Type (SOC, ROC, Recert, etc.)  
• Payment Source (with checkmark symbol)  
• Clinician Signature + Credentials  

Extract ICD-10 diagnosis codes:

• Primary Diagnosis (M1021) — code + description  
• ALL Secondary Diagnoses (M1023)  
• Active Diagnoses (M1028) based on checkmarks  

Extract ALL functional status items (M1800–M1870) only if present:

• Extract EXACT checked values  
• Extract EXACT descriptions  

If M1800–M1870 section does not exist → functionalStatus = []

Extract ALL medications anywhere in the document:

• Name  
• Dosage  
• Frequency  
• Route  
• Indication (if found)

Expand abbreviations (PO, BID, PRN, TID, QD, etc.)

===========================================================
SECTION B — CLINICAL STATUS EXTRACTION (MANDATORY)
===========================================================

Search the entire document text and extract ACTUAL values found for:

1. **painStatus**
   • Pain severity  
   • Pain location  
   • Pain frequency  
   • Pain effect on function  
   • Any pain questionnaire items  

2. **integumentaryStatus**
   • Wounds  
   • Pressure ulcers  
   • Surgical incisions  
   • Skin tears  
   • Drainage findings  

3. **respiratoryStatus**
   • Dyspnea levels  
   • Oxygen use  
   • Breath sounds  
   • Pulmonary conditions  

4. **cardiacStatus**
   • Edema  
   • Pulse descriptions  
   • Cardiac symptoms  
   • Heart failure indicators  

5. **eliminationStatus**
   • Bowel patterns  
   • Bladder incontinence  
   • Ostomy info  

6. **neuroEmotionalBehavioralStatus**
   • Mental status  
   • Orientation  
   • Behavioral symptoms  
   • Cognitive findings  

7. **emotionalStatus** (if separate)
   • Mood  
   • Depression indicators  
   • Anxiety indicators  

8. **behavioralStatus** (if separate)
   • Aggression  
   • Wandering  
   • Impulsivity  
   • Safety behaviors  

If any category is not present → return empty array [].

===========================================================
SECTION C — COMPREHENSIVE QA REVIEW
===========================================================

Evaluate:

• Missing required OASIS fields  
• Contradictions  
• Functional inconsistencies  
• Diagnosis mismatch  
• Medication mismatch  
• Clinical status inconsistencies  
• Missing wound or pain documentation  
• Date conflicts  

Return QA score and list of issues.

===========================================================
SECTION D — CODING REVIEW (ICD-10 + PDGM)
===========================================================

Perform aggressive coding optimization with strict safety guidelines:

1. PRIMARY DIAGNOSIS OPTIMIZATION:
   • Review appropriateness of primary diagnosis
   • Check if more specific code exists (documented in clinical notes)
   • Evaluate impact on PDGM clinical group assignment
   • Target clinical group changes that increase case mix weight
   • Provide documentation evidence for any suggested changes

2. SECONDARY DIAGNOSIS & COMORBIDITY OPTIMIZATION:
   • Review secondary diagnosis alignment
   • Identify documented conditions not currently coded
   • Validate comorbidity group assignment
   • Target comorbidity level increases (Low → Medium → High)
   • Prioritize suggestions that cross comorbidity thresholds
   • Calculate revenue impact of comorbidity changes

3. CODE SPECIFICITY & ACCURACY:
   • Check for generic codes that can be made more specific
   • Validate code relationships and sequencing
   • Identify missing severity-supporting details
   • Ensure all active conditions affecting care are coded

4. PDGM GROUPING OPTIMIZATION:
   • Analyze PDGM grouping risk
   • Identify downcoding risk
   • Suggest optimizations that improve case mix weight
   • Consider impact on HIPPS code calculation

⚠️ SAFETY REQUIREMENTS:
• ONLY suggest codes EXPLICITLY documented in clinical notes
• NEVER suggest adding undocumented diagnoses
• ALWAYS provide documentation evidence location
• If unclear, recommend documenting condition FIRST

Return coding errors, suggestions, and optimization opportunities with documentation evidence.

===========================================================
SECTION E — FINANCIAL OPTIMIZATION REVIEW
===========================================================

Perform comprehensive financial optimization:

1. IDENTIFY DOCUMENTATION AFFECTING CASE-MIX, LUPA, AND REIMBURSEMENT:
   • Analyze all documentation that impacts case-mix weight calculation
   • Identify LUPA risk factors and visit count documentation
   • Review documentation affecting reimbursement levels
   • Assess functional status documentation completeness
   • Check therapy visit documentation for threshold requirements
   • Evaluate diagnosis documentation for PDGM grouping

2. HIGHLIGHT MISSING FUNCTIONAL DEFICITS:
   • Identify functional deficits documented in clinical notes but not coded in M1800-M1870
   • Flag missing functional status items that should be documented
   • Highlight inconsistencies between clinical documentation and functional scores
   • Identify opportunities to document functional deficits more accurately
   • Review all ADL/IADL areas for missing deficit documentation

3. SUGGEST IMPROVEMENTS:
   • Recommend specific documentation improvements for case-mix optimization
   • Suggest functional status coding improvements (when clinically justified)
   • Provide recommendations to reduce LUPA risk
   • Suggest therapy visit documentation improvements
   • Recommend documentation enhancements for higher reimbursement
   • Provide specific, actionable steps for each improvement

Also evaluate:
• Functional scores affecting payment  
• LUPA risk  
• Potential optimized revenue  

Return:
• Financial score  
• Current vs optimized revenue  
• Detailed breakdown
• Documentation impact analysis
• Missing functional deficits list
• Improvement recommendations with revenue impact  

===========================================================
SECTION F — QAPI AUDIT REVIEW
===========================================================

Perform comprehensive QAPI audit:

1. IDENTIFY REGULATORY DEFICIENCIES:
   • Review compliance with CMS Conditions of Participation (CoPs)
   • Identify deficiencies in documentation requirements
   • Flag regulatory violations or non-compliance issues
   • Assess adherence to state and federal regulations
   • Check for missing required regulatory elements
   • Identify areas of regulatory risk

2. CHECK PLAN OF CARE, GOALS, RISK MITIGATION, SAFETY INSTRUCTIONS:
   • Review plan of care completeness and appropriateness
   • Verify goals are specific, measurable, and time-bound
   • Check risk mitigation strategies are documented
   • Assess safety instructions are provided and clear
   • Verify care plan aligns with patient needs and diagnoses
   • Check for evidence of care plan implementation
   • Review goal progress documentation

3. FLAG INCOMPLETE OR CONTRADICTORY ELEMENTS:
   • Identify incomplete documentation sections
   • Flag contradictory information across sections
   • Highlight inconsistencies in care plan vs. actual care
   • Identify gaps between documented goals and interventions
   • Flag safety instructions that contradict clinical findings
   • Check for conflicting information in different parts of document

Also identify:
• Systemic patterns  
• Staff training gaps  
• Compliance risks  
• Root causes  

Return QAPI improvement recommendations with specific actions and training needs.

===========================================================
SECTION G — FUNCTIONAL STATUS OPTIMIZATION (REQUIRED)
===========================================================

For EACH functional item (M1800–M1870) found:

1. Give current value  
2. Determine if value is appropriate based on extracted diagnoses  
3. Suggest optimized value ONLY if clinically justified  

CRITICAL: When suggesting optimizations, consider the TOTAL functional score impact:
• Low Impairment (0-23 points): If current total is 19-23, suggest improvements that would push to Medium (24+)
• Medium Impairment (24-42 points): If current total is 38-42, suggest improvements that would push to High (43+)
• Target threshold crossings: Suggest enough improvements to cross functional level boundaries when clinically justified

Justify using actual diagnoses:  
• Stroke → assistance required  
• Diabetes + neuropathy → higher ADL support  
• CHF/COPD → elevated dyspnea support  
• Arthritis → mobility impairment  
• ESRD/Dialysis → higher functional dependency
• Multiple comorbidities → increased assistance needs

OPTIMIZATION STRATEGY:
- If patient has complex conditions (ESRD, CHF, COPD, multiple comorbidities), suggest higher impairment levels
- If current score is near a threshold (e.g., 19-23), suggest improvements that would cross to next level (24+)
- Consider all functional items together - don't just optimize one item, optimize multiple items to achieve threshold crossing
- Be clinically aggressive when documentation supports it (e.g., "chairfast", "dependent transfers", "needs assistance")

DO NOT suggest values without real justification, BUT be clinically appropriate and consider total score impact.

===========================================================
SECTION H — INCONSISTENCY DETECTION (REQUIRED)
===========================================================

Flag real conflicts ONLY using extracted data:

• Stroke diagnosis + all ADLs = 0  
• Diabetes diagnosis + no diabetic meds  
• Transferring = 4 but Ambulation = 0  
• Medication dates conflicting with visit dates  
• Pain level high but analgesics missing  

Include:

• sectionA  
• sectionB  
• conflictType  
• severity  
• recommendation  
• clinicalImpact  

===========================================================
SECTION I — OUTPUT FORMAT (MUST FOLLOW EXACTLY)
===========================================================

Return JSON ONLY:

{
  "patientInfo": {
    "name": "extract actual patient name from document",
    "mrn": "extract actual MRN/Patient ID from document",
    "visitType": "extract visit type (SOC/ROC/Recert)",
    "payor": "extract FULL payor description with checkmark",
    "visitDate": "extract visit date",
    "clinician": "extract clinician name with credentials"
  },
  "primaryDiagnosis": {
    "code": "extract primary ICD-10 code (e.g., I69.351, E11.65)",
    "description": "extract full primary diagnosis description",
    "confidence": 95
  },
  "secondaryDiagnoses": [
    {
      "code": "extract secondary ICD-10 code",
      "description": "extract full secondary diagnosis description",
      "confidence": 90
    }
  ],
  "activeDiagnoses": [
    {
      "code": "ICD-10 code",
      "description": "diagnosis description",
      "active": true
    }
  ],
  "functionalStatus": [
    {
      "item": "M1800 - Grooming",
      "currentValue": "extract actual checked value",
      "currentDescription": "extract actual description",
      "suggestedValue": "suggest if clinically justified",
      "suggestedDescription": "description for suggested value",
      "clinicalRationale": "clinical reasoning"
    }
  ],
  "medications": [
    {
      "name": "medication name",
      "dosage": "dosage",
      "frequency": "frequency",
      "route": "route",
      "indication": "indication if found"
    }
  ],
  "extractedData": {
    "painStatus": [],
    "integumentaryStatus": [],
    "respiratoryStatus": [],
    "cardiacStatus": [],
    "eliminationStatus": [],
    "neuroEmotionalBehavioralStatus": [],
    "emotionalStatus": [],
    "behavioralStatus": []
  },
  "missingInformation": [
    {
      "field": "missing field name",
      "location": "where it should be",
      "impact": "impact description",
      "recommendation": "how to fix",
      "required": true
    }
  ],
  "inconsistencies": [
    {
      "sectionA": "specific location with actual value",
      "sectionB": "specific location with actual value",
      "conflictType": "type of conflict",
      "severity": "critical/high/medium/low",
      "recommendation": "how to resolve",
      "clinicalImpact": "impact description"
    }
  ],
  "qaReview": {
    "qualityScore": 0,
    "issues": []
  },
  "codingReview": {
    "errors": [
      {
        "error": "coding error description",
        "severity": "critical/high/medium/low",
        "recommendation": "how to fix the error"
      }
    ],
    "suggestions": [
      {
        "code": "optimized ICD-10 code",
        "description": "code description",
        "reason": "rationale for recommendation",
        "revenueImpact": 150,
        "clinicalRationale": "clinical justification for the code",
        "documentationSupport": "where in document this is supported"
      }
    ],
    "validatedCodes": [
      {
        "code": "ICD-10 code",
        "description": "code description",
        "validationStatus": "valid/needs-review/invalid",
        "issues": ["list of issues if any"],
        "recommendation": "recommendation if needs review"
      }
    ],
    "missingDiagnoses": [
      {
        "condition": "condition name documented but not coded",
        "suggestedCode": "ICD-10 code to add",
        "codeDescription": "description of the code",
        "medicalNecessity": "explanation of medical necessity",
        "documentationSupport": "where in document this is supported",
        "revenueImpact": 200,
        "comorbidityLevel": "low/medium/high",
        "clinicalGroup": "PDGM clinical group if applicable"
      }
    ],
    "primaryDiagnosisOptimization": [
      {
        "currentCode": "current primary diagnosis code",
        "suggestedCode": "more specific or optimized code",
        "currentDescription": "current diagnosis description",
        "suggestedDescription": "suggested diagnosis description",
        "reason": "rationale for optimization",
        "documentationSupport": "where in document this is supported",
        "currentClinicalGroup": "current PDGM clinical group",
        "suggestedClinicalGroup": "suggested PDGM clinical group",
        "revenueImpact": 300,
        "clinicalRationale": "clinical justification"
      }
    ],
    "comorbidityOptimization": {
      "currentLevel": "low/medium/high",
      "suggestedLevel": "low/medium/high",
      "currentDiagnosisCount": 0,
      "suggestedDiagnosisCount": 0,
      "missingComorbidities": [
        {
          "condition": "documented condition not coded",
          "suggestedCode": "ICD-10 code",
          "documentationSupport": "where documented",
          "revenueImpact": 250,
          "comorbidityContribution": "explanation of how this affects comorbidity level"
        }
      ],
      "revenueImpact": 400
    }
  },
  "financialOptimization": {
    "currentRevenue": 0,
    "optimizedRevenue": 0,
    "breakdown": [
      {
        "category": "category name",
        "current": 0,
        "optimized": 0,
        "difference": 0
      }
    ],
    "documentationImpact": [
      {
        "documentationType": "type of documentation",
        "impact": "case-mix/lupa/reimbursement/all",
        "description": "how it affects revenue",
        "revenueImpact": 150,
        "recommendation": "how to improve"
      }
    ],
    "missingFunctionalDeficits": [
      {
        "deficit": "functional deficit name",
        "location": "where documented in clinical notes",
        "currentStatus": "current functional status value",
        "suggestedDocumentation": "suggested functional status value",
        "revenueImpact": 200,
        "clinicalJustification": "clinical reason for suggestion"
      }
    ],
    "improvements": [
      {
        "improvement": "improvement description",
        "category": "documentation/functional-status/lupa-reduction/therapy/reimbursement",
        "currentState": "current state",
        "suggestedState": "suggested improvement",
        "revenueImpact": 300,
        "actionableSteps": ["step 1", "step 2"],
        "priority": "high/medium/low"
      }
    ]
  },
  "qapiAudit": {
    "deficiencies": [
      {
        "deficiency": "deficiency description",
        "category": "category",
        "severity": "high",
        "rootCause": "root cause",
        "recommendation": "recommendation"
      }
    ],
    "recommendations": [
      {
        "category": "category",
        "recommendation": "recommendation",
        "priority": "high"
      }
    ],
    "regulatoryDeficiencies": [
      {
        "deficiency": "regulatory deficiency",
        "regulation": "regulation reference",
        "severity": "critical/high/medium/low",
        "description": "description",
        "impact": "impact",
        "recommendation": "recommendation",
        "correctiveAction": "corrective action"
      }
    ],
    "planOfCareReview": {
      "completeness": "complete/incomplete/missing",
      "issues": [],
      "goals": [],
      "riskMitigation": [],
      "safetyInstructions": []
    },
    "incompleteElements": [
      {
        "element": "element name",
        "location": "location",
        "missingInformation": "missing info",
        "impact": "impact",
        "recommendation": "recommendation",
        "priority": "high/medium/low"
      }
    ],
    "contradictoryElements": [
      {
        "elementA": "element A",
        "elementB": "element B",
        "contradiction": "contradiction",
        "location": "location",
        "impact": "impact",
        "recommendation": "recommendation",
        "severity": "critical/high/medium/low"
      }
    ]
  },
  "financialImpact": {
    "currentRevenue": 0,
    "optimizedRevenue": 0,
    "increase": 0,
    "breakdown": []
  },
  "qualityScore": 0,
  "confidenceScore": 0,
  "completenessScore": 0
}

===========================================================
PROCESS THE TEXT BELOW:
===========================================================

${extractedText.substring(0, 60000)}

${doctorOrderText ? `Additional text:\n${doctorOrderText.substring(0, 5000)}` : ""}

Extract these data fields from the form:

SECTION 1 - DEMOGRAPHICS (top of form):
- Patient Name: Look for the actual patient name in the document. Common formats: "Allan, James" or "(M0040) First Name: James Last Name: Allan". Extract the REAL name as written, not placeholders.
- Patient ID/MRN: Look for "MRN: ALLAN" or "(M0020) ID Number:" and extract the ACTUAL value. IMPORTANT: If "(M0020) ID Number:" has a value OR if "N/A - No Medicaid Number" checkbox is checked, this is VALID and should NOT be flagged as missing
- DOB: Look for "DOB:", "(M0066) Birth Date:", or date fields
- Visit Date: Look for "Visit Date:", "(M0030) Start of Care Date:", or date fields (format: MM/DD/YYYY)
- Visit Type: Look for "Start of Care", "ROC", "Recert", or visit type indicators
- Payor: Look for the payment source section in the document. This is typically labeled as "(M0150) Current Payment Source" or "Payment Source". In this section, find the line that has a checkmark or selection indicator (✓, ☑, X, ●, ■). Extract the ENTIRE text of that line, including the symbol. Examples: "✓ 1 - Medicare (traditional fee-for-service)", "☑ 2 - Medicare (HMO/managed care/Advantage plan)". If no selection symbol is found, return "Not visible"
- Clinician: Look for signature lines at the end of each page. Common patterns: "Signature: Electronically Signed by: [Name] [Credentials]", "Signed by: [Name] [Credentials]", "Electronically Signed by: [Name] [Credentials]". Extract the complete name with credentials (e.g., "Tiffany Petty RN", "John Smith LPN")

SECTION 2 - DIAGNOSIS CODES (CRITICAL - MUST EXTRACT):
⚠️ MANDATORY: You MUST extract diagnosis codes. Look carefully for these patterns:

PRIMARY DIAGNOSIS (M1021):
- Search for "(M1021)" or "Primary Diagnosis Code" or "Primary Diagnosis"
- ICD-10 codes are in format: Letter + Numbers (e.g., "I69.351", "E11.65", "N18.1")
- Look in the first 5-10 pages of the document
- Common locations: Top of diagnosis table, near patient demographics
- Extract BOTH the code AND the full description

SECONDARY/OTHER DIAGNOSES (M1023):
- Search for "(M1023)" or "Other Diagnosis" or secondary diagnosis entries
- Usually in a table format with multiple rows
- Each row has: ICD-10 code + Description + possibly severity level
- Extract ALL diagnosis codes you find (typically 5-15 codes)

ACTIVE DIAGNOSES (M1028):
- Search for "(M1028)" or "Active Diagnoses" or "Payment Diagnoses"
- This section lists which diagnoses from M1021/M1023 are actively being treated
- Look for checkboxes or indicators showing which diagnoses are active
- Common patterns: "☑ M1021a", "☑ M1023b", etc.
- Extract the corresponding diagnosis code and description
- Mark each as "active: true" if checkbox is checked

ICD-10 CODE PATTERNS TO LOOK FOR:
- Format: Letter(s) + Numbers + optional decimal + more numbers
- Examples: I69.351, E11.65, N18.1, L40.9, I12.9, I10, Z79.4
- They may appear with or without dots: "I69351" or "I69.351"
- Usually followed by a description of the condition

⚠️ CRITICAL: Do NOT return "Not visible" for diagnosis codes unless you have thoroughly searched the entire text and confirmed they are truly missing. Diagnosis codes are REQUIRED fields in OASIS forms and are almost always present.

SECTION 3 - FUNCTIONAL STATUS CODES (M1800-M1870):

⚠️ CRITICAL INSTRUCTION - READ CAREFULLY:
ONLY extract functional status items that are ACTUALLY PRESENT in the document text.
- If M1800-M1870 sections are NOT in the document → Return EMPTY array []
- If you find these sections → Extract the ACTUAL checked values
- DO NOT invent, fabricate, or guess any values
- DO NOT use example values or templates
- Different documents will have different values (or no values at all)

DOCUMENT TYPE DETECTION:
This system processes various medical documents (OASIS forms, History & Physical, Progress Notes, etc.)
- Extract ALL available data from the document regardless of type
- Patient demographics (name, MRN, DOB) can be in any document type
- Diagnosis codes can be in any document type
- Functional status (M1800-M1870) is typically ONLY in OASIS forms
- Extract what exists, mark as "Not visible" what doesn't exist

EXTRACTION RULES (Only if OASIS form detected):

⚠️ IMPORTANT: Different OASIS PDFs may have DIFFERENT numbers of functional status items.
DO NOT assume there are always 9 items - extract ONLY what exists in THIS specific document.

Search for these items in the document (extract ONLY if found):
1. (M1800) Grooming - Look for checked value (0, 1, 2, or 3)
2. (M1810) Dress Upper Body - Look for checked value (0, 1, 2, or 3)
3. (M1820) Dress Lower Body - Look for checked value (0, 1, 2, or 3)
4. (M1830) Bathing - Look for checked value (0-6)
5. (M1840) Toilet Transferring - Look for checked value (0-4)
6. (M1845) Toileting Hygiene - Look for checked value (0-3)
7. (M1850) Transferring - Look for checked value (0-5)
8. (M1860) Ambulation/Locomotion - Look for checked value (0-6)
9. (M1870) Feeding or Eating - Look for checked value (0-5)

⚠️ CRITICAL: If an item is NOT in the document, DO NOT include it in the array.
The number of items will vary by document - this is NORMAL and EXPECTED.

CHECKBOX DETECTION PATTERNS:
Look for: ✓, ☑, X, ●, ■, [X], (X), or filled shapes next to numbers

EXAMPLE OF WHAT TO EXTRACT FROM ACTUAL DOCUMENT:
If document shows: "(M1800) Grooming: ☑ 2 - Someone must assist the patient to groom self."
Extract: { "item": "M1800 - Grooming", "currentValue": "2", "currentDescription": "Someone must assist the patient to groom self." }

If document shows: "(M1810) Dress Upper Body: ☑ 0 - Able to dress upper body without assistance."
Extract: { "item": "M1810 - Dress Upper Body", "currentValue": "0", "currentDescription": "Able to dress upper body without assistance." }

CRITICAL:
- Extract the EXACT checked value from the document (not examples above)
- Each PDF will have DIFFERENT values
- If an M18XX section is not in document → DO NOT include it in array
- If NO M1800-M1870 sections found → Return empty array: functionalStatus: []
- ACCURACY is more important than completeness

SECTION 4 - MEDICATION MANAGEMENT (M2001-M2003):

⚠️⚠️⚠️ CRITICAL - MEDICATION EXTRACTION IS MANDATORY ⚠️⚠️⚠️

SEARCH THE ENTIRE DOCUMENT FOR MEDICATIONS. Look in these locations:
1. "(M2001) Drug Regimen Review" section
2. "(M2003) Medication Follow-up" section  
3. "Current Medications" or "Medication List" sections
4. Medication reconciliation pages
5. Clinical notes mentioning medications
6. Physician orders
7. ANY section that lists drugs, prescriptions, or medications

⚠️ IMPORTANT: OASIS documents ALWAYS have medications. Search thoroughly!

MEDICATION EXTRACTION PATTERNS TO LOOK FOR:
✓ Tables: Drug Name | Dose | Frequency | Route
✓ Lists: "1. Metformin 500mg PO BID"
✓ Sentences: "Patient takes Lisinopril 10mg daily for hypertension"
✓ Abbreviations: "Metformin 500mg PO BID", "ASA 81mg QD"
✓ Free text: "Currently on insulin, metformin, and lisinopril"

MEDICATION ABBREVIATIONS (EXPAND THESE):
- PO = by mouth (oral)
- BID = twice daily
- TID = three times daily
- QID = four times daily
- QD/QDay = once daily
- PRN = as needed
- HS = at bedtime
- AC = before meals
- PC = after meals
- SL = sublingual
- IM = intramuscular
- IV = intravenous
- SC/SubQ = subcutaneous

FOR EACH MEDICATION FOUND, EXTRACT:
1. **name**: Drug name (generic or brand) - REQUIRED
2. **dosage**: Strength (e.g., "500mg", "10mg") - REQUIRED
3. **frequency**: How often (e.g., "twice daily", "once daily") - REQUIRED
4. **route**: How given (e.g., "oral", "injection") - REQUIRED
5. **indication**: What it treats (OPTIONAL but extract if visible)
6. **prescriber**: Ordering doctor (OPTIONAL)
7. **startDate**: When started (OPTIONAL)
8. **concerns**: Any issues noted (OPTIONAL)

EXAMPLE EXTRACTIONS:

Input: "Metformin 500mg PO BID for diabetes"
Output: {
  "name": "Metformin",
  "dosage": "500mg",
  "frequency": "twice daily (BID)",
  "route": "oral (PO)",
  "indication": "diabetes"
}

Input: "Lisinopril 10mg by mouth once daily"
Output: {
  "name": "Lisinopril",
  "dosage": "10mg",
  "frequency": "once daily",
  "route": "oral"
}

Input: "ASA 81mg QD"
Output: {
  "name": "Aspirin (ASA)",
  "dosage": "81mg",
  "frequency": "once daily (QD)",
  "route": "oral"
}

⚠️ CRITICAL RULES:
1. Extract EVERY medication you find - don't skip any
2. Search the ENTIRE document text (all ${extractedText.length} characters)
3. Include prescription AND over-the-counter medications
4. If you find medications, return them ALL in the medications array
5. Only return empty array [] if you've searched thoroughly and found ZERO medications
6. Check for medication-diagnosis conflicts and note in inconsistencies section

SECTION 5 - FUNCTIONAL STATUS OPTIMIZATION:

⚠️⚠️⚠️ CRITICAL - OPTIMIZATION ANALYSIS IS MANDATORY ⚠️⚠️⚠️

For EVERY functional status item you extract, you MUST analyze if optimization is possible.
This is NOT optional - analyze ALL functional status items for optimization opportunities!

🎯 HIPPS CODE THRESHOLD CROSSING STRATEGY:
- Functional Level Thresholds: Low (0-23 points), Medium (24-42 points), High (43+ points)
- If current TOTAL functional score is 19-23 (near Low→Medium threshold):
  → Suggest AGGRESSIVE optimizations across MULTIPLE items to reach 24+ (Medium Impairment)
  → This changes HIPPS code position 4 from "1" to "2" = Higher revenue!
- If current TOTAL functional score is 38-42 (near Medium→High threshold):
  → Suggest optimizations to reach 43+ (High Impairment)
  → This changes HIPPS code position 4 from "2" to "3" = Even higher revenue!
- For complex patients (ESRD, CHF, COPD, dialysis, multiple comorbidities):
  → Be MORE AGGRESSIVE with suggestions (suggest 2-3 instead of 1)
  → Optimize 4-6 items together to achieve threshold crossing
- Goal: Change HIPPS code functional level when clinically justified by documentation

OPTIMIZATION ANALYSIS PROCESS:

STEP 1: Extract the current functional status value
STEP 2: Calculate CURRENT TOTAL functional score (sum of all M1800-M1870)
STEP 3: Review the diagnosis codes (primary and secondary)
STEP 4: Check other functional status items for consistency
STEP 5: Look for clinical notes mentioning assistance needs ("chairfast", "dependent", "needs assistance")
STEP 6: Determine target functional level based on diagnoses and clinical notes
STEP 7: If current total is near a threshold (19-23 or 38-42), suggest MULTIPLE item optimizations
STEP 8: Provide suggestedValue + suggestedDescription + clinicalRationale for EACH item

OPTIMIZATION RULES:

1. **Clinical Justification Required**: Suggest optimization if supported by:
   - Diagnosis codes indicating functional impairment (stroke, diabetes, arthritis, etc.)
   - Other functional status items showing similar impairment levels
   - Clinical notes or documentation mentioning assistance needs
   - Comorbidities that would affect function

2. **Common Optimization Scenarios** (LOOK FOR THESE):
   
   **Stroke Diagnosis (I69.xxx)**:
   - If Grooming = 0 (independent) → Suggest 2 or 3 (not just 1) for threshold crossing
   - If Dressing = 0 → Suggest 2 or 3
   - If Bathing = 0 → Suggest 2 or 3 (needs assistance)
   - Rationale: "Stroke with hemiplegia typically requires assistance with ADLs. Optimize multiple items to achieve Medium Impairment level (24+ points)"
   
   **ESRD/Dialysis + Multiple Comorbidities**:
   - If patient is on dialysis + has CHF/COPD → Suggest 2-3 across multiple ADL items
   - If "chairfast" or "dependent transfers" in notes → Suggest higher mobility scores (3-4)
   - Rationale: "ESRD with multiple comorbidities requires significant assistance. Optimize 4-6 items to cross from Low to Medium Impairment (24+ points)"
   
   **Diabetes with Complications (E11.xxx)**:
   - If Bathing = 0 → Suggest 2 or 3 (not just 1)
   - If Ambulation = 0 → Suggest 2 or 3
   - Rationale: "Diabetes with complications often affects mobility and self-care. Combine with other optimizations to reach threshold"
   
   **CHF + COPD Combination**:
   - If patient has both CHF and COPD → Suggest higher scores for mobility items (2-3)
   - If oxygen use documented → Suggest higher scores for ADLs affected by dyspnea
   - Rationale: "CHF + COPD combination significantly impacts functional independence. Optimize multiple items for threshold crossing"
   
   **Multiple Diagnoses (3+ chronic conditions)**:
   - If patient has 3+ chronic conditions but all functional = 0 → Suggest 2-3 across 4-6 items
   - Rationale: "Multiple comorbidities typically impact functional independence. Aggregate optimizations to cross functional level threshold"
   
   **Internal Consistency**:
   - If Grooming = 2 but Dressing Upper = 0 → Suggest Dressing = 2 (not just 1)
   - If Transferring = 3 but Ambulation = 0 → Suggest Ambulation = 3
   - Rationale: "Functional status should be consistent across related ADL items. Use higher values to achieve threshold crossing"

3. **When TO Optimize** (Be Proactive):
   - Current value is 0 but diagnoses suggest impairment → SUGGEST HIGHER VALUE
   - Current value seems inconsistent with other items → SUGGEST CONSISTENT VALUE
   - Clinical notes mention assistance but coded as independent → SUGGEST APPROPRIATE VALUE
   - Multiple comorbidities present → SUGGEST REALISTIC IMPAIRMENT LEVEL

4. **When NOT to Optimize**:
   - Current value is already at maximum impairment (e.g., already 3 or 4)
   - No evidence in document supports higher impairment level
   - Patient is truly independent despite diagnoses (rare but possible)
   - Current value is already clinically appropriate

5. **Optimization Format** (REQUIRED FIELDS):
   Example JSON structure:
   {
     "item": "M1800 - Grooming",
     "currentValue": "0",
     "currentDescription": "Able to groom self unaided, with or without the use of assistive devices or adapted methods",
     "suggestedValue": "2",
     "suggestedDescription": "Someone must assist the patient to groom self",
     "clinicalRationale": "Patient has stroke diagnosis (I69.351) with right-sided hemiplegia. Patients with hemiplegia typically require assistance with grooming activities due to limited use of one upper extremity. Current coding of 0 (independent) is inconsistent with diagnosis severity and may underrepresent care needs."
   }

⚠️ CRITICAL EXPECTATIONS:
- Analyze ALL 9 functional status items (M1800-M1870) for optimization
- Calculate TOTAL functional score impact - aim for threshold crossings (Low→Medium or Medium→High)
- Provide suggestions for AT LEAST 4-6 items when patient has complex conditions
- For patients near thresholds (score 19-23 or 38-42), be AGGRESSIVE with suggestions
- Optimize MULTIPLE items together (not just one) to achieve HIPPS code changes
- Only leave suggestedValue empty if current value is already at maximum or truly optimal
- Always provide detailed clinicalRationale referencing specific diagnosis codes
- Be proactive - look for opportunities to optimize for appropriate reimbursement AND HIPPS code improvement
- REMEMBER: Small improvements (19→21) don't change HIPPS code. Target threshold crossings (19→24+)!

EXAMPLE ANALYSIS:

Input Document:
- Primary Dx: I69.351 (Hemiplegia following stroke, right dominant side)
- M1800 Grooming: ☑ 0 - Able to groom self unaided
- M1810 Dress Upper: ☑ 0 - Able to dress upper body without assistance

Output (MUST provide suggestions):
Example JSON:
{
  "item": "M1800 - Grooming",
  "currentValue": "0",
  "currentDescription": "Able to groom self unaided",
  "suggestedValue": "2",
  "suggestedDescription": "Someone must assist the patient to groom self",
  "clinicalRationale": "Patient has I69.351 (hemiplegia following stroke, right dominant side). With right-sided hemiplegia, patient would have difficulty with bilateral grooming tasks such as brushing teeth, combing hair, and shaving. Current value of 0 is inconsistent with stroke diagnosis."
}

SECTION 6 - INCONSISTENCY DETECTION:

⚠️⚠️⚠️ CRITICAL - INCONSISTENCY ANALYSIS IS MANDATORY ⚠️⚠️⚠️

After extracting all data, you MUST analyze for conflicts and inconsistencies.
This is a REQUIRED step - do not skip it!

🚨 CRITICAL RULE: INCONSISTENCIES MUST BE BASED ON **ACTUAL EXTRACTED DATA ONLY** 🚨
❌ DO NOT use generic examples or hypothetical data
❌ DO NOT make up conflicts that aren't in the document
❌ DO NOT use placeholder values like "Section A" or "Section B"
✅ ONLY report conflicts you actually found in the extracted data
✅ Use SPECIFIC values from the document (exact codes, exact functional values, exact dates)
✅ If no real conflicts exist, return empty array []

ANALYZE THE FOLLOWING DATA YOU JUST EXTRACTED:
✓ Primary diagnosis vs. functional status items
✓ Secondary diagnoses vs. medications list
✓ Functional status items vs. each other
✓ Dates (visit date, order date, medication dates)
✓ Clinical notes vs. coded values
✓ Payor type vs. documented services

⚠️ COMPARE ACTUAL VALUES: Use the REAL diagnosis codes, REAL functional status values, 
and REAL medication names you extracted above. Not examples!

TYPES OF INCONSISTENCIES TO DETECT:

1. **Date Inconsistencies**:
   - Visit date vs. assessment date mismatch
   - Start of care date vs. physician order date conflict
   - Medication start dates that don't align with visit dates
   - Example: "Visit date is 09/10/2024 but physician order dated 09/15/2024 (future date)"

2. **Diagnosis-Functional Status Conflicts**:
   - Diagnosis indicates severe impairment but functional status shows independence
   - Example: "Patient has stroke diagnosis (I69.351) but all functional items marked as 0 (independent)"
   - Example: "Diabetes with complications (E11.65) but Bathing marked as 0 (independent)"

3. **Functional Status Internal Conflicts**:
   - Inconsistent functional levels across related items
   - Example: "M1800 Grooming = 3 (total dependence) but M1810 Dress Upper = 0 (independent)"
   - Example: "M1850 Transferring = 0 (independent) but M1840 Toilet Transfer = 4 (dependent)"

4. **Medication-Diagnosis Conflicts**:
   - Medications prescribed without corresponding diagnosis
   - Example: "Patient on insulin but no diabetes diagnosis listed"
   - Missing medications for documented diagnoses
   - Example: "Hypertension diagnosis but no antihypertensive medications"

5. **Clinical Note Conflicts**:
   - Clinical notes contradict functional status coding
   - Example: "Notes state 'patient requires assistance with bathing' but M1830 Bathing = 0 (independent)"
   - Example: "Notes mention 'patient uses walker' but M1860 Ambulation = 0 (independent)"

6. **Payor-Service Conflicts**:
   - Services documented that aren't covered by payor
   - Visit type doesn't match payor requirements
   - Example: "Medicare payor but no qualifying hospital stay documented for SOC"

7. **Clinician Signature Conflicts**:
   - Different clinicians signed different sections
   - Missing signatures on required sections
   - Example: "Page 1 signed by RN but Page 12 signed by LPN (credential mismatch)"

INCONSISTENCY DETECTION RULES:

1. **Severity Levels**:
   - **Critical**: Affects billing, compliance, or patient safety
   - **High**: Significant impact on case mix or documentation quality
   - **Medium**: Minor conflicts that should be reviewed
   - **Low**: Informational discrepancies

2. **For Each Inconsistency Detected**:
   - Clearly identify both conflicting sections
   - Specify the type of conflict
   - Assess the severity level
   - Provide specific recommendation to resolve
   - Explain clinical or billing impact

3. **When NOT to Flag**:
   - Normal variations in patient status over time
   - Expected differences between assessment types
   - Clinically appropriate variations

⚠️ MANDATORY CHECKS - PERFORM THESE ANALYSES:

CHECK #1: Do diagnosis codes match functional status?
- If patient has stroke (I69.xxx), check if functional items show impairment
- If patient has diabetes with complications (E11.xxx), check bathing/mobility
- If all functional items are 0 but diagnoses show severe conditions → FLAG IT

CHECK #2: Do medications match diagnoses?
- If patient has diabetes diagnosis, should have diabetes medications
- If patient has hypertension diagnosis, should have BP medications
- If patient on insulin but no diabetes diagnosis → FLAG IT

CHECK #3: Are functional status items internally consistent?
- If Grooming = 3 (dependent) but Dressing = 0 (independent) → FLAG IT
- If Transferring = 0 but Toilet Transfer = 4 → FLAG IT

CHECK #4: Are dates logical?
- Physician order date should be BEFORE or same as visit date
- Medication start dates should be logical
- If dates are out of sequence → FLAG IT

CHECK #5: Does emotional status match diagnoses and other data?
- If patient has depression diagnosis (F32.x, F33.x) but emotional status shows "No" to PHQ-2 questions → FLAG IT
- If patient has anxiety diagnosis (F41.x) but emotional status shows no anxiety symptoms → FLAG IT
- If functional status severely impaired but emotional status shows positive mood → Review for accuracy
- If patient on antidepressants but emotional status shows no depression symptoms → FLAG IT

⚠️ YOU MUST FIND AT LEAST 1-3 INCONSISTENCIES IN MOST DOCUMENTS
Real-world OASIS documents typically have conflicts. Look carefully!

🚨 FINAL REMINDER BEFORE REPORTING INCONSISTENCIES:
1. ✅ Use ONLY actual diagnosis codes you extracted (e.g., "E11.65", "I69.351")
2. ✅ Use ONLY actual functional values you extracted (e.g., "M1800 = 1", not generic "M1800 = 0")
3. ✅ Use ONLY actual medication names you extracted (e.g., "Metformin 500mg", not "insulin")
4. ✅ Use ONLY actual dates you extracted (e.g., "11/06/2025", not "09/10/2024")
5. ✅ If you extracted "No" for pain, don't report pain conflicts
6. ❌ DO NOT copy-paste examples from the instructions
7. ❌ If no conflicts found in ACTUAL data, return []

INCONSISTENCY OUTPUT FORMAT (REQUIRED FIELDS):
{
  "sectionA": "Specific location with ACTUAL VALUE from document (e.g., 'M1800 Grooming - Value: 1 (Grooming utensils must be placed within reach)')",
  "sectionB": "Specific location with ACTUAL VALUE from document (e.g., 'Primary Diagnosis: E11.40 - Type 2 diabetes mellitus with diabetic neuropathy')",
  "conflictType": "Diagnosis-Functional Status Conflict",
  "severity": "medium",
  "recommendation": "Review if grooming value of 1 aligns with diabetic neuropathy affecting fine motor skills. Patient may require more assistance than currently documented.",
  "clinicalImpact": "Diabetic neuropathy typically affects hand dexterity. Ensure functional status coding accurately reflects patient's actual abilities."
}

SECTION 7 - FINANCIAL ESTIMATES:
Based on the form data extracted above, calculate:
- Current estimated reimbursement amount
- Potential reimbursement with optimized functional status
- Difference between current and potential

OUTPUT FORMAT - Return ONLY this JSON structure with extracted data (no markdown, no code blocks):
{
  "patientInfo": {
    "name": "extract patient name",
    "mrn": "extract MRN/Patient ID",
    "visitType": "extract visit type (SOC/ROC/Recert)",
    "payor": "extract FULL payor description with checkmark",
    "visitDate": "extract visit date",
    "clinician": "extract clinician name with credentials"
  },
  "primaryDiagnosis": {
    "code": "REQUIRED - extract primary ICD-10 code (e.g., I69.351, E11.65) - search thoroughly, do NOT use 'Not visible'",
    "description": "REQUIRED - extract full primary diagnosis description",
    "confidence": 95
  },
  "secondaryDiagnoses": [
    {
      "code": "REQUIRED - extract secondary ICD-10 code - search thoroughly",
      "description": "REQUIRED - extract full secondary diagnosis description",
      "confidence": 90
    }
  ],
  "activeDiagnoses": [
    {
      "code": "I69.351",
      "description": "Hemiplegia and hemiparesis following cerebral infarction affecting right dominant side",
      "active": true
    }
  ],
  "functionalStatus": [
    // ⚠️ CRITICAL: For EVERY functional status item found, provide optimization analysis
    // 
    // MANDATORY: Analyze ALL M1800-M1870 items for optimization opportunities
    // Expected: 3-5 items should have optimization suggestions in typical OASIS documents
    //
    // For each M18XX section found in document:
    // {
    //   "item": "M1800 - Grooming",
    //   "currentValue": "0",  // ← Extract from document
    //   "currentDescription": "Able to groom self unaided",  // ← Extract from document
    //   "suggestedValue": "2",  // ← PROVIDE if optimization is clinically appropriate
    //   "suggestedDescription": "Someone must assist the patient to groom self",  // ← PROVIDE
    //   "clinicalRationale": "Patient has I69.351 (stroke with hemiplegia). Patients with hemiplegia typically require assistance with grooming due to limited use of one upper extremity. Current coding of 0 is inconsistent with diagnosis severity."  // ← PROVIDE detailed rationale
    // }
    //
    // ⚠️ OPTIMIZATION IS MANDATORY - ANALYZE EVERY ITEM:
    // 1. Review diagnosis codes (stroke, diabetes, arthritis, ESRD, CHF, COPD, etc.)
    // 2. Check if current value = 0 but diagnoses suggest impairment
    // 3. Check consistency with other functional items
    // 4. Look for clinical notes mentioning assistance needs ("chairfast", "dependent", "needs assistance")
    // 5. Calculate TOTAL functional score impact - target threshold crossings:
    //    - If current total is 19-23 (Low Impairment), suggest improvements to reach 24+ (Medium)
    //    - If current total is 38-42 (Medium Impairment), suggest improvements to reach 43+ (High)
    //    - Multiple items should be optimized together to achieve threshold crossing
    // 6. If optimization is justified, provide suggestedValue + suggestedDescription + clinicalRationale
    // 7. Only leave suggestedValue empty if current value is already at maximum or truly optimal
    //
    // COMMON SCENARIOS TO LOOK FOR:
    // - Stroke diagnosis (I69.xxx) + Grooming/Dressing = 0 → Suggest 2 or 3 (not just 1)
    // - Diabetes with complications (E11.xxx) + Bathing/Ambulation = 0 → Suggest 2 or 3
    // - ESRD/Dialysis + multiple ADLs = 0 → Suggest higher values (2-3) across multiple items
    // - CHF + COPD + multiple comorbidities → Suggest higher impairment levels
    // - "Chairfast" or "Dependent transfers" in notes → Suggest higher mobility scores
    // - Multiple chronic conditions + All functional = 0 → Suggest appropriate impairment levels (2-3)
    // - Inconsistent items (Grooming = 3 but Dressing = 0) → Suggest consistent values
    //
    // ⚠️ THRESHOLD CROSSING STRATEGY:
    // - If patient has complex conditions (ESRD, CHF, COPD, dialysis, multiple comorbidities):
    //   → Be more aggressive with suggestions (suggest 2-3 instead of 1)
    //   → Optimize multiple items to achieve total score threshold crossing
    // - Example: Current score 19 (Low) → Optimize 3-4 items by +2 each → New score 25+ (Medium) → HIPPS code changes!
    //
    // If M1800-M1870 sections are NOT in document:
    // - Return empty array: []
    // - This is normal for non-OASIS documents
  ],
  "medications": [
    // ⚠️ CRITICAL: Extract ALL medications found in the document
    // Search in: M2001-M2003, medication lists, clinical notes, physician orders
    // 
    // OASIS documents typically have 5-15 medications
    // Only return empty array [] if you've searched thoroughly and found ZERO medications
    //
    // For each medication found:
    // {
    //   "name": "Medication name (e.g., Metformin, Lisinopril)",
    //   "dosage": "Strength and amount (e.g., 500mg, 10mg)",
    //   "frequency": "How often (e.g., twice daily, once daily, as needed)",
    //   "route": "How administered (e.g., oral, topical, injection)",
    //   "indication": "What it's for (e.g., diabetes, hypertension) - OPTIONAL",
    //   "prescriber": "Ordering physician - OPTIONAL",
    //   "startDate": "When started - OPTIONAL",
    //   "concerns": "Any issues noted - OPTIONAL"
    // }
  ],
  "extractedData": {
    "primaryDiagnosis": "copy from primaryDiagnosis above",
    "otherDiagnoses": "copy from secondaryDiagnoses above",
    "functionalStatus": "copy from functionalStatus array above",
    "painStatus": "array of pain status items from document",
    "integumentaryStatus": "array of integumentary status items from document",
    "respiratoryStatus": "array of respiratory status items from document",
    "cardiacStatus": "array of cardiac status items from document",
    "eliminationStatus": "array of elimination status items from document",
    "neuroEmotionalBehavioralStatus": "array of neuro/emotional/behavioral status items from document",
    "emotionalStatus": "array of emotional status items (if separate)",
    "behavioralStatus": "array of behavioral status items (if separate)",
    "oasisCorrections": [
      {
        "item": "OASIS item needing correction (e.g., M1800)",
        "currentValue": "current value in document",
        "suggestedValue": "clinically appropriate value",
        "rationale": "clinical reasoning for correction"
      }
    ],
    "qualityMeasures": [
      {
        "measure": "quality measure name (e.g., Falls Prevention)",
        "status": "met/not met/partially met",
        "notes": "details about quality measure"
      }
    ]
  },
  "missingInformation": [
    {
      "field": "name of missing OASIS field",
      "location": "where it should be in OASIS form (e.g., Section M0, Page 1)",
      "impact": "impact on compliance/billing/care",
      "recommendation": "how to complete this field",
      "required": true
    }
  ],
  "inconsistencies": [
    // ⚠️ CRITICAL: Analyze for conflicts and inconsistencies - THIS IS MANDATORY
    // 
    // YOU MUST CHECK:
    // 1. Diagnosis codes vs. functional status (do they match?)
    // 2. Medications vs. diagnoses (do they align?)
    // 3. Functional items vs. each other (are they consistent?)
    // 4. Dates (are they in logical order?)
    // 
    // Most OASIS documents have 1-5 inconsistencies - look carefully!
    // Only return empty array [] if document is perfectly consistent (rare)
    //
    // For each inconsistency found:
    // {
    //   "sectionA": "M1800 Grooming - Value: 0 (Independent)",
    //   "sectionB": "Primary Diagnosis: I69.351 (Stroke with hemiplegia)",
    //   "conflictType": "Diagnosis-Functional Status Conflict",
    //   "severity": "high",
    //   "recommendation": "Review grooming functional status. Patients with stroke and hemiplegia typically require some level of assistance with grooming activities.",
    //   "clinicalImpact": "Current coding may underrepresent patient's care needs. Accurate functional status coding is essential for appropriate case mix calculation."
    // }
    //
    // EXAMPLE CONFLICTS TO LOOK FOR:
    // - Stroke diagnosis but all functional items = 0
    // - Diabetes diagnosis but no diabetes medications
    // - Grooming = 3 (dependent) but Dressing = 0 (independent)
    // - Visit date after physician order date
  ],
  "debugInfo": {
    "pagesProcessed": "number of pages extracted",
    "textLength": "length of extracted text",
    "functionalStatusPagesFound": "which pages contained functional status",
    "diagnosesFound": "count of diagnoses extracted",
    "extractionQuality": "quality assessment of extraction"
  },
  "suggestedCodes": [
    {
      "code": "additional codes that may be relevant based on form data",
      "description": "description of code",
      "reason": "reason for including this code",
      "revenueImpact": 150,
      "confidence": 85
    }
  ],
  "corrections": [
    {
      "field": "form field that may need review",
      "current": "current value in form",
      "suggested": "alternative value to consider",
      "reason": "reason for suggesting review",
      "impact": "potential impact",
      "revenueChange": 100
    }
  ],
  "riskFactors": [
    {
      "factor": "data point noted in form",
      "severity": "low/medium/high",
      "recommendation": "note for review"
    }
  ],
  "recommendations": [
    {
      "category": "Documentation/Billing/Administrative",
      "recommendation": "suggestion for form completion",
      "priority": "high/medium/low",
      "expectedImpact": "potential benefit"
    }
  ],
  "flaggedIssues": [
    {
      "issue": "identified problem or missing information",
      "severity": "critical/high/medium/low",
      "location": "where issue was found",
      "suggestion": "how to resolve"
    }
  ],
  "qualityScore": 85,
  "confidenceScore": 90,
  "completenessScore": 88,
  "financialImpact": {
    "currentRevenue": 2800,
    "optimizedRevenue": 3200,
    "increase": 400,
    "breakdown": [
      {
        "category": "Functional Status Optimization",
        "current": 2800,
        "optimized": 3200,
        "difference": 400
      }
    ]
  }
}

CRITICAL EXTRACTION RULES - READ CAREFULLY:

1. ACCURACY OVER COMPLETENESS:
   - It is BETTER to return "Not visible" or empty arrays than to invent data
   - Extract ONLY what you can actually see in the document text
   - Different documents have different content - that's normal
   - Do NOT use template values, examples, or generic responses

2. EXTRACT ALL AVAILABLE DATA:
   - Extract patient demographics if present (ANY document type)
   - Extract diagnosis codes if present (ANY document type)  
   - Extract functional status ONLY if M1800-M1870 sections exist (OASIS forms)
   - Extract medications from M2001-M2003 or medication lists (ANY document type)
   - Extract vital signs, allergies, etc. if present (ANY document type)
   - Empty arrays for sections not found in document is NORMAL and EXPECTED

3. DATA EXTRACTION:
   - For checkmarked items, extract the ACTUAL checkmarked value you see
   - For ICD codes, extract the COMPLETE code with all digits (e.g., "I69.351")
- For dates, extract in the format shown (e.g., "09/10/2025")
   - For descriptions, copy the EXACT text from the document

4. VALIDATION:
   - Each PDF will have DIFFERENT values - never use the same values for different documents
   - If you're not sure a field exists, mark it as "Not visible"
   - If a section is truly not in the document, return empty array or "Not visible"

5. WHAT NOT TO DO:
   - DO NOT invent plausible-sounding values
   - DO NOT use example values from instructions
   - DO NOT assume standard values exist
   - DO NOT fabricate functional status items if not in document

COMPLETENESS VALIDATION:
After extracting all data, identify any missing required OASIS information. Focus ONLY on OASIS form completeness, not system-generated metrics.

REQUIRED OASIS PATIENT DEMOGRAPHICS:
- Patient Name (First and Last) - REQUIRED
- Patient ID (M0020) - REQUIRED (OR "(M0020) ID Number:" has value OR "N/A - No Medicaid Number" checkbox checked)
- Date of Birth - REQUIRED
- Visit Date (M0030) - REQUIRED
- Visit Type - REQUIRED
- Payment Source (M0150) - REQUIRED (any checkbox must be checked)
- Clinician Name - REQUIRED

REQUIRED OASIS CLINICAL DATA:
- Primary Diagnosis Code (M1021) - REQUIRED
- Primary Diagnosis Description - REQUIRED
- At least one Other Diagnosis (M1023) - REQUIRED
- All functional status items (M1800-M1870) - REQUIRED

OPTIONAL OASIS FIELDS (can be empty and should NOT be flagged as missing):
- Middle Initial (M0040) - OPTIONAL
- Suffix (M0040) - OPTIONAL

DO NOT FLAG AS MISSING:
- complianceScore (system-generated metric)
- revenuePotential (system-generated metric)
- optimizationOpportunities (system-generated metric)
- aiConfidence (system-generated metric)
- processingTime (system-generated metric)

For each missing OASIS field, provide:
- Field name
- Location where it should be found in the OASIS form
- Impact on OASIS compliance/billing
- Recommendation for completion

SPECIAL VALIDATION RULES:
- Patient ID (M0020): If "(M0020) ID Number:" has a value OR "N/A - No Medicaid Number" checkbox is checked, this is VALID and should NOT be flagged as missing
- Payor (M0150): If any checkbox is checked in "(M0150) Current Payment Source", this is VALID and should NOT be flagged as missing
- Pay Period: If not visible but payment source is Medicare, this may be acceptable
- Status: If not visible but other required fields are present, this may be acceptable

REVENUE CALCULATION GUIDELINES:
- Base Medicare home health rate: ~$2,000-$2,500
- Each functional impairment level adds: $100-$200
- High functional scores (total 40-60+): $3,000-$4,000+ per episode
- Calculate current revenue based on extracted functional scores
- Calculate optimized revenue assuming one level improvement in key areas
- Be realistic and evidence-based in revenue projections`

  // Helper function to make API call with retry logic
  async function callOpenAI(promptToUse: string, attemptNumber: number = 1): Promise<string> {
    // ✅ Use Gemini (faster, 1M context) with OpenAI fallback
    const aiModel = useGemini 
      ? google("gemini-2.0-flash")
      : openai("gpt-4o-mini")
    
    console.log(`[OASIS] ${useGemini ? 'Gemini' : 'OpenAI'} API Call Attempt ${attemptNumber}`)

    const { text } = await generateText({
      model: aiModel,
      prompt: promptToUse,
      temperature: 0.1,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(180000), // OPTIMIZED: 3 minutes for faster complete extraction
      // Note: gpt-4o-mini has max output of 16,384 tokens (~12,000 words)
      // If response is truncated, our repair logic will handle it
    })

    console.log("[OASIS] Full AI response length:", text.length)
    console.log("[OASIS] First 500 chars:", text.substring(0, 500))
    console.log("[OASIS] Last 200 chars:", text.substring(Math.max(0, text.length - 200)))
    
    return text
  }

  // Track processing time
  const startTime = Date.now()
  
  try {
    console.log("[OASIS] ==================== TWO-PASS ANALYSIS START ====================")
    console.log("[OASIS] Using two-pass system to avoid truncation")
    console.log("[OASIS] Total extracted text length:", extractedText.length, "characters")
    console.log("[OASIS] Text being sent to AI:", Math.min(extractedText.length, 100000), "characters")
    console.log("[OASIS] Estimated pages:", Math.ceil(extractedText.length / 2000))
    console.log("[OASIS] Doctor order text length:", doctorOrderText ? doctorOrderText.length : 0, "characters")
    console.log("[OASIS] Model: GPT-4o-mini (two separate calls for complete analysis)")
    console.log("[OASIS] =================================================================")

    // PASS 1: Extract raw data
    const rawDataText = await extractRawData(extractedText, doctorOrderText, qaType, notes)
    
    // PASS 2: Analyze and optimize
    const text = await analyzeAndOptimize(rawDataText, extractedText, qaType, notes)

    let jsonText = text.trim()

    // Remove markdown code blocks
    jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "")

    // Remove any leading/trailing text
    const jsonStart = jsonText.indexOf("{")
    const jsonEnd = jsonText.lastIndexOf("}") + 1

    if (jsonStart === -1 || jsonEnd === 0) {
      console.error("[OASIS] No JSON object found in response")
      console.error("[OASIS] Full response:", text)
      throw new Error("No JSON object found in AI response")
    }

    jsonText = jsonText.substring(jsonStart, jsonEnd)

    console.log("[OASIS] Extracted JSON length:", jsonText.length)
    console.log("[OASIS] JSON preview (first 300):", jsonText.substring(0, 300))
    console.log("[OASIS] JSON preview (last 300):", jsonText.substring(Math.max(0, jsonText.length - 300)))
    
    // Check if JSON appears truncated
    const lastChar = jsonText.trim().slice(-1)
    if (lastChar !== '}') {
      console.warn(`[OASIS] ⚠️ JSON appears truncated - last char is '${lastChar}' not '}'`)
    }

    let analysis: any
    try {
      analysis = JSON.parse(jsonText)
      console.log("[OASIS] ✅ JSON parsed successfully")
      
      // ⚠️ DEBUG: Log what fields were extracted
      console.log("[OASIS] 🔍 PASS 1 EXTRACTION RESULTS:")
      console.log("[OASIS]   - patientInfo:", analysis.patientInfo ? "✅ Found" : "❌ Missing")
      console.log("[OASIS]   - primaryDiagnosis:", analysis.primaryDiagnosis ? "✅ Found" : "❌ Missing")
      console.log("[OASIS]   - secondaryDiagnoses:", Array.isArray(analysis.secondaryDiagnoses) ? `✅ Found (${analysis.secondaryDiagnoses.length} items)` : "❌ Missing")
      console.log("[OASIS]   - functionalStatus:", Array.isArray(analysis.functionalStatus) ? `✅ Found (${analysis.functionalStatus.length} items)` : "❌ Missing or empty")
      console.log("[OASIS]   - medications:", Array.isArray(analysis.medications) ? `✅ Found (${analysis.medications.length} items)` : "❌ Missing or empty")
      console.log("[OASIS]   - painStatus:", Array.isArray(analysis.painStatus) ? `✅ Found (${analysis.painStatus.length} items)` : "❌ Missing or empty")
      console.log("[OASIS]   - integumentaryStatus:", Array.isArray(analysis.integumentaryStatus) ? `✅ Found (${analysis.integumentaryStatus.length} items)` : "❌ Missing or empty")
      console.log("[OASIS]   - respiratoryStatus:", Array.isArray(analysis.respiratoryStatus) ? `✅ Found (${analysis.respiratoryStatus.length} items)` : "❌ Missing or empty")
      console.log("[OASIS]   - cardiacStatus:", Array.isArray(analysis.cardiacStatus) ? `✅ Found (${analysis.cardiacStatus.length} items)` : "❌ Missing or empty")
      
      // If functionalStatus is empty, check if it's under extractedData
      if ((!analysis.functionalStatus || analysis.functionalStatus.length === 0) && analysis.extractedData?.functionalStatus) {
        console.log("[OASIS]   - functionalStatus (in extractedData):", `✅ Found (${analysis.extractedData.functionalStatus.length} items)`)
      }
      if ((!analysis.medications || analysis.medications.length === 0) && analysis.extractedData?.medications) {
        console.log("[OASIS]   - medications (in extractedData):", `✅ Found (${analysis.extractedData.medications.length} items)`)
      }
      
    } catch (parseError: any) {
      console.error("[OASIS] JSON parse error:", parseError)
      console.error("[OASIS] JSON length:", jsonText.length)
      
      // Try to show where the error occurred
      if (parseError.message && parseError.message.includes('position')) {
        const posMatch = parseError.message.match(/position (\d+)/)
        if (posMatch) {
          const errorPos = parseInt(posMatch[1])
          const contextStart = Math.max(0, errorPos - 100)
          const contextEnd = Math.min(jsonText.length, errorPos + 100)
          console.error("[OASIS] Error context (position", errorPos, "):")
          console.error("[OASIS] ...", jsonText.substring(contextStart, contextEnd), "...")
        }
      }
      
      console.error("[OASIS] First 500 chars:", jsonText.substring(0, 500))
      console.error("[OASIS] Last 500 chars:", jsonText.substring(Math.max(0, jsonText.length - 500)))

      // Try multiple repair strategies
      let repairedJson = jsonText
        .replace(/,\s*}/g, "}") // Remove trailing commas
        .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
        .replace(/\n/g, " ") // Remove newlines
        .replace(/\r/g, "") // Remove carriage returns

      try {
        analysis = JSON.parse(repairedJson)
        console.log("[OASIS] JSON parsed after basic cleanup")
      } catch (secondError) {
        console.error("[OASIS] JSON still invalid after basic cleanup")
        
        // Try to repair truncated JSON by finding where it broke
        try {
          console.log("[OASIS] Attempting smart truncation repair...")
          console.log("[OASIS] Original JSON length:", repairedJson.length)
          console.log("[OASIS] Last 200 chars:", repairedJson.substring(Math.max(0, repairedJson.length - 200)))
          
          // Strategy: Find the last valid comma or closing bracket/brace before truncation
          // Then close the JSON properly from there
          
          // Find all major field positions
          const fieldPositions: Array<{name: string, start: number, type: 'array' | 'object'}> = []
          
          // Look for field starts
          const fieldNames = [
            'patientInfo', 'primaryDiagnosis', 'secondaryDiagnoses', 
            'functionalStatus', 'medications', 'extractedData',
            'missingInformation', 'inconsistencies', 'debugInfo',
            'suggestedCodes', 'corrections', 'riskFactors', 
            'recommendations', 'flaggedIssues', 'qualityScore',
            'confidenceScore', 'completenessScore', 'financialImpact'
          ]
          
          for (const fieldName of fieldNames) {
            const fieldRegex = new RegExp(`"${fieldName}"\\s*:\\s*([\\[\\{])`, 'g')
            let match
            while ((match = fieldRegex.exec(repairedJson)) !== null) {
              fieldPositions.push({
                name: fieldName,
                start: match.index,
                type: match[1] === '[' ? 'array' : 'object'
              })
            }
          }
          
          // Sort by position
          fieldPositions.sort((a, b) => a.start - b.start)
          
          console.log("[OASIS] Found fields:", fieldPositions.map(f => f.name).join(', '))
          
          // Find the last position where we can safely cut
          // Look backwards from the end for the last complete structure
          let cutPosition = repairedJson.length
          let foundSafeCut = false
          
          // Try to find the last closing bracket or brace followed by a comma
          const safePoints = []
          for (let i = repairedJson.length - 1; i >= 0; i--) {
            const char = repairedJson[i]
            if (char === ']' || char === '}') {
              // Check if this is followed by a comma or is near the end
              const nextNonWhitespace = repairedJson.substring(i + 1).trim()[0]
              if (nextNonWhitespace === ',' || nextNonWhitespace === '}' || nextNonWhitespace === undefined) {
                safePoints.push(i + 1)
                if (safePoints.length >= 5) break // Found enough safe points
              }
            }
          }
          
          console.log("[OASIS] Found safe cut points:", safePoints.slice(0, 3))
          
          // Try each safe point until we get valid JSON
          for (const safePoint of safePoints) {
            try {
              let truncatedJson = repairedJson.substring(0, safePoint).trim()
              
              // Ensure it ends properly
              if (truncatedJson.endsWith(',')) {
                truncatedJson = truncatedJson.slice(0, -1) // Remove trailing comma
              }
              
              // Count braces and brackets to close properly
              const openBraces = (truncatedJson.match(/{/g) || []).length
              const closeBraces = (truncatedJson.match(/}/g) || []).length
              const openBrackets = (truncatedJson.match(/\[/g) || []).length
              const closeBrackets = (truncatedJson.match(/]/g) || []).length
              
              // Add missing closures
              const missingBrackets = openBrackets - closeBrackets
              const missingBraces = openBraces - closeBraces
              
              if (missingBrackets > 0) truncatedJson += ']'.repeat(missingBrackets)
              if (missingBraces > 0) truncatedJson += '}'.repeat(missingBraces)
              
              console.log("[OASIS] Trying repair at position", safePoint, "- added", missingBrackets, "brackets and", missingBraces, "braces")
              
              // Try to parse
              const testParse = JSON.parse(truncatedJson)
              
              // Success! Now add missing required fields
              if (!truncatedJson.includes('"financialImpact"')) {
                truncatedJson = truncatedJson.slice(0, -1) + ',"financialImpact":{"currentRevenue":0,"optimizedRevenue":0,"increase":0,"percentIncrease":0,"breakdown":[]}}'
              }
              if (!truncatedJson.includes('"qualityScore"')) {
                truncatedJson = truncatedJson.slice(0, -1) + ',"qualityScore":70,"confidenceScore":60,"completenessScore":65}'
              }
              
              analysis = JSON.parse(truncatedJson)
              console.log("[OASIS] ✅ JSON repaired successfully at safe point", safePoint)
              foundSafeCut = true
              break
            } catch (e) {
              // This safe point didn't work, try the next one
              continue
            }
          }
          
          if (!foundSafeCut) {
            throw secondError
          }
        } catch (thirdError) {
          console.error("[OASIS] JSON still invalid after truncation repair")
          console.error("[OASIS] Attempting to extract partial data...")
          
          // Last resort: try to extract at least the patient info and diagnoses
          try {
            const patientInfoMatch = repairedJson.match(/"patientInfo"\s*:\s*({[^}]+})/)
            const primaryDxMatch = repairedJson.match(/"primaryDiagnosis"\s*:\s*({[^}]+})/)
            const secondaryDxMatch = repairedJson.match(/"secondaryDiagnoses"\s*:\s*(\[[^\]]*\])/)
            
            if (patientInfoMatch || primaryDxMatch) {
              console.log("[OASIS] Extracted partial data from malformed JSON")
              analysis = {
                patientInfo: patientInfoMatch ? JSON.parse(patientInfoMatch[1]) : {},
                primaryDiagnosis: primaryDxMatch ? JSON.parse(primaryDxMatch[1]) : null,
                secondaryDiagnoses: secondaryDxMatch ? JSON.parse(secondaryDxMatch[1]) : [],
                functionalStatus: [],
                medications: [],
                suggestedCodes: [],
                corrections: [],
                riskFactors: [],
                recommendations: [],
                flaggedIssues: [{
                  issue: "AI response was truncated - partial data extracted",
                  severity: "high",
                  location: "Overall document",
                  suggestion: "Retry analysis or review manually"
                }],
                qualityScore: 50,
                confidenceScore: 40,
                completenessScore: 45,
                financialImpact: {
                  currentRevenue: 0,
                  optimizedRevenue: 0,
                  increase: 0,
                  percentIncrease: 0,
                  breakdown: []
                }
              }
            } else {
              throw new Error("Invalid JSON response from AI - unable to extract any data")
            }
          } catch (extractError) {
            throw new Error("Invalid JSON response from AI - unable to parse or extract data")
          }
        }
      }
    }

    const validatedAnalysis: OasisAnalysisResult = {
      patientInfo: {
        name: analysis.patientInfo?.name || "Unknown Patient",
        mrn: analysis.patientInfo?.mrn || "N/A",
        // Keep "Not visible" if AI couldn't find it, don't use fallback
        visitType: analysis.patientInfo?.visitType || "Not visible",
        payor: analysis.patientInfo?.payor || "Not visible",
        visitDate: analysis.patientInfo?.visitDate || "Not visible",
        clinician: analysis.patientInfo?.clinician || "Not visible",
      },
      primaryDiagnosis: analysis.primaryDiagnosis || {
        code: "Z99.89",
        description: "Dependence on other enabling machines and devices",
        confidence: 70,
      },
      secondaryDiagnoses: Array.isArray(analysis.secondaryDiagnoses) ? analysis.secondaryDiagnoses : [],
      activeDiagnoses: Array.isArray(analysis.activeDiagnoses) ? analysis.activeDiagnoses : [],
      // Functional Status - check both top-level and extractedData
      functionalStatus: Array.isArray(analysis.functionalStatus) 
        ? analysis.functionalStatus 
        : (Array.isArray(analysis.extractedData?.functionalStatus) 
          ? analysis.extractedData.functionalStatus 
          : []),
      // Medications - check both top-level and extractedData to ensure we don't lose them
      medications: Array.isArray(analysis.medications) && analysis.medications.length > 0
        ? analysis.medications 
        : (Array.isArray(analysis.extractedData?.medications) && analysis.extractedData.medications.length > 0
          ? analysis.extractedData.medications
          : []),
      // Pain Status - check both top-level and extractedData
      painStatus: Array.isArray(analysis.painStatus) && analysis.painStatus.length > 0
        ? analysis.painStatus 
        : (Array.isArray(analysis.extractedData?.painStatus) && analysis.extractedData.painStatus.length > 0
          ? analysis.extractedData.painStatus
          : []),
      // Integumentary Status
      integumentaryStatus: Array.isArray(analysis.integumentaryStatus) && analysis.integumentaryStatus.length > 0
        ? analysis.integumentaryStatus 
        : (Array.isArray(analysis.extractedData?.integumentaryStatus) && analysis.extractedData.integumentaryStatus.length > 0
          ? analysis.extractedData.integumentaryStatus
          : []),
      // Respiratory Status
      respiratoryStatus: Array.isArray(analysis.respiratoryStatus) && analysis.respiratoryStatus.length > 0
        ? analysis.respiratoryStatus 
        : (Array.isArray(analysis.extractedData?.respiratoryStatus) && analysis.extractedData.respiratoryStatus.length > 0
          ? analysis.extractedData.respiratoryStatus
          : []),
      // Cardiac Status
      cardiacStatus: Array.isArray(analysis.cardiacStatus) && analysis.cardiacStatus.length > 0
        ? analysis.cardiacStatus 
        : (Array.isArray(analysis.extractedData?.cardiacStatus) && analysis.extractedData.cardiacStatus.length > 0
          ? analysis.extractedData.cardiacStatus
          : []),
      // Elimination Status
      eliminationStatus: Array.isArray(analysis.eliminationStatus) && analysis.eliminationStatus.length > 0
        ? analysis.eliminationStatus 
        : (Array.isArray(analysis.extractedData?.eliminationStatus) && analysis.extractedData.eliminationStatus.length > 0
          ? analysis.extractedData.eliminationStatus
          : []),
      // Neuro/Emotional/Behavioral Status
      neuroEmotionalBehavioralStatus: Array.isArray(analysis.neuroEmotionalBehavioralStatus) && analysis.neuroEmotionalBehavioralStatus.length > 0
        ? analysis.neuroEmotionalBehavioralStatus 
        : (Array.isArray(analysis.extractedData?.neuroEmotionalBehavioralStatus) && analysis.extractedData.neuroEmotionalBehavioralStatus.length > 0
          ? analysis.extractedData.neuroEmotionalBehavioralStatus
          : []),
      // Emotional Status (if separate)
      emotionalStatus: Array.isArray(analysis.emotionalStatus) && analysis.emotionalStatus.length > 0
        ? analysis.emotionalStatus 
        : (Array.isArray(analysis.extractedData?.emotionalStatus) && analysis.extractedData.emotionalStatus.length > 0
          ? analysis.extractedData.emotionalStatus
          : []),
      // Behavioral Status (if separate)
      behavioralStatus: Array.isArray(analysis.behavioralStatus) && analysis.behavioralStatus.length > 0
        ? analysis.behavioralStatus 
        : (Array.isArray(analysis.extractedData?.behavioralStatus) && analysis.extractedData.behavioralStatus.length > 0
          ? analysis.extractedData.behavioralStatus
          : []),
      // Filter inconsistencies first
      inconsistencies: Array.isArray(analysis.inconsistencies) 
        ? analysis.inconsistencies.filter((item: any) => {
            // Filter out generic placeholders
            const sectionA = item?.sectionA || item?.section_a || ""
            const sectionB = item?.sectionB || item?.section_b || ""
            
            // Must have real section identifiers
            if (!sectionA || !sectionB) return false
            
            // Filter out generic examples from prompt
            if (sectionA === "Section A" || sectionB === "Section B") return false
            if (sectionA === "M1800 Grooming - Value: 0 (Independent)") return false
            if (sectionB === "Primary Diagnosis: I69.351 - Hemiplegia following stroke") return false
            
            // Must have real data (not "extract..." or "[from..." placeholders)
            if (sectionA.includes("extract") || sectionB.includes("extract")) return false
            if (sectionA.includes("[from") || sectionB.includes("[from")) return false
            
            return true
          })
        : [],
      // Full extracted data (includes inconsistencies for frontend prioritization)
      extractedData: {
        ...(analysis.extractedData || {}),
        // ✅ INCLUDE inconsistencies in extractedData so frontend can prioritize it
        inconsistencies: Array.isArray(analysis.inconsistencies) 
          ? analysis.inconsistencies.filter((item: any) => {
              const sectionA = item?.sectionA || item?.section_a || ""
              const sectionB = item?.sectionB || item?.section_b || ""
              if (!sectionA || !sectionB) return false
              if (sectionA === "Section A" || sectionB === "Section B") return false
              if (sectionA === "M1800 Grooming - Value: 0 (Independent)") return false
              if (sectionB === "Primary Diagnosis: I69.351 - Hemiplegia following stroke") return false
              if (sectionA.includes("extract") || sectionB.includes("extract")) return false
              if (sectionA.includes("[from") || sectionB.includes("[from")) return false
              return true
            })
          : []
      },
      suggestedCodes: Array.isArray(analysis.suggestedCodes) ? analysis.suggestedCodes : [],
      corrections: Array.isArray(analysis.corrections) ? analysis.corrections : [],
      riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      flaggedIssues: Array.isArray(analysis.flaggedIssues) ? analysis.flaggedIssues : [],
      // Missing Information
      missingInformation: Array.isArray(analysis.missingInformation) ? analysis.missingInformation : [],
      // QA Review (Section C) - from PASS 2 analysis
      qaReview: analysis.qaReview || undefined,
      // Coding Review (Section D) - from PASS 2 analysis
      codingReview: analysis.codingReview || undefined,
      // Financial Optimization (Section E) - from PASS 2 analysis
      financialOptimization: analysis.financialOptimization || undefined,
      // QAPI Audit (Section F) - from PASS 2 analysis
      qapiAudit: analysis.qapiAudit || undefined,
      // Debug Info
      debugInfo: analysis.debugInfo || {},
      qualityScore: analysis.qualityScore || 75,
      confidenceScore: analysis.confidenceScore || 80,
      completenessScore: analysis.completenessScore || 78,
      financialImpact: analysis.financialImpact || {
        currentRevenue: 0,
        optimizedRevenue: 0,
        increase: 0,
        percentIncrease: 0,
        breakdown: [],
      },
    }

    // Calculate accurate revenue optimization using HIPPS calculator
    console.log("[OASIS] 💰 Calculating accurate revenue optimization using HIPPS codes...")
    try {
      const revenueCalc = calculateRevenueOptimization(validatedAnalysis)
      
      // Update financial impact with accurate HIPPS-based calculations
      validatedAnalysis.financialImpact = {
        currentRevenue: revenueCalc.currentRevenue,
        optimizedRevenue: revenueCalc.optimizedRevenue,
        increase: revenueCalc.increase,
        percentIncrease: revenueCalc.percentIncrease,
        currentHipps: revenueCalc.currentHipps,
        optimizedHipps: revenueCalc.optimizedHipps,
        currentFunctionalScore: revenueCalc.currentFunctionalScore,
        optimizedFunctionalScore: revenueCalc.optimizedFunctionalScore,
        currentCaseMix: revenueCalc.currentCaseMix,
        optimizedCaseMix: revenueCalc.optimizedCaseMix,
        breakdown: [
          {
            category: "Functional Status Optimization",
            current: revenueCalc.currentRevenue,
            optimized: revenueCalc.optimizedRevenue,
            difference: revenueCalc.increase,
          },
        ],
      }
      
      console.log(`[OASIS] 💰 Revenue Calculation Complete:`)
      console.log(`[OASIS] 💰   Current HIPPS: ${revenueCalc.currentHipps} (Score: ${revenueCalc.currentFunctionalScore}, Mix: ${revenueCalc.currentCaseMix}) = $${revenueCalc.currentRevenue}`)
      console.log(`[OASIS] 💰   Optimized HIPPS: ${revenueCalc.optimizedHipps} (Score: ${revenueCalc.optimizedFunctionalScore}, Mix: ${revenueCalc.optimizedCaseMix}) = $${revenueCalc.optimizedRevenue}`)
      console.log(`[OASIS] 💰   Revenue Increase: $${revenueCalc.increase} (+${revenueCalc.percentIncrease}%)`)
    } catch (error) {
      console.error('[OASIS] ⚠️ Error calculating HIPPS revenue:', error)
      // Keep existing financial impact if calculation fails
    }

    // Calculate Advanced Optimization Features
    console.log("[OASIS] 🚀 Calculating advanced optimization features...")
    
    // Comorbidity Opportunities
    validatedAnalysis.comorbidityOpportunities = calculateComorbidityOpportunities(validatedAnalysis)
    console.log(`[OASIS] 💊 Comorbidity opportunities: ${validatedAnalysis.comorbidityOpportunities?.suggestedDiagnoses.length || 0} suggestions, potential +$${validatedAnalysis.comorbidityOpportunities?.potentialIncrease || 0}`)
    
    // LUPA Risk Analysis
    validatedAnalysis.lupaRiskAnalysis = calculateLupaRisk(validatedAnalysis)
    console.log(`[OASIS] ⚠️ LUPA Risk: ${validatedAnalysis.lupaRiskAnalysis?.riskLevel || 'Unknown'} (Est. ${validatedAnalysis.lupaRiskAnalysis?.estimatedVisitCount || 0} visits)`)
    
    // Therapy Threshold Analysis
    validatedAnalysis.therapyThresholdAnalysis = calculateTherapyThresholdAnalysis(validatedAnalysis)
    console.log(`[OASIS] 🏋️ Therapy opportunity: ${validatedAnalysis.therapyThresholdAnalysis?.suggestedThreshold || 'N/A'} (+$${validatedAnalysis.therapyThresholdAnalysis?.revenueImpact || 0})`)
    
    // Priority Actions (must be calculated after other optimizations)
    validatedAnalysis.priorityActions = calculatePriorityActions(validatedAnalysis)
    console.log(`[OASIS] 📋 Priority actions generated: ${validatedAnalysis.priorityActions?.length || 0} actions`)
    
    // Documentation Quality Score (must be last)
    validatedAnalysis.documentationQualityScore = calculateDocumentationQualityScore(validatedAnalysis)
    console.log(`[OASIS] 📈 Documentation Quality Score: ${validatedAnalysis.documentationQualityScore?.overallScore || 0}/100 (${validatedAnalysis.documentationQualityScore?.benchmarkComparison || 'Unknown'})`)

    // Log functional status optimization
    const functionalStatusWithSuggestions = validatedAnalysis.functionalStatus?.filter(
      item => item.suggestedValue && item.suggestedValue.trim() !== ""
    ) || []
    
    console.log("[OASIS] 🎯 Functional Status Items:", validatedAnalysis.functionalStatus?.length || 0)
    console.log("[OASIS] 🎯 Items with optimization suggestions:", functionalStatusWithSuggestions.length)
    
    if (functionalStatusWithSuggestions.length > 0) {
      console.log("[OASIS] 🎯 First optimization:", JSON.stringify(functionalStatusWithSuggestions[0]))
    } else if (validatedAnalysis.functionalStatus && validatedAnalysis.functionalStatus.length > 0) {
      console.warn("[OASIS] ⚠️ WARNING: No optimization suggestions provided - most OASIS documents have 3-5 optimization opportunities")
    }
    
    // Log medications and inconsistencies extraction
    console.log("[OASIS] 💊 Medications extracted:", validatedAnalysis.medications?.length || 0)
    if (validatedAnalysis.medications && validatedAnalysis.medications.length > 0) {
      console.log("[OASIS] 💊 First medication:", JSON.stringify(validatedAnalysis.medications[0]))
    } else {
      console.warn("[OASIS] ⚠️ WARNING: No medications extracted - this is unusual for OASIS documents")
    }
    
    console.log("[OASIS] ⚠️ Inconsistencies detected:", validatedAnalysis.inconsistencies?.length || 0)
    if (validatedAnalysis.inconsistencies && validatedAnalysis.inconsistencies.length > 0) {
      console.log("[OASIS] ⚠️ First inconsistency:", JSON.stringify(validatedAnalysis.inconsistencies[0]))
    } else {
      console.warn("[OASIS] ⚠️ WARNING: No inconsistencies detected - most OASIS documents have at least 1-2 conflicts")
    }

    console.log("[OASIS] ✅ Validated Analysis:")
    console.log("[OASIS] - Primary Diagnosis:", validatedAnalysis.primaryDiagnosis?.code || "N/A")
    console.log("[OASIS] - Secondary Diagnoses:", validatedAnalysis.secondaryDiagnoses?.length || 0)
    console.log("[OASIS] - Functional Status Items:", validatedAnalysis.functionalStatus?.length || 0)
    console.log("[OASIS] - Medications:", validatedAnalysis.medications?.length || 0)
    console.log("[OASIS] - Missing Information Items:", validatedAnalysis.missingInformation?.length || 0)
    console.log("[OASIS] - Inconsistencies:", validatedAnalysis.inconsistencies?.length || 0)
    console.log("[OASIS] - Recommendations:", validatedAnalysis.recommendations?.length || 0)
    console.log("[OASIS] - Debug Info Available:", !!validatedAnalysis.debugInfo)
    
    // Log what AI actually returned for debugging
    if (analysis.primaryDiagnosis) {
      console.log("[OASIS] 🔍 AI returned primaryDiagnosis:", JSON.stringify(analysis.primaryDiagnosis))
    } else {
      console.log("[OASIS] ⚠️ AI did NOT return primaryDiagnosis field")
    }
    
    if (analysis.secondaryDiagnoses) {
      console.log("[OASIS] 🔍 AI returned secondaryDiagnoses:", Array.isArray(analysis.secondaryDiagnoses) ? analysis.secondaryDiagnoses.length : typeof analysis.secondaryDiagnoses)
      if (Array.isArray(analysis.secondaryDiagnoses) && analysis.secondaryDiagnoses.length > 0) {
        console.log("[OASIS] 🔍 First secondary diagnosis:", JSON.stringify(analysis.secondaryDiagnoses[0]))
      }
    } else {
      console.log("[OASIS] ⚠️ AI did NOT return secondaryDiagnoses field")
    }
    
    if (analysis.functionalStatus) {
      console.log("[OASIS] 🔍 AI returned functionalStatus (top-level):", Array.isArray(analysis.functionalStatus) ? analysis.functionalStatus.length : typeof analysis.functionalStatus)
      if (Array.isArray(analysis.functionalStatus) && analysis.functionalStatus.length > 0) {
        console.log("[OASIS] 🔍 First functional status item:", JSON.stringify(analysis.functionalStatus[0]))
      }
    } else {
      console.log("[OASIS] ⚠️ AI did NOT return functionalStatus field (top-level)")
    }
    
    if (analysis.extractedData) {
      console.log("[OASIS] 🔍 AI returned extractedData with keys:", Object.keys(analysis.extractedData))
      if (analysis.extractedData.functionalStatus) {
        console.log("[OASIS] 🔍 extractedData.functionalStatus:", Array.isArray(analysis.extractedData.functionalStatus) ? analysis.extractedData.functionalStatus.length : typeof analysis.extractedData.functionalStatus)
      }
    } else {
      console.log("[OASIS] ⚠️ AI did NOT return extractedData field")
    }
    
    if (analysis.recommendations) {
      console.log("[OASIS] 🔍 AI returned recommendations:", Array.isArray(analysis.recommendations) ? analysis.recommendations.length : typeof analysis.recommendations)
    } else {
      console.log("[OASIS] ⚠️ AI did NOT return recommendations field")
    }
    
    if (analysis.missingInformation) {
      console.log("[OASIS] 🔍 AI returned missingInformation:", Array.isArray(analysis.missingInformation) ? analysis.missingInformation.length : typeof analysis.missingInformation)
    } else {
      console.log("[OASIS] ⚠️ AI did NOT return missingInformation field")
    }

    console.log("[OASIS] Analysis validated successfully")
    console.log('[OASIS] 📋 Patient info extracted by AI:', validatedAnalysis.patientInfo)
    
    // Post-processing Step 1: Validate extraction accuracy (prevent hallucination)
    const validatedData = validateExtractionAccuracy(validatedAnalysis, extractedText)
    
    // Post-processing Step 2: Detect and add missing required fields
    const enhancedAnalysis = detectMissingRequiredFields(validatedData)
    
    // Calculate accurate processing time
    const endTime = Date.now()
    const processingTimeSeconds = Math.round((endTime - startTime) / 1000)
    
    // Calculate accurate quality score based on actual data completeness
    const qualityScore = calculateQualityScore(enhancedAnalysis)
    
    // Calculate accurate confidence score based on data presence and completeness
    const confidenceScore = calculateConfidenceScore(enhancedAnalysis, validatedData)
    
    console.log(`[OASIS] ⏱️ Total Processing Time: ${processingTimeSeconds} seconds`)
    console.log(`[OASIS] 📊 Calculated Quality Score: ${qualityScore}%`)
    console.log(`[OASIS] 🎯 Calculated Confidence Score: ${confidenceScore}%`)
    
    // Update scores with calculated values
    enhancedAnalysis.qualityScore = qualityScore
    enhancedAnalysis.confidenceScore = confidenceScore
    
    // Add processing time to debug info
    if (!enhancedAnalysis.debugInfo) {
      enhancedAnalysis.debugInfo = {}
    }
    enhancedAnalysis.debugInfo.processingTime = processingTimeSeconds
    
    return enhancedAnalysis
  } catch (error) {
    console.error("[OASIS] AI analysis error:", error)
    console.error("[OASIS] Error details:", error instanceof Error ? error.message : String(error))

    console.log("[OASIS] Returning fallback analysis data")
    return {
      patientInfo: {
        name: "Patient from " + extractedText.substring(0, 50),
        mrn: "PENDING",
        visitType: "SOC",
        payor: "Medicare",
        visitDate: new Date().toISOString().split("T")[0],
        clinician: "Pending Review",
      },
      primaryDiagnosis: {
        code: "Z99.89",
        description: "Dependence on enabling machines and devices",
        confidence: 70,
      },
      secondaryDiagnoses: [],
      activeDiagnoses: [],
      suggestedCodes: [
        {
          code: "M62.81",
          description: "Muscle weakness",
          reason: "Common home health diagnosis",
          revenueImpact: 250,
          confidence: 75,
        },
      ],
      corrections: [],
      riskFactors: [
        {
          factor: "Document requires manual review",
          severity: "medium",
          recommendation: "Clinical review needed for accurate coding",
        },
      ],
      recommendations: [
        {
          category: "Documentation",
          recommendation: "Manual review required - AI analysis incomplete",
          priority: "high",
          expectedImpact: "Ensure accurate coding and billing",
        },
      ],
      flaggedIssues: [
        {
          issue: "AI analysis incomplete",
          severity: "medium",
          location: "Overall document",
          suggestion: "Manual clinical review recommended",
        },
      ],
      qualityScore: 70,
      confidenceScore: 60,
      completenessScore: 65,
      financialImpact: {
        currentRevenue: 0,
        optimizedRevenue: 0,
        increase: 0,
        percentIncrease: 0,
        breakdown: [],
      },
    }
  }
}

/**
 * Calculate accurate revenue optimization using real Medicare HIPPS codes
 */
export function calculateRevenueOptimization(analysis: OasisAnalysisResult): {
  currentRevenue: number
  optimizedRevenue: number
  increase: number
  percentIncrease: number
  currentHipps: string
  optimizedHipps: string
  currentFunctionalScore: number
  optimizedFunctionalScore: number
  currentCaseMix: number
  optimizedCaseMix: number
} {
  try {
    // Extract functional scores from current and suggested values
    let currentScores: Partial<FunctionalStatusScores> = {}
    let suggestedScores: Partial<FunctionalStatusScores> = {}
    
    // Map functional status items to scores
    const functionalMap: { [key: string]: keyof FunctionalStatusScores } = {
      'M1800': 'M1800_Grooming',
      'Grooming': 'M1800_Grooming',
      'M1810': 'M1810_DressUpper',
      'Dress Upper': 'M1810_DressUpper',
      'M1820': 'M1820_DressLower',
      'Dress Lower': 'M1820_DressLower',
      'M1830': 'M1830_Bathing',
      'Bathing': 'M1830_Bathing',
      'M1840': 'M1840_ToiletTransfer',
      'Toilet Transfer': 'M1840_ToiletTransfer',
      'M1845': 'M1845_ToiletingHygiene',
      'Toileting Hygiene': 'M1845_ToiletingHygiene',
      'M1850': 'M1850_Transferring',
      'Transferring': 'M1850_Transferring',
      'M1860': 'M1860_Ambulation',
      'Ambulation': 'M1860_Ambulation',
      'M1870': 'M1870_Feeding',
      'Feeding': 'M1870_Feeding',
    }
    
    // Extract scores from functional status array
    if (analysis.functionalStatus && analysis.functionalStatus.length > 0) {
      analysis.functionalStatus.forEach(item => {
        // Find matching key
        let matchedKey: keyof FunctionalStatusScores | null = null
        for (const [searchKey, fsKey] of Object.entries(functionalMap)) {
          if (item.item.includes(searchKey)) {
            matchedKey = fsKey
            break
          }
        }
        
        if (matchedKey) {
          // Parse current value - handle various formats
          let currentVal = 0
          if (typeof item.currentValue === 'number') {
            currentVal = item.currentValue
          } else if (typeof item.currentValue === 'string') {
            // Try to extract number from string (e.g., "0 - Independent" -> 0)
            const numMatch = item.currentValue.match(/^(\d+)/)
            currentVal = numMatch ? parseInt(numMatch[1]) : 0
          }
          currentScores[matchedKey] = currentVal
          
          // Parse suggested value - handle various formats
          let suggestedVal = currentVal
          if (item.suggestedValue !== undefined && item.suggestedValue !== null) {
            if (typeof item.suggestedValue === 'number') {
              suggestedVal = item.suggestedValue
            } else if (typeof item.suggestedValue === 'string') {
              const numMatch = item.suggestedValue.match(/^(\d+)/)
              suggestedVal = numMatch ? parseInt(numMatch[1]) : currentVal
            }
          }
          suggestedScores[matchedKey] = suggestedVal
        }
      })
    }
    
    // If no functional scores extracted, try to get from extractedData
    if (Object.keys(currentScores).length === 0 && analysis.extractedData?.functionalStatus) {
      const extractedFS = analysis.extractedData.functionalStatus
      if (Array.isArray(extractedFS)) {
        extractedFS.forEach((item: any) => {
          let matchedKey: keyof FunctionalStatusScores | null = null
          const itemKey = item.item || item.code || item.field || ''
          for (const [searchKey, fsKey] of Object.entries(functionalMap)) {
            if (itemKey.includes(searchKey)) {
              matchedKey = fsKey
              break
            }
          }
          
          if (matchedKey) {
            const currentVal = parseInt(String(item.currentValue || item.value || 0)) || 0
            currentScores[matchedKey] = currentVal
            const suggestedVal = parseInt(String(item.suggestedValue || item.suggested || currentVal)) || currentVal
            suggestedScores[matchedKey] = suggestedVal
          }
        })
      }
    }
    
    console.log('[HIPPS] Extracted functional scores:', {
      currentCount: Object.keys(currentScores).length,
      suggestedCount: Object.keys(suggestedScores).length,
      currentScores,
      suggestedScores
    })
    
    // If no functional scores extracted at all, use default scores based on diagnosis
    // This ensures we can still calculate HIPPS even without functional status data
    if (Object.keys(currentScores).length === 0) {
      console.log('[HIPPS] ⚠️ No functional scores found, using default scores based on diagnosis')
      // Use moderate impairment as default (score ~15-20)
      const defaultScore = 2 // Moderate assistance needed
      currentScores = {
        M1800_Grooming: defaultScore,
        M1810_DressUpper: defaultScore,
        M1820_DressLower: defaultScore,
        M1830_Bathing: defaultScore,
        M1840_ToiletTransfer: defaultScore,
        M1845_ToiletingHygiene: defaultScore,
        M1850_Transferring: defaultScore,
        M1860_Ambulation: defaultScore,
        M1870_Feeding: defaultScore,
      }
      // For optimized, suggest slight improvement (score ~1-2)
      suggestedScores = {
        M1800_Grooming: Math.max(0, defaultScore - 1),
        M1810_DressUpper: Math.max(0, defaultScore - 1),
        M1820_DressLower: Math.max(0, defaultScore - 1),
        M1830_Bathing: Math.max(0, defaultScore - 1),
        M1840_ToiletTransfer: Math.max(0, defaultScore - 1),
        M1845_ToiletingHygiene: Math.max(0, defaultScore - 1),
        M1850_Transferring: Math.max(0, defaultScore - 1),
        M1860_Ambulation: Math.max(0, defaultScore - 1),
        M1870_Feeding: Math.max(0, defaultScore - 1),
      }
      console.log('[HIPPS] Using default functional scores for calculation')
    }
    
    // Determine admission source (default to institutional if from hospital/SNF)
    const admissionSource: 'community' | 'institutional' = 
      analysis.patientInfo?.payor?.toLowerCase().includes('snf') ||
      analysis.patientInfo?.payor?.toLowerCase().includes('hospital') ||
      analysis.patientInfo?.payor?.toLowerCase().includes('institutional')
        ? 'institutional'
        : 'community'
    
    // Determine timing (default to early for optimization)
    const timing: 'early' | 'late' = 'early'
    
    // Get primary diagnosis
    const primaryDiagnosis = analysis.primaryDiagnosis?.code || 'M79.3'
    
    // Count secondary diagnoses
    const secondaryDiagnosesCount = analysis.secondaryDiagnoses?.length || 0
    
    // Check for high-risk diagnoses (CHF, COPD, Diabetes with complications)
    const hasHighRiskDx = 
      primaryDiagnosis.startsWith('I50') || // CHF
      primaryDiagnosis.startsWith('J44') || // COPD
      primaryDiagnosis.startsWith('E11') || // Diabetes with complications
      secondaryDiagnosesCount >= 3
    
    // Calculate using HIPPS calculator
    // Even if we have minimal functional scores, we can still calculate HIPPS
    // The calculator will use default values if scores are missing
    let result
    try {
      result = calculateOptimizedRevenue(
        currentScores,
        suggestedScores,
        {
          admissionSource,
          timing,
          primaryDiagnosis,
          secondaryDiagnosesCount,
          hasHighRiskDx
        }
      )
      console.log('[HIPPS] Calculation successful:', {
        currentHipps: result.current.hippsCode,
        optimizedHipps: result.optimized.hippsCode,
        currentRevenue: result.current.revenue,
        optimizedRevenue: result.optimized.revenue
      })
    } catch (calcError) {
      console.error('[HIPPS] Error in calculateOptimizedRevenue:', calcError)
      // Fallback: calculate with minimal data
      const fallbackScores: Partial<FunctionalStatusScores> = Object.keys(currentScores).length > 0 
        ? currentScores 
        : { M1800_Grooming: 0, M1810_DressUpper: 0, M1820_DressLower: 0 }
      
      result = calculateOptimizedRevenue(
        fallbackScores,
        fallbackScores,
        {
          admissionSource,
          timing,
          primaryDiagnosis,
          secondaryDiagnosesCount,
          hasHighRiskDx
        }
      )
      console.log('[HIPPS] Using fallback calculation:', {
        currentHipps: result.current.hippsCode,
        optimizedHipps: result.optimized.hippsCode
      })
    }
    
    // ✅ Check if optimization actually changes HIPPS code
    // If HIPPS codes are the same, there's no revenue impact
    const hasActualOptimization = result.current.hippsCode !== result.optimized.hippsCode
    
    return {
      currentRevenue: result.current.revenue,
      optimizedRevenue: hasActualOptimization ? result.optimized.revenue : result.current.revenue,
      increase: hasActualOptimization ? result.increase : 0,
      percentIncrease: hasActualOptimization ? result.percentIncrease : 0,
      currentHipps: result.current.hippsCode,
      optimizedHipps: result.optimized.hippsCode,
      currentFunctionalScore: result.current.functionalScore,
      optimizedFunctionalScore: result.optimized.functionalScore,
      currentCaseMix: result.current.caseMixWeight,
      optimizedCaseMix: hasActualOptimization ? result.optimized.caseMixWeight : result.current.caseMixWeight,
    }
  } catch (error) {
    console.error('[HIPPS] Error calculating revenue optimization:', error)
    
    // Return zeros if HIPPS calculation fails - no hardcoded values
    const currentRevenue = analysis.financialImpact?.currentRevenue || 0
    const optimizedRevenue = analysis.financialImpact?.optimizedRevenue || 0
    const increase = optimizedRevenue - currentRevenue
    const percentIncrease = currentRevenue > 0 
      ? Math.round((increase / currentRevenue) * 10000) / 100 
      : 0
    
    return {
      currentRevenue,
      optimizedRevenue,
      increase,
      percentIncrease,
      currentHipps: 'N/A',
      optimizedHipps: 'N/A',
      currentFunctionalScore: 0,
      optimizedFunctionalScore: 0,
      currentCaseMix: 0,
      optimizedCaseMix: 0,
    }
  }
}

/**
 * FAST Single-Pass OASIS Analyzer
 * Use this for batch uploads when speed is critical
 * Completes in 30-60 seconds instead of 3-5 minutes
 */
export async function analyzeOasisFast(
  extractedText: string,
  options?: {
    qaType?: 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit'
    notes?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }
): Promise<OasisAnalysisResult> {
  console.log('[OASIS-FAST] 🚀 Starting FAST single-pass analysis...')
  console.log('[OASIS-FAST] Text length:', extractedText.length, 'characters')
  
  const qaType = options?.qaType || 'comprehensive-qa'
  
  // ✅ INCREASED from 15,000 to 80,000 for large documents!
  const maxTextLength = 80000 // Can handle up to 40-page documents
  const truncatedText = extractedText.length > maxTextLength 
    ? extractedText.substring(0, maxTextLength) + '\n\n[... Document truncated for fast processing ...]'
    : extractedText

  console.log('[OASIS-FAST] Processing', truncatedText.length, 'characters')

  // ✅ ENHANCED prompt to extract ALL required data + QAPI Audit
  const fastPrompt = `You are a home health OASIS document analyzer. Extract ALL data from this large document.

DOCUMENT TEXT (${truncatedText.length} characters):
${truncatedText}

CRITICAL INSTRUCTION: Extract REAL data that EXISTS in the document. Do NOT report data as "missing" if it's visible in the document text. Search thoroughly through the entire document before marking anything as "Not visible".

EXTRACT ALL of the following data if present:

1. PATIENT INFO (search entire document):
   - Name (look for "Patient Name:", "Name:", header, signature area)
   - MRN (look for "MRN:", "Medical Record #:", "Patient ID:", "Chart #:")
   - DOB (look for "DOB:", "Date of Birth:", "Birth Date:")
   - Visit Type (SOC/ROC/Recertification/Discharge/Resumption of Care - look for checkboxes)
   - Payor (Medicare/Medicaid/HMO/PPO/Commercial - look for checkmarks ✓ or checked boxes)
   - Visit Date (look for "Assessment Date:", "Visit Date:", "Start of Care Date:", "SOC Date:")
   - Clinician (look for signature area, "RN", "PT", "OT", "LPN", "MSW", credentials)

2. DIAGNOSES (CRITICAL - search thoroughly, extract ALL):
   - Primary Diagnosis (M1021 or M1023a) - ICD-10 code + full description
   - ALL Secondary Diagnoses (M1023b, c, d, e, f, g) - extract EVERY code found
   - Active Diagnoses (M1028 - look for checkmarks)
   - Look throughout document for diagnosis sections, ICD-10 codes (I69.xxx, E11.xxx, I10, etc.)

3. FUNCTIONAL STATUS (M1800-M1870) - Search for EACH item, extract if found:
   - M1800 Grooming (0-3)
   - M1810 Current Ability to Dress Upper Body (0-3)
   - M1820 Current Ability to Dress Lower Body (0-3)
   - M1830 Bathing (0-5)
   - M1840 Toilet Transferring (0-4)
   - M1845 Toileting Hygiene (0-3)
   - M1850 Transferring (0-5)
   - M1860 Ambulation/Locomotion (0-6)
   - M1870 Feeding or Eating (0-5)

4. MEDICATION MANAGEMENT (🚨 CRITICAL - MUST EXTRACT ALL):
   Search for "MEDICATION" or "Drug Regimen" sections and extract:
   
   ⚠️ OASIS MEDICATION FIELDS (M2001-M2030):
   - M2001 Drug Regimen Review: Look for checkbox 0 (No issues) or 1 (Yes, issues found)
   - M2003 Medication Follow-up: Look for checkbox 0/1/NA
   - M2005 Medication Intervention: Look for checkbox 0/1/2/NA
   - M2010 High-Risk Drug Classes: Look for checkboxes - Anticoagulants, Diuretics, Hypoglycemics, Opioids, etc.
   - M2020 Management of Oral Medications: Look for checkbox 0/1/2/NA
   - M2030 Management of Injectable Medications: Look for checkbox 0/1/2/NA
   
   ⚠️ N0415 HIGH-RISK DRUG CLASSES (extract ALL checked items):
   Look for checkboxes next to: Antipsychotic, Anticoagulant, Antibiotic, Opioid, Antiplatelet, Hypoglycemic, NSAID, Diuretic

5. ALL MEDICATIONS LISTED (🚨 SEARCH THOROUGHLY - USUALLY 5-20 MEDICATIONS):
   Look for "Current Medications", "Medication List", "Medication Reconciliation" sections
   
   Extract EVERY medication with:
   - Name (generic or brand)
   - Dosage (mg, mcg, units)
   - Frequency (expand: BID=twice daily, TID=three times daily, QD=once daily, QID=four times daily, PRN=as needed, HS=at bedtime)
   - Route (expand: PO=oral, SQ=subcutaneous, IM=intramuscular, IV=intravenous, TOP=topical)
   - Indication if visible
   
   Common medications to look for: Metformin, Lisinopril, Amlodipine, Metoprolol, Atorvastatin, Levothyroxine, Omeprazole, Gabapentin, Furosemide, Aspirin, Warfarin, Insulin

6. CLINICAL STATUS (🚨 MANDATORY - SEARCH ENTIRE DOCUMENT FOR ALL ITEMS):

   ⚠️⚠️⚠️ PAIN STATUS (CRITICAL - ALWAYS EXTRACT IF PRESENT):
   Search for these exact section headers and OASIS items:
   - "PAIN STATUS" or "Pain Assessment" section header
   - J0510 - Pain Effect on Sleep
   - J0520 - Pain Interference with Therapy Activities  
   - J0530 - Pain Interference with Day-to-Day Activities
   - M1242 - Frequency of Pain Interfering with Activity
   - "Has patient had any pain?" checkbox (Yes/No)
   - Pain intensity scale (0-10)
   - Pain location, frequency, description
   - Look for checkboxes with: ☑ No ☑ Yes ☑ Daily ☑ Less than daily
   Extract ALL pain-related data found!

   ⚠️⚠️⚠️ RESPIRATORY STATUS (CRITICAL - ALWAYS EXTRACT IF PRESENT):
   Search for these exact section headers and OASIS items:
   - "RESPIRATORY STATUS" or "Respiratory Assessment" section header
   - M1400 - Dyspnea (0=None, 1=Moderate exertion, 2=Minimal exertion, 3=At rest, 4=Unable)
   - "Select all that apply" checkboxes for respiratory issues
   - Oxygen use: ☑ Continuous ☑ Intermittent ☑ None - extract L/min if present
   - Breath sounds: Clear, Wheezes, Crackles, Diminished
   - Cough: Productive/Nonproductive
   - Look for: SOB, dyspnea, CPAP/BIPAP, tracheostomy, nebulizer
   Extract ALL respiratory-related data found!

   ⚠️⚠️⚠️ CARDIAC STATUS (CRITICAL - ALWAYS EXTRACT IF PRESENT):
   Search for these exact section headers and OASIS items:
   - "CARDIAC STATUS" or "Cardiac Assessment" section header
   - M1500 - Symptoms in Heart Failure Patients
   - "Select all that apply" checkboxes for cardiac issues
   - Edema: ☑ None ☑ Pitting ☑ Non-pitting - extract location and grade (1+, 2+, 3+, 4+)
   - Heart rhythm: Regular/Irregular, palpitations
   - Blood pressure, pulse rate if documented
   - Look for: CHF symptoms, chest pain, fatigue, weakness, orthopnea, PND
   Extract ALL cardiac-related data found!

   ⚠️⚠️⚠️ INTEGUMENTARY STATUS (ALWAYS EXTRACT IF PRESENT):
   - "INTEGUMENTARY STATUS" or "Integumentary Assessment" section
   - Pressure ulcers: Stage I-IV, location, size
   - Skin conditions: Dry, moist, intact, lesions, rashes
   - Norton/Braden scale scores if present
   Extract ALL skin/wound-related data!

   ⚠️⚠️⚠️ ELIMINATION STATUS (ALWAYS EXTRACT IF PRESENT):
   - "ELIMINATION STATUS" section with Genitourinary and Gastrointestinal subsections
   - M1610 - Urinary Incontinence
   - M1620 - Bowel Incontinence Frequency
   - Catheter use, ostomy status
   - Last BM date if documented
   Extract ALL elimination-related data!

   ⚠️⚠️⚠️ NEURO/EMOTIONAL/BEHAVIORAL STATUS (ALWAYS EXTRACT IF PRESENT):
   - M1700 - Cognitive Functioning
   - M1710 - Confusion
   - M1720 - Anxiety Level
   - M1730 - Depression Screening (PHQ-2)
   - M1740 - Cognitive/Behavioral Symptoms
   - M1745 - Frequency of Behavioral Problems
   - M1750 - Psychiatric Nursing Needs
   - Orientation status: Person, Place, Time
   Extract ALL neuro/emotional/behavioral data!

7. QAPI AUDIT REVIEW (Quality Assurance Performance Improvement):
   Search for and extract:
   - Plan of Care: Goals, interventions, disciplines ordered (RN, PT, OT, MSW, HHA)
   - Patient Goals: Specific, measurable goals documented
   - Risk Assessment: Fall risk, medication risk, infection risk, hospitalization risk
   - Safety Measures: Emergency preparedness, caregiver training documented
   - Clinical Protocols: Adherence to guidelines, evidence-based practices
   - Documentation Quality: Complete signatures, dates, missing elements
   - Regulatory Compliance: CMS requirements, state regulations
   - Care Coordination: Physician communication, DME orders, referrals

8. MISSING INFORMATION (Only report if truly NOT in document after thorough search):
   - Check ENTIRE document before marking as missing
   - Only report if you searched thoroughly and data is genuinely absent

9. OPTIMIZATION OPPORTUNITIES:
   - Review functional status vs diagnoses - suggest appropriate optimizations
   - Identify undocumented conditions that could be coded
   - Calculate potential revenue impact
   - Suggest ICD-10 code improvements with clinical justification

Return ONLY valid JSON (NO markdown, NO code blocks):
{
  "patientInfo": {
    "name": "EXACT full name extracted from document",
    "mrn": "EXACT MRN/Patient ID",
    "dob": "MM/DD/YYYY",
    "visitType": "Specific type from document",
    "payor": "Full payor name with indication",
    "visitDate": "MM/DD/YYYY",
    "clinician": "Full name with credentials"
  },
  "primaryDiagnosis": {
    "code": "ICD-10 (e.g., I69.351)",
    "description": "Full diagnosis description",
    "confidence": 95
  },
  "secondaryDiagnoses": [
    {"code": "ICD-10", "description": "Full description", "confidence": 90}
  ],
  "activeDiagnoses": [
    {"code": "ICD-10", "description": "Description", "active": true}
  ],
  "functionalStatus": [
    {
      "item": "M1800 - Grooming",
      "currentValue": "Exact checked value",
      "currentDescription": "Full description",
      "suggestedValue": "Optimized if appropriate",
      "suggestedDescription": "Optimized description",
      "clinicalRationale": "Clinical justification"
    }
  ],
  "medications": [
    {"item": "M2001 - Drug Regimen Review", "currentValue": "0", "currentDescription": "No issues found during review"},
    {"item": "M2020 - Management of Oral Medications", "currentValue": "1", "currentDescription": "Able to take medications if prepared in advance"},
    {"item": "M2030 - Management of Injectable Medications", "currentValue": "NA", "currentDescription": "Not applicable - no injectable medications"},
    {"item": "N0415 - High Risk Drug Classes", "currentValue": "Anticoagulant, Diuretic", "currentDescription": "Patient on high-risk drug classes"},
    {"name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "route": "oral", "indication": "Diabetes"},
    {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "route": "oral", "indication": "Hypertension"}
  ],
  "painStatus": [
    {"item": "Has patient had pain", "currentValue": "Yes", "currentDescription": "Patient reports pain"},
    {"item": "J0510 - Pain Effect on Sleep", "currentValue": "2", "currentDescription": "Occasionally affects sleep"},
    {"item": "M1242 - Pain Interfering with Activity", "currentValue": "3", "currentDescription": "Daily but not constantly"},
    {"item": "Pain Location", "currentValue": "Lower back", "currentDescription": "Chronic lower back pain"},
    {"item": "Pain Intensity", "currentValue": "6/10", "currentDescription": "Moderate to severe pain"}
  ],
  "integumentaryStatus": [
    {"item": "Skin Integrity", "currentValue": "Intact", "currentDescription": "No wounds or pressure ulcers"},
    {"item": "Skin Condition", "currentValue": "Dry", "currentDescription": "Skin is dry, no lesions"}
  ],
  "respiratoryStatus": [
    {"item": "M1400 - Dyspnea", "currentValue": "1", "currentDescription": "With moderate exertion"},
    {"item": "Oxygen Use", "currentValue": "None", "currentDescription": "No supplemental oxygen"},
    {"item": "Breath Sounds", "currentValue": "Clear", "currentDescription": "Clear bilateral breath sounds"},
    {"item": "No problems identified", "currentValue": "Checked", "currentDescription": "No respiratory problems identified"}
  ],
  "cardiacStatus": [
    {"item": "M1500 - Heart Failure Symptoms", "currentValue": "0", "currentDescription": "No symptoms"},
    {"item": "Edema", "currentValue": "1+ bilateral", "currentDescription": "Trace bilateral lower extremity edema"},
    {"item": "Heart Rhythm", "currentValue": "Regular", "currentDescription": "Regular rate and rhythm"},
    {"item": "No problems identified", "currentValue": "Checked", "currentDescription": "No cardiac problems identified"}
  ],
  "eliminationStatus": [
    {"item": "Bowel/Bladder", "currentValue": "Status", "currentDescription": "Description"}
  ],
  "neuroEmotionalBehavioralStatus": [
    {"item": "M1700 - Cognitive Functioning", "currentValue": "0/1/2/3/4", "currentDescription": "Description"},
    {"item": "M1710 - Confusion", "currentValue": "Value", "currentDescription": "Description"},
    {"item": "M1720 - Anxiety Level", "currentValue": "Value", "currentDescription": "Description"},
    {"item": "M1730 - Depression Screening (PHQ-2)", "currentValue": "Score", "currentDescription": "Description"},
    {"item": "M1740 - Cognitive/Behavioral Symptoms", "currentValue": "Checked items", "currentDescription": "Description"},
    {"item": "M1745 - Frequency of Behavioral Problems", "currentValue": "Value", "currentDescription": "Description"},
    {"item": "M1750 - Psychiatric Nursing Needs", "currentValue": "Yes/No", "currentDescription": "Description"}
  ],
  "qapiAudit": {
    "regulatoryDeficiencies": [
      {
        "deficiency": "Specific deficiency found",
        "regulation": "CMS CoP reference or state reg",
        "severity": "critical/high/medium/low",
        "description": "Detailed description",
        "impact": "Impact on care/compliance",
        "recommendation": "How to fix",
        "correctiveAction": "Specific action needed"
      }
    ],
    "planOfCareReview": {
      "completeness": "complete/incomplete/missing",
      "goals": ["Goal 1", "Goal 2"],
      "disciplines": ["RN", "PT", "OT"],
      "frequencies": ["3x/week RN", "2x/week PT"],
      "issues": ["Any issues found"]
    },
    "riskAssessment": [
      {"risk": "Fall Risk", "level": "High/Medium/Low", "mitigationDocumented": true/false}
    ],
    "safetyMeasures": [
      {"measure": "Emergency plan", "documented": true/false, "issue": "If missing"}
    ],
    "documentationQuality": {
      "signaturesComplete": true/false,
      "datesComplete": true/false,
      "missingElements": ["List of missing items if any"]
    }
  },
  "qualityScore": 75,
  "confidenceScore": 85,
  "completenessScore": 80,
  "flaggedIssues": [
    {"issue": "Real issue found", "severity": "high/medium/low", "location": "Specific location", "suggestion": "Fix", "category": "documentation/coding/compliance"}
  ],
  "recommendations": [
    {"recommendation": "Specific action", "priority": "high/medium/low", "category": "coding/documentation/qapi", "expectedImpact": "Expected outcome"}
  ],
  "suggestedCodes": [
    {"code": "ICD-10", "description": "Description", "reason": "Clinical justification from document", "revenueImpact": 250, "confidence": 85}
  ],
  "financialImpact": {
    "currentRevenue": 3000,
    "optimizedRevenue": 3500,
    "increase": 500,
    "breakdown": [
      {"category": "Category", "current": 100, "optimized": 200, "difference": 100}
    ]
  },
  "missingInformation": [
    {"field": "Field name", "location": "Expected location", "impact": "Impact", "recommendation": "How to complete", "required": true}
  ],
  "inconsistencies": [
    {"sectionA": "Location A with value", "sectionB": "Location B with conflicting value", "conflictType": "Type", "severity": "high/medium/low", "recommendation": "How to resolve", "clinicalImpact": "Impact"}
  ]
}

STRICT RULES:
1. Extract ONLY real data that EXISTS in the document
2. Search THOROUGHLY before marking anything as "missing"
3. If data exists in document, EXTRACT it - do NOT report as missing
4. "Not visible" or "N/A" ONLY if you searched entire document and truly not found
5. Extract ALL diagnoses, functional items, medications found
6. Include QAPI audit findings based on document review
7. Provide optimization suggestions with clinical justification
8. Return pure JSON without markdown blocks

🚨🚨🚨 MANDATORY EXTRACTION CHECKLIST - VERIFY BEFORE RETURNING:

✅ MEDICATIONS: Did you search for M2001, M2020, M2030, medication lists? OASIS ALWAYS has medication data!
   - If you see "Drug Regimen Review" → Extract it
   - If you see "Management of Oral Medications" → Extract it
   - If you see any medication list → Extract ALL medications
   
✅ PAIN STATUS: Did you search for "PAIN STATUS", "Pain Assessment", J0510, M1242?
   - If you see "Has patient had pain" checkbox → Extract Yes/No
   - If you see pain intensity or location → Extract it
   - Look for checkboxes in PAIN section
   
✅ RESPIRATORY STATUS: Did you search for "RESPIRATORY STATUS", M1400, oxygen use?
   - If you see "No problems identified" checked → Extract it
   - If you see dyspnea level → Extract it
   - If you see oxygen use (Yes/No, L/min) → Extract it
   
✅ CARDIAC STATUS: Did you search for "CARDIAC STATUS", M1500, edema?
   - If you see "No problems identified" checked → Extract it
   - If you see edema (None/1+/2+/3+/4+) → Extract it
   - If you see heart rhythm info → Extract it

🚨 IF ANY OF THESE SECTIONS EXIST IN THE DOCUMENT, THEY MUST BE IN YOUR OUTPUT!
🚨 Empty arrays [] are ONLY acceptable if the section truly does NOT exist in the document!`

  // ✅ Enhanced retry logic with exponential backoff for API connection issues
  const maxRetries = 3
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // ✅ Use Gemini (faster, 1M context) with OpenAI fallback
      const aiModel = useGemini 
        ? google("gemini-2.0-flash")
        : openai("gpt-4o-mini")
      
      console.log(`[OASIS-FAST] ${useGemini ? 'Gemini' : 'OpenAI'} call attempt ${attempt}/${maxRetries}`)
      
      const response = await generateText({
        model: aiModel,
        prompt: fastPrompt,
        temperature: 0.1,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(300000), // ✅ 5 min timeout for large documents (increased from 2min)
      })

      console.log('[OASIS-FAST] ✅ AI response received:', response.text.length, 'chars')

    // Parse JSON response
    let jsonText = response.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    }
    
    const jsonStart = jsonText.indexOf('{')
    const jsonEnd = jsonText.lastIndexOf('}') + 1
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd)
    }

    // Sanitize control characters
    jsonText = jsonText.replace(/[\x00-\x1F\x7F]/g, ' ')

    const analysis = JSON.parse(jsonText)
    
    console.log('[OASIS-FAST] ✅ Analysis complete!')
    console.log('[OASIS-FAST] Quality Score:', analysis.qualityScore)
    console.log('[OASIS-FAST] Patient:', analysis.patientInfo?.name)

    // Return in OasisAnalysisResult format with all required properties including all status fields
    return {
      patientInfo: analysis.patientInfo || { name: 'Unknown', mrn: 'N/A', visitType: 'OASIS', payor: 'N/A', visitDate: 'N/A', clinician: 'N/A' },
      primaryDiagnosis: analysis.primaryDiagnosis || { code: 'N/A', description: 'Not extracted', confidence: 0 },
      secondaryDiagnoses: analysis.secondaryDiagnoses || [],
      functionalStatus: analysis.functionalStatus || [],
      medications: analysis.medications || [],
      // ✅ NEW: Include all clinical status sections extracted from document
      painStatus: analysis.painStatus || [],
      integumentaryStatus: analysis.integumentaryStatus || [],
      respiratoryStatus: analysis.respiratoryStatus || [],
      cardiacStatus: analysis.cardiacStatus || [],
      eliminationStatus: analysis.eliminationStatus || [],
      neuroEmotionalBehavioralStatus: analysis.neuroEmotionalBehavioralStatus || [],
      // Include inconsistencies for data quality
      inconsistencies: analysis.inconsistencies || [],
      missingInformation: analysis.missingInformation || [],
      qualityScore: analysis.qualityScore || 70,
      confidenceScore: analysis.confidenceScore || 65,
      completenessScore: analysis.completenessScore || 65,
      flaggedIssues: analysis.flaggedIssues || [],
      recommendations: analysis.recommendations || [],
      corrections: [], // Required property
      riskFactors: [], // Required property
      financialImpact: analysis.financialImpact || { currentRevenue: 0, optimizedRevenue: 0, potentialIncrease: 0 },
      suggestedCodes: analysis.suggestedCodes || [],
      comprehensiveQA: { summary: 'Fast analysis completed', missingFields: [], qaScore: analysis.qualityScore || 70 },
      codingReview: { errors: [], suggestions: [] },
      qapiAudit: analysis.qapiAudit || { deficiencies: [], rootCauses: [], correctiveActions: [] },
    } as OasisAnalysisResult

    } catch (attemptError) {
      lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError))
      console.error(`[OASIS-FAST] ⚠️ Attempt ${attempt} failed:`, lastError.message)
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 2000 // Exponential backoff: 4s, 8s, 16s
        console.log(`[OASIS-FAST] Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
    
  // All retries failed - extract basic info from text as fallback
  console.error('[OASIS-FAST] ❌ All retries failed:', lastError?.message)
  
  const mrnMatch = extractedText.match(/MRN[:\s]*([A-Z0-9]+)/i)
  const nameMatch = extractedText.match(/Patient(?:\s+Name)?[:\s]*([A-Z][a-z]+(?:,?\s*[A-Z][a-z]+)?)/i)
  const diagMatch = extractedText.match(/([A-Z]\d{2}\.?\d{0,3})/g)
  
  return {
    patientInfo: {
      name: nameMatch ? nameMatch[1].trim() : 'Unknown Patient',
      mrn: mrnMatch ? mrnMatch[1] : 'N/A',
      visitType: 'OASIS',
      payor: 'Medicare',
      visitDate: new Date().toISOString().split('T')[0],
      clinician: 'N/A'
    },
    primaryDiagnosis: {
      code: diagMatch ? diagMatch[0] : 'N/A',
      description: 'Extracted from document',
      confidence: 50
    },
    secondaryDiagnoses: [],
    functionalStatus: [],
    medications: [],
    // ✅ Include all clinical status sections even in fallback
    painStatus: [],
    integumentaryStatus: [],
    respiratoryStatus: [],
    cardiacStatus: [],
    eliminationStatus: [],
    neuroEmotionalBehavioralStatus: [],
    inconsistencies: [],
    missingInformation: [{ field: 'AI Analysis', location: 'System', impact: 'Unable to analyze - API timeout', recommendation: 'Retry upload or manual review', required: true }],
    qualityScore: 60,
    confidenceScore: 50,
    completenessScore: 55,
    flaggedIssues: [{ issue: `Analysis failed after ${maxRetries} attempts - ${lastError?.message || 'API timeout'}`, severity: 'high', location: 'System', suggestion: 'Retry upload or review document manually', category: 'system' }],
    recommendations: [{ recommendation: 'Review document manually due to API timeout', priority: 'high', category: 'documentation', expectedImpact: 'Ensure accurate documentation' }],
    corrections: [],
    riskFactors: [],
    financialImpact: { 
      currentRevenue: 0, 
      optimizedRevenue: 0, 
      increase: 0, 
      percentIncrease: 0,
      breakdown: [] 
    },
    suggestedCodes: [],
  } as OasisAnalysisResult
}
