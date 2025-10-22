import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log("[v0] Fetching optimization data for ID:", id)

    const supabase = await createClient()

    const { data: assessment, error } = await supabase
      .from("oasis_assessments")
      .select("*")
      .eq("upload_id", id)
      .single()

    if (error || !assessment) {
      console.log("[v0] Assessment not found:", id)
      return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 })
    }

    console.log("[v0] Found assessment:", assessment.id)

    const { data: doctorOrders } = await supabase.from("doctor_orders").select("*").eq("assessment_id", id)

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
          suggestedCodes: assessment.suggested_codes,
          corrections: assessment.corrections,
          riskFactors: assessment.risk_factors,
          recommendations: assessment.recommendations,
          flaggedIssues: assessment.flagged_issues,
          financialImpact: assessment.financial_impact,
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
        doctorOrders: doctorOrders || [],
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching optimization data:", error)
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
