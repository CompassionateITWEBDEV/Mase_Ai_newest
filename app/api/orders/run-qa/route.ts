import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { orderId, chartId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    console.log(`[Order QA] Running comprehensive QA for order ${orderId}, chart ${chartId}`)

    // Run comprehensive QA analysis
    const qaResponse = await fetch(`${request.nextUrl.origin}/api/comprehensive-qa/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chartId: chartId,
        includeAIAnalysis: true,
        documentTypes: [
          "oasis",
          "clinicalNotes",
          "medicationRecords",
          "carePlan",
          "physicianOrders",
          "progressNotes",
          "assessments",
        ],
        priority: "high",
        requestedBy: "order-management",
        includeFinancialAnalysis: true,
        includeComplianceCheck: true,
      }),
    })

    const qaData = await qaResponse.json()

    if (!qaData.success) {
      return NextResponse.json(
        {
          success: false,
          error: "QA analysis failed",
          details: qaData.error,
        },
        { status: 500 },
      )
    }

    // Calculate overall QA status
    const avgQualityScore = qaData.overallQualityScore || 0
    const qaStatus = avgQualityScore >= 80 ? "passed" : avgQualityScore >= 60 ? "needs_review" : "failed"

    // Update order with QA results
    const { data: updatedOrder, error: updateError } = await supabase
      .from("healthcare_orders")
      .update({
        qa_status: qaStatus,
        quality_score: avgQualityScore,
        qa_completed_at: new Date().toISOString(),
        qa_results: qaData,
      })
      .eq("id", orderId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating order with QA results:", updateError)
    }

    return NextResponse.json({
      success: true,
      qaResults: qaData,
      qaStatus,
      qualityScore: avgQualityScore,
      order: updatedOrder,
    })
  } catch (error) {
    console.error("[Order QA] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}


