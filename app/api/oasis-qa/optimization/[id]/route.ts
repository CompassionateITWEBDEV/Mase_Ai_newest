import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    return NextResponse.json({
      success: true,
      data: {
        analysisResults: {
          uploadId: assessment.upload_id,
          fileName: assessment.file_name,
          processedAt: assessment.processed_at,
          extractedText: assessment.extracted_text,
          qualityScore: assessment.quality_score,
          confidence: assessment.confidence_score,
          completenessScore: assessment.completeness_score,
          // ACTUAL EXTRACTED DIAGNOSES FROM OASIS DOCUMENT (PARSED)
          primaryDiagnosis: primaryDiagnosis,
          secondaryDiagnoses: secondaryDiagnoses,
          // Functional Status (M1800-M1870)
          functionalStatus: safeJsonParse(assessment.functional_status),
          // Medications (M2001-M2003)
          medications: safeJsonParse(assessment.medications) || [],
          // Full Extracted Data
          extractedData: extractedData,
          // Patient Info from extracted data (for easy access)
          patientInfo: extractedData?.patientInfo || null,
          // Missing Information
          missingInformation: safeJsonParse(assessment.missing_information),
          // Inconsistencies
          inconsistencies: safeJsonParse(assessment.inconsistencies),
          // Debug Info
          debugInfo: safeJsonParse(assessment.debug_info),
          // Additional AI suggestions
          suggestedCodes: safeJsonParse(assessment.suggested_codes),
          corrections: safeJsonParse(assessment.corrections),
          riskFactors: safeJsonParse(assessment.risk_factors),
          recommendations: safeJsonParse(assessment.recommendations),
          flaggedIssues: safeJsonParse(assessment.flagged_issues),
          financialImpact: safeJsonParse(assessment.financial_impact),
        },
        patientData: {
          name: assessment.patient_name,
          firstName: assessment.patient_name?.split(" ")[0],
          lastName: assessment.patient_name?.split(" ").slice(1).join(" "),
          mrn: assessment.mrn,
          visitType: assessment.visit_type,
          payor: assessment.payor,
          visitDate: assessment.visit_date,
          clinician: assessment.clinician_name,
        },
        // Also include patientInfo from extracted_data as fallback
        patientInfoFromExtraction: extractedData?.patientInfo || null,
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
