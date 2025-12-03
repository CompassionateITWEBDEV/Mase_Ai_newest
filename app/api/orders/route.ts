import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

    let query = supabase
      .from("healthcare_orders")
      .select("*")
      .order("date_received", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (priority && priority !== "all") {
      query = query.eq("priority", priority)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
      count: orders?.length || 0,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data: newOrder, error } = await supabase
      .from("healthcare_orders")
      .insert({
        patient_name: body.patientName,
        patient_id: body.patientId,
        order_type: body.orderType,
        physician: body.physician,
        date_received: body.dateReceived,
        status: body.status || "pending_qa",
        priority: body.priority,
        axxess_order_id: body.axxessOrderId,
        services: body.services,
        insurance_type: body.insuranceType,
        estimated_value: body.estimatedValue,
        chart_id: body.chartId,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating order:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    const updateData: any = {}
    if (updates.status) updateData.status = updates.status
    if (updates.qaReviewer) updateData.qa_reviewer = updates.qaReviewer
    if (updates.qaDate) updateData.qa_date = updates.qaDate
    if (updates.qaComments) updateData.qa_comments = updates.qaComments
    if (updates.signatureStatus) updateData.signature_status = updates.signatureStatus
    if (updates.qaAnalysisId) updateData.qa_analysis_id = updates.qaAnalysisId
    if (updates.qualityScore !== undefined) updateData.quality_score = updates.qualityScore

    const { data: updatedOrder, error } = await supabase
      .from("healthcare_orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating order:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}


