import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getQapiAuditFromAssessment } from "@/lib/oasis-qapi-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[OASIS] Fetching optimization data for ID:", id)

    const supabase = await createClient()

    const { data: assessment, error } = await supabase
      .from("oasis_assessments")
      .select("*")
      .eq("upload_id", id)
      .single()

    if (error || !assessment) {
      console.log("[OASIS] Assessment not found:", id)
      return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 })
    }

    console.log("[OASIS] Found assessment:", assessment.id)

    const { data: doctorOrders } = await supabase.from("doctor_orders").select("*").eq("assessment_id", id)

    console.log("[OASIS] Assessment data structure:", {
      hasPrimaryDx: !!assessment.primary_diagnosis,
      hasSecondaryDx: !!assessment.secondary_diagnoses,
      hasFunctionalStatus: !!assessment.functional_status,
      hasMedications: !!assessment.medications,
      hasExtractedData: !!assessment.extracted_data,
      hasMissingInfo: !!assessment.missing_information,
      hasInconsistencies: !!assessment.inconsistencies,
      hasSuggestedCodes: !!assessment.suggested_codes,
      hasFinancialImpact: !!assessment.financial_impact
    })
    
    console.log("[OASIS] 💊 Medications from DB:", assessment.medications)
    console.log("[OASIS] ⚠️ Inconsistencies from DB:", assessment.inconsistencies)
    
    console.log("[OASIS] 🔍 RAW patient_name from DB:", assessment.patient_name)
    console.log("[OASIS] 🔍 RAW mrn from DB:", assessment.mrn)
    console.log("[OASIS] 🔍 RAW extracted_data type:", typeof assessment.extracted_data)

    console.log("[OASIS] 🔍 PRIMARY DIAGNOSIS FROM DB:", JSON.stringify(assessment.primary_diagnosis, null, 2))
    console.log("[OASIS] 🔍 SECONDARY DIAGNOSES FROM DB:", JSON.stringify(assessment.secondary_diagnoses, null, 2))

    // Parse JSON strings if needed
    const parsePrimaryDiagnosis = (data: any) => {
      if (!data) return null
      if (typeof data === 'string') {
        try {
          return JSON.parse(data)
        } catch {
          return null
        }
      }
      return data
    }

    const parseSecondaryDiagnoses = (data: any) => {
      if (!data) return []
      if (Array.isArray(data)) {
        return data.map(item => {
          if (typeof item === 'string') {
            try {
              return JSON.parse(item)
            } catch {
              return null
            }
          }
          return item
        }).filter(Boolean)
      }
      return []
    }

    const primaryDiagnosis = parsePrimaryDiagnosis(assessment.primary_diagnosis)
    const secondaryDiagnoses = parseSecondaryDiagnoses(assessment.secondary_diagnoses)

    console.log("[OASIS] 🔍 PARSED PRIMARY DIAGNOSIS:", JSON.stringify(primaryDiagnosis, null, 2))
    console.log("[OASIS] 🔍 PARSED SECONDARY DIAGNOSES:", JSON.stringify(secondaryDiagnoses, null, 2))

    // Helper to safely parse JSON fields
    const safeJsonParse = (data: any) => {
      if (!data) return data
      if (typeof data === 'string') {
        try {
          return JSON.parse(data)
        } catch (e) {
          console.error('[OASIS] Failed to parse JSON:', e)
          return data
        }
      }
      return data
    }
    
    // Parse extracted data early to access patientInfo
    const extractedData = safeJsonParse(assessment.extracted_data)
    console.log("[OASIS] 🔍 EXTRACTED DATA:", JSON.stringify(extractedData, null, 2))
    console.log("[OASIS] 🔍 PATIENT INFO FROM EXTRACTED DATA:", JSON.stringify(extractedData?.patientInfo, null, 2))

    // ✅ Build qapiAudit from assessment data (handles both new and old documents)
    const qapiAudit = getQapiAuditFromAssessment(assessment)
    console.log("[OASIS] 🔍 QAPI Audit:", qapiAudit ? "Found" : "Not found, will be built from available data")

    // ⚠️ PRIORITIZE extracted_data over individual database columns
    // The extracted_data contains the freshly analyzed JSON data
    // Only use database columns as fallback if extracted_data doesn't have the data
    
    // Helper to get data from extracted_data first, then fallback to DB column
    const getFromExtractedData = (extractedPath: string, dbValue: any) => {
      const paths = extractedPath.split('.')
      let value = extractedData
      for (const path of paths) {
        value = value?.[path]
      }
      return value || dbValue
    }

    // Get primary diagnosis from extracted_data first
    const extractedPrimaryDx = extractedData?.primaryDiagnosis || extractedData?.extractedData?.primaryDiagnosis
    const finalPrimaryDiagnosis = extractedPrimaryDx || primaryDiagnosis

    // Get secondary diagnoses from extracted_data first
    const extractedSecondaryDx = extractedData?.secondaryDiagnoses || extractedData?.otherDiagnoses || extractedData?.extractedData?.otherDiagnoses
    const finalSecondaryDiagnoses = (Array.isArray(extractedSecondaryDx) && extractedSecondaryDx.length > 0) 
      ? extractedSecondaryDx 
      : secondaryDiagnoses

    // Get functional status from extracted_data first
    const extractedFunctionalStatus = extractedData?.functionalStatus || extractedData?.extractedData?.functionalStatus
    const finalFunctionalStatus = (Array.isArray(extractedFunctionalStatus) && extractedFunctionalStatus.length > 0)
      ? extractedFunctionalStatus
      : safeJsonParse(assessment.functional_status)

    // Get medications from extracted_data first
    const extractedMedications = extractedData?.medications || extractedData?.extractedData?.medications
    const finalMedications = (Array.isArray(extractedMedications) && extractedMedications.length > 0)
      ? extractedMedications
      : (safeJsonParse(assessment.medications) || [])

    // Get missing information from extracted_data first
    const extractedMissingInfo = extractedData?.missingInformation || extractedData?.missing_information
    const finalMissingInfo = (Array.isArray(extractedMissingInfo) && extractedMissingInfo.length > 0)
      ? extractedMissingInfo
      : safeJsonParse(assessment.missing_information)

    // Get inconsistencies from extracted_data first
    const extractedInconsistencies = extractedData?.inconsistencies
    const finalInconsistencies = (Array.isArray(extractedInconsistencies) && extractedInconsistencies.length > 0)
      ? extractedInconsistencies
      : safeJsonParse(assessment.inconsistencies)

    // ✅ NEW: Get all clinical status sections from extracted_data
    const extractedPainStatus = extractedData?.painStatus || []
    const extractedIntegumentaryStatus = extractedData?.integumentaryStatus || []
    const extractedRespiratoryStatus = extractedData?.respiratoryStatus || []
    const extractedCardiacStatus = extractedData?.cardiacStatus || []
    const extractedEliminationStatus = extractedData?.eliminationStatus || []
    const extractedNeuroEmotionalBehavioralStatus = extractedData?.neuroEmotionalBehavioralStatus || []
    
    console.log("[OASIS] 📊 Clinical Status Sections from extracted_data:")
    console.log("[OASIS]   - Pain Status:", extractedPainStatus?.length || 0, "items")
    console.log("[OASIS]   - Integumentary Status:", extractedIntegumentaryStatus?.length || 0, "items")
    console.log("[OASIS]   - Respiratory Status:", extractedRespiratoryStatus?.length || 0, "items")
    console.log("[OASIS]   - Cardiac Status:", extractedCardiacStatus?.length || 0, "items")
    console.log("[OASIS]   - Elimination Status:", extractedEliminationStatus?.length || 0, "items")
    console.log("[OASIS]   - Neuro/Emotional/Behavioral Status:", extractedNeuroEmotionalBehavioralStatus?.length || 0, "items")

    console.log("[OASIS] ✅ Using extracted_data as primary source for all analysis results")
    console.log("[OASIS] 💊 Medications from extracted_data:", finalMedications?.length || 0)
    console.log("[OASIS] 🎯 Functional Status from extracted_data:", finalFunctionalStatus?.length || 0)

    return NextResponse.json({
      success: true,
      data: {
        analysisResults: {
          uploadId: assessment.upload_id,
          fileName: assessment.file_name,
          processedAt: assessment.processed_at,
          extractedText: assessment.extracted_text,
          uploadType: assessment.upload_type || 'comprehensive-qa',
          priority: assessment.priority || 'medium',
          notes: assessment.notes || '',
          qualityScore: extractedData?.qualityScore || assessment.quality_score,
          confidence: extractedData?.confidenceScore || assessment.confidence_score,
          completenessScore: extractedData?.completenessScore || assessment.completeness_score,
          // ⚠️ PRIORITIZE: Use extracted_data diagnoses (freshly analyzed) over DB columns
          primaryDiagnosis: finalPrimaryDiagnosis,
          secondaryDiagnoses: finalSecondaryDiagnoses,
          // ⚠️ PRIORITIZE: Use extracted_data functional status (freshly analyzed)
          functionalStatus: finalFunctionalStatus,
          // ⚠️ PRIORITIZE: Use extracted_data medications (freshly analyzed)
          medications: finalMedications,
          // Full Extracted Data
          extractedData: extractedData,
          // Patient Info from extracted data (for easy access)
          patientInfo: extractedData?.patientInfo || extractedData?.extractedData?.patientInfo || null,
          // ⚠️ PRIORITIZE: Use extracted_data missing information (freshly analyzed)
          missingInformation: finalMissingInfo,
          // ⚠️ PRIORITIZE: Use extracted_data inconsistencies (freshly analyzed)
          inconsistencies: finalInconsistencies,
          // ✅ NEW: Include all clinical status sections
          painStatus: extractedPainStatus,
          integumentaryStatus: extractedIntegumentaryStatus,
          respiratoryStatus: extractedRespiratoryStatus,
          cardiacStatus: extractedCardiacStatus,
          eliminationStatus: extractedEliminationStatus,
          neuroEmotionalBehavioralStatus: extractedNeuroEmotionalBehavioralStatus,
          // Debug Info
          debugInfo: extractedData?.debugInfo || safeJsonParse(assessment.debug_info),
          // Additional AI suggestions - prioritize extracted_data
          suggestedCodes: extractedData?.suggestedCodes || safeJsonParse(assessment.suggested_codes),
          corrections: extractedData?.corrections || safeJsonParse(assessment.corrections),
          riskFactors: extractedData?.riskFactors || safeJsonParse(assessment.risk_factors),
          recommendations: extractedData?.recommendations || safeJsonParse(assessment.recommendations),
          flaggedIssues: extractedData?.flaggedIssues || safeJsonParse(assessment.flagged_issues),
          // ✅ Prioritize extracted_data.financialImpact, but fallback to database columns if missing
          financialImpact: extractedData?.financialImpact || safeJsonParse(assessment.financial_impact) || {
            currentRevenue: assessment.current_revenue || 0,
            optimizedRevenue: assessment.optimized_revenue || 0,
            increase: assessment.revenue_increase || 0,
            percentIncrease: assessment.current_revenue && assessment.optimized_revenue
              ? Math.round(((assessment.optimized_revenue - assessment.current_revenue) / assessment.current_revenue) * 10000) / 100
              : 0,
            // Try to get HIPPS codes from extracted_data if available
            currentHipps: extractedData?.financialImpact?.currentHipps || 'N/A',
            optimizedHipps: extractedData?.financialImpact?.optimizedHipps || 'N/A',
            currentCaseMix: extractedData?.financialImpact?.currentCaseMix || 0,
            optimizedCaseMix: extractedData?.financialImpact?.optimizedCaseMix || 0,
            currentFunctionalScore: extractedData?.financialImpact?.currentFunctionalScore || 0,
            optimizedFunctionalScore: extractedData?.financialImpact?.optimizedFunctionalScore || 0,
            admissionSource: extractedData?.financialImpact?.admissionSource || 'Community',
            timing: extractedData?.financialImpact?.timing || 'Early (1-30 days)',
            clinicalGroup: extractedData?.financialImpact?.clinicalGroup || 'A',
            comorbidityLevel: extractedData?.financialImpact?.comorbidityLevel || 'Medium Comorbidity',
          },
          // ✅ Explicitly include qapiAudit (built from data if not stored)
          qapiAudit: qapiAudit,
          // ✅ Also include other comprehensive sections
          qaReview: extractedData?.qaReview || null,
          codingReview: extractedData?.codingReview || null,
          financialOptimization: extractedData?.financialOptimization || null,
        },
        patientData: {
          // ⚠️ PRIORITIZE: Use extracted_data patient info over DB columns
          name: extractedData?.patientInfo?.name || extractedData?.extractedData?.patientInfo?.name || assessment.patient_name,
          firstName: extractedData?.patientInfo?.name?.split(" ")[0] || assessment.patient_name?.split(" ")[0],
          lastName: extractedData?.patientInfo?.name?.split(" ").slice(1).join(" ") || assessment.patient_name?.split(" ").slice(1).join(" "),
          mrn: extractedData?.patientInfo?.mrn || extractedData?.extractedData?.patientInfo?.mrn || assessment.mrn,
          visitType: extractedData?.patientInfo?.visitType || extractedData?.extractedData?.patientInfo?.visitType || assessment.visit_type,
          payor: extractedData?.patientInfo?.payor || extractedData?.extractedData?.patientInfo?.payor || assessment.payor,
          visitDate: extractedData?.patientInfo?.visitDate || extractedData?.extractedData?.patientInfo?.visitDate || assessment.visit_date,
          clinician: extractedData?.patientInfo?.clinician || extractedData?.extractedData?.patientInfo?.clinician || assessment.clinician_name,
        },
        // Also include patientInfo from extracted_data as primary source
        patientInfoFromExtraction: extractedData?.patientInfo || extractedData?.extractedData?.patientInfo || null,
        doctorOrders: doctorOrders || [],
      },
    })
  } catch (error) {
    console.error("[OASIS] Error fetching optimization data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
