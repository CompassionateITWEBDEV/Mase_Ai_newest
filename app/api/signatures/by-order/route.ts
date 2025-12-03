import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// GET - Fetch signature data for a specific order
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    // Find signature request for this order
    const { data: signatureRequest, error: requestError } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (requestError || !signatureRequest) {
      // Try to find by document name containing order ID
      const { data: requestByName } = await supabase
        .from("signature_requests")
        .select("*")
        .ilike("document_name", `%${orderId}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!requestByName) {
        return NextResponse.json({
          success: true,
          data: null,
          message: "No signature found for this order",
        })
      }

      // Get recipients with signature data
      const { data: recipients } = await supabase
        .from("signature_recipients")
        .select("*")
        .eq("signature_request_id", requestByName.id)

      const signedRecipient = recipients?.find(
        (r: any) => r.status === "signed" && r.signature_data
      )

      return NextResponse.json({
        success: true,
        data: signedRecipient
          ? {
              signatureData: signedRecipient.signature_data,
              signerName: signedRecipient.signer_name || signedRecipient.name,
              signedAt: signedRecipient.signed_at,
              status: requestByName.status,
            }
          : null,
      })
    }

    // Get recipients with signature data
    const { data: recipients } = await supabase
      .from("signature_recipients")
      .select("*")
      .eq("signature_request_id", signatureRequest.id)

    const signedRecipient = recipients?.find(
      (r: any) => r.status === "signed" && r.signature_data
    )

    return NextResponse.json({
      success: true,
      data: signedRecipient
        ? {
            signatureData: signedRecipient.signature_data,
            signerName: signedRecipient.signer_name || signedRecipient.name,
            signedAt: signedRecipient.signed_at,
            status: signatureRequest.status,
          }
        : null,
    })
  } catch (error) {
    console.error("Error fetching signature for order:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch signature" },
      { status: 500 },
    )
  }
}

