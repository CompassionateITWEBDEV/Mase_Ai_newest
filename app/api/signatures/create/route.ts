import { type NextRequest, NextResponse } from "next/server"
import { signatureService } from "@/lib/signature-services"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentName, recipients, templateId } = body

    // Validate required fields
    if (!documentName || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: "Missing required fields: documentName and recipients" }, { status: 400 })
    }

    // Validate recipients
    for (const recipient of recipients) {
      if (!recipient.name || !recipient.email || !recipient.role) {
        return NextResponse.json({ error: "Each recipient must have name, email, and role" }, { status: 400 })
      }
    }

    // Create signature request
    const signatureRequest = await signatureService.createSignatureRequest(documentName, recipients, templateId)

    // Send for signature
    await signatureService.sendForSignature(signatureRequest.id)

    return NextResponse.json({
      success: true,
      data: signatureRequest,
    })
  } catch (error) {
    console.error("Error creating signature request:", error)
    return NextResponse.json({ error: "Failed to create signature request" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("id")

    if (requestId) {
      // Get specific signature request
      const signatureRequest = await signatureService.getSignatureRequest(requestId)

      if (!signatureRequest) {
        return NextResponse.json({ error: "Signature request not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: signatureRequest,
      })
    } else {
      // Get all signature requests
      const requests = await signatureService.getAllRequests()

      return NextResponse.json({
        success: true,
        data: requests,
      })
    }
  } catch (error) {
    console.error("Error fetching signature requests:", error)
    return NextResponse.json({ error: "Failed to fetch signature requests" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, recipientEmail, status } = body

    if (!requestId || !recipientEmail || !status) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, recipientEmail, and status" },
        { status: 400 },
      )
    }

    // Update recipient status
    await signatureService.updateRecipientStatus(requestId, recipientEmail, status)

    // Get updated request
    const updatedRequest = await signatureService.getSignatureRequest(requestId)

    return NextResponse.json({
      success: true,
      data: updatedRequest,
    })
  } catch (error) {
    console.error("Error updating signature request:", error)
    return NextResponse.json({ error: "Failed to update signature request" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("id")

    if (!requestId) {
      return NextResponse.json({ error: "Missing required parameter: id" }, { status: 400 })
    }

    // Cancel signature request
    await signatureService.cancelRequest(requestId)

    return NextResponse.json({
      success: true,
      message: "Signature request cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling signature request:", error)
    return NextResponse.json({ error: "Failed to cancel signature request" }, { status: 500 })
  }
}
