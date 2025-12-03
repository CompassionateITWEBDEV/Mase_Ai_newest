import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// POST - Update order when signature is completed
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { orderId, signatureRequestId, signatureData, signerName, signedAt } = body

    if (!orderId && !signatureRequestId) {
      return NextResponse.json(
        { success: false, error: "Order ID or Signature Request ID is required" },
        { status: 400 }
      )
    }

    // Find the order
    let query = supabase.from("healthcare_orders").select("*")
    
    if (orderId) {
      query = query.eq("order_id", orderId)
    } else if (signatureRequestId) {
      query = query.eq("signature_request_id", signatureRequestId)
    }

    const { data: order, error: findError } = await query.single()

    if (findError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    // Update order with signature data
    const { data, error } = await supabase
      .from("healthcare_orders")
      .update({
        status: "signed",
        signature_status: "signed",
        signature_data: signatureData,
        signed_by: signerName,
        signed_at: signedAt || new Date().toISOString(),
      })
      .eq("id", order.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating order signature:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: data.order_id,
        status: data.status,
        signatureStatus: data.signature_status,
        signedBy: data.signed_by,
        signedAt: data.signed_at,
      },
      message: "Order signature status updated successfully",
    })
  } catch (error) {
    console.error("Error in update-signature:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update signature" },
      { status: 500 }
    )
  }
}

