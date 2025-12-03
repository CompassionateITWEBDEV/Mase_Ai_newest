import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// GET - Fetch all healthcare orders from database
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("healthcare_orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      // If table doesn't exist, return mock data
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          data: getMockOrders(),
          message: "Using mock data. Run setup-healthcare-orders-table.sql to enable database storage.",
          isMock: true,
        })
      }
      throw error
    }

    // Transform database format to frontend format
    const orders = (data || []).map(transformDbToFrontend)

    return NextResponse.json({
      success: true,
      data: orders.length > 0 ? orders : getMockOrders(),
      isReal: orders.length > 0,
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({
      success: true,
      data: getMockOrders(),
      isReal: false,
    })
  }
}

// POST - Create new order or sync multiple orders
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    // Handle bulk sync
    if (Array.isArray(body.orders)) {
      const ordersToInsert = body.orders.map(transformFrontendToDb)

      const { data, error } = await supabase
        .from("healthcare_orders")
        .upsert(ordersToInsert, { onConflict: "order_id" })
        .select()

      if (error) {
        console.error("Error syncing orders:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: (data || []).map(transformDbToFrontend),
        message: `Synced ${data?.length || 0} orders`,
      })
    }

    // Handle single order
    const orderData = transformFrontendToDb(body)

    const { data, error } = await supabase
      .from("healthcare_orders")
      .upsert(orderData, { onConflict: "order_id" })
      .select()
      .single()

    if (error) {
      console.error("Error creating order:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: transformDbToFrontend(data),
    })
  } catch (error) {
    console.error("Error in POST:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 },
    )
  }
}

// PUT - Update order (status, QA, signature)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, orderId, ...updates } = body

    if (!id && !orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    // Build update object
    const updateData: any = {}

    if (updates.status) updateData.status = updates.status
    if (updates.qaReviewer) updateData.qa_reviewer = updates.qaReviewer
    if (updates.qaDate) updateData.qa_date = updates.qaDate
    if (updates.qaComments) updateData.qa_comments = updates.qaComments
    if (updates.signatureStatus) updateData.signature_status = updates.signatureStatus
    if (updates.signatureRequestId) updateData.signature_request_id = updates.signatureRequestId
    if (updates.signedAt) updateData.signed_at = updates.signedAt
    if (updates.signedBy) updateData.signed_by = updates.signedBy
    if (updates.signatureData) updateData.signature_data = updates.signatureData
    if (updates.qualityScore !== undefined) updateData.quality_score = updates.qualityScore
    if (updates.qaCompletedAt) updateData.qa_completed_at = updates.qaCompletedAt

    // Use order_id if id is a string like "ORD-001"
    const query = id 
      ? supabase.from("healthcare_orders").update(updateData).eq("id", id)
      : supabase.from("healthcare_orders").update(updateData).eq("order_id", orderId)

    const { data, error } = await query.select().single()

    if (error) {
      console.error("Error updating order:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: transformDbToFrontend(data),
    })
  } catch (error) {
    console.error("Error in PUT:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update order" },
      { status: 500 },
    )
  }
}

// DELETE - Delete order
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const orderId = searchParams.get("orderId")

    if (!id && !orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const query = id
      ? supabase.from("healthcare_orders").delete().eq("id", id)
      : supabase.from("healthcare_orders").delete().eq("order_id", orderId)

    const { error } = await query

    if (error) {
      console.error("Error deleting order:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    })
  } catch (error) {
    console.error("Error in DELETE:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete order" },
      { status: 500 },
    )
  }
}

// Transform database record to frontend format
function transformDbToFrontend(record: any) {
  return {
    id: record.order_id,
    dbId: record.id,
    patientName: record.patient_name,
    patientId: record.patient_id,
    orderType: record.order_type,
    physician: record.physician,
    dateReceived: record.date_received ? new Date(record.date_received).toISOString().split("T")[0] : "",
    status: record.status,
    priority: record.priority,
    qaReviewer: record.qa_reviewer,
    qaDate: record.qa_date,
    qaComments: record.qa_comments,
    signatureStatus: record.signature_status,
    signatureRequestId: record.signature_request_id,
    signedAt: record.signed_at,
    signedBy: record.signed_by,
    signatureData: record.signature_data,
    axxessOrderId: record.axxess_order_id || record.order_id,
    services: record.services || [],
    insuranceType: record.insurance_type,
    estimatedValue: parseFloat(record.estimated_value) || 0,
    chartId: record.chart_id,
    qualityScore: record.quality_score,
    qaCompletedAt: record.qa_completed_at,
  }
}

// Transform frontend format to database format
function transformFrontendToDb(order: any) {
  return {
    order_id: order.id || `ORD-${Date.now()}`,
    axxess_order_id: order.axxessOrderId || order.id,
    patient_name: order.patientName,
    patient_id: order.patientId,
    order_type: order.orderType,
    physician: order.physician,
    date_received: order.dateReceived || new Date().toISOString().split("T")[0],
    status: order.status || "pending_qa",
    priority: order.priority || "routine",
    qa_reviewer: order.qaReviewer,
    qa_date: order.qaDate,
    qa_comments: order.qaComments,
    signature_status: order.signatureStatus,
    signature_request_id: order.signatureRequestId,
    signed_at: order.signedAt,
    signed_by: order.signedBy,
    signature_data: order.signatureData,
    services: order.services || [],
    insurance_type: order.insuranceType,
    estimated_value: order.estimatedValue || 0,
    chart_id: order.chartId,
    quality_score: order.qualityScore,
    qa_completed_at: order.qaCompletedAt,
  }
}

// Mock orders fallback
function getMockOrders() {
  return [
    {
      id: "ORD-001",
      patientName: "John Smith",
      patientId: "P-12345",
      orderType: "Home Health",
      physician: "Dr. Sarah Johnson",
      dateReceived: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending_qa",
      priority: "routine",
      axxessOrderId: "AXX-2024-001",
      services: ["Skilled Nursing", "Physical Therapy"],
      insuranceType: "Medicare",
      estimatedValue: 1250,
    },
    {
      id: "ORD-002",
      patientName: "Maria Garcia",
      patientId: "P-12346",
      orderType: "Hospice",
      physician: "Dr. Michael Chen",
      dateReceived: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending_qa",
      priority: "urgent",
      axxessOrderId: "AXX-2024-002",
      services: ["Hospice Care", "Pain Management"],
      insuranceType: "Medicaid",
      estimatedValue: 2100,
    },
    {
      id: "ORD-003",
      patientName: "Robert Wilson",
      patientId: "P-12347",
      orderType: "Home Health",
      physician: "Dr. Emily Brown",
      dateReceived: new Date().toISOString().split("T")[0],
      status: "qa_approved",
      priority: "routine",
      qaReviewer: "Jane Nurse",
      qaDate: new Date().toISOString(),
      axxessOrderId: "AXX-2024-003",
      services: ["Occupational Therapy", "Speech Therapy"],
      insuranceType: "Private Insurance",
      estimatedValue: 1800,
    },
    {
      id: "ORD-004",
      patientName: "Linda Davis",
      patientId: "P-12348",
      orderType: "Home Health",
      physician: "Dr. James Wilson",
      dateReceived: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "pending_signature",
      priority: "stat",
      qaReviewer: "John QA",
      qaDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      signatureStatus: "pending",
      axxessOrderId: "AXX-2024-004",
      services: ["Skilled Nursing", "Wound Care"],
      insuranceType: "Medicare",
      estimatedValue: 950,
    },
    {
      id: "ORD-005",
      patientName: "James Brown",
      patientId: "P-12349",
      orderType: "Hospice",
      physician: "Dr. Lisa Anderson",
      dateReceived: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "signed",
      priority: "routine",
      qaReviewer: "Sarah QA",
      qaDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      signatureStatus: "signed",
      signedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      signedBy: "Dr. Lisa Anderson",
      axxessOrderId: "AXX-2024-005",
      services: ["Hospice Care", "Social Services"],
      insuranceType: "Medicare",
      estimatedValue: 3200,
    },
  ]
}

