import { type NextRequest, NextResponse } from "next/server"
import { signatureService } from "@/lib/signature-services"

// Webhook endpoint for signature provider callbacks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body

    console.log("Received signature webhook:", { event, data })

    // Validate webhook signature (in production, verify with provider's signature)
    const signature = request.headers.get("x-signature")
    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 })
    }

    // Process different webhook events
    switch (event) {
      case "document.viewed":
        await handleDocumentViewed(data)
        break

      case "document.signed":
        await handleDocumentSigned(data)
        break

      case "document.completed":
        await handleDocumentCompleted(data)
        break

      case "document.declined":
        await handleDocumentDeclined(data)
        break

      case "document.expired":
        await handleDocumentExpired(data)
        break

      default:
        console.log("Unknown webhook event:", event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing signature webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}

async function handleDocumentViewed(data: any) {
  const { requestId, recipientEmail } = data

  try {
    await signatureService.updateRecipientStatus(requestId, recipientEmail, "viewed")
    console.log(`Document viewed by ${recipientEmail} for request ${requestId}`)
  } catch (error) {
    console.error("Error handling document viewed:", error)
  }
}

async function handleDocumentSigned(data: any) {
  const { requestId, recipientEmail } = data

  try {
    await signatureService.updateRecipientStatus(requestId, recipientEmail, "signed")
    console.log(`Document signed by ${recipientEmail} for request ${requestId}`)

    // Send notification to HR
    await sendNotificationToHR("document_signed", {
      requestId,
      recipientEmail,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error handling document signed:", error)
  }
}

async function handleDocumentCompleted(data: any) {
  const { requestId } = data

  try {
    const request = await signatureService.getSignatureRequest(requestId)
    if (request) {
      console.log(`All signatures completed for request ${requestId}`)

      // Send completion notification
      await sendNotificationToHR("document_completed", {
        requestId,
        documentName: request.documentName,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error handling document completed:", error)
  }
}

async function handleDocumentDeclined(data: any) {
  const { requestId, recipientEmail, reason } = data

  try {
    await signatureService.updateRecipientStatus(requestId, recipientEmail, "declined")
    console.log(`Document declined by ${recipientEmail} for request ${requestId}`)

    // Send notification to HR
    await sendNotificationToHR("document_declined", {
      requestId,
      recipientEmail,
      reason,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error handling document declined:", error)
  }
}

async function handleDocumentExpired(data: any) {
  const { requestId } = data

  try {
    const request = await signatureService.getSignatureRequest(requestId)
    if (request) {
      console.log(`Document expired for request ${requestId}`)

      // Send expiration notification
      await sendNotificationToHR("document_expired", {
        requestId,
        documentName: request.documentName,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error handling document expired:", error)
  }
}

async function sendNotificationToHR(eventType: string, data: any) {
  // In production, this would send email notifications or create system notifications
  console.log(`Sending HR notification for ${eventType}:`, data)

  // Example: Send email to HR team
  // await emailService.send({
  //   to: 'hr@serenityrehab.com',
  //   subject: `Signature Event: ${eventType}`,
  //   body: `Event details: ${JSON.stringify(data, null, 2)}`
  // })
}

// Verify webhook signature (example for DocuSign)
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // In production, implement proper signature verification
  // const crypto = require('crypto')
  // const expectedSignature = crypto
  //   .createHmac('sha256', secret)
  //   .update(payload)
  //   .digest('base64')
  // return signature === expectedSignature
  return true // Simplified for demo
}
