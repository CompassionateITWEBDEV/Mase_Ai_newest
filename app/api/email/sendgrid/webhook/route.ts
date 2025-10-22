import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("SendGrid webhook received")

    // Verify SendGrid webhook signature
    const signature = request.headers.get("X-Twilio-Email-Event-Webhook-Signature")
    const timestamp = request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp")

    if (process.env.SENDGRID_WEBHOOK_SECRET && signature && timestamp) {
      const payload = await request.text()
      const expectedSignature = crypto
        .createHmac("sha256", process.env.SENDGRID_WEBHOOK_SECRET)
        .update(timestamp + payload)
        .digest("base64")

      if (signature !== expectedSignature) {
        console.error("Invalid SendGrid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }

      // Re-parse the payload since we consumed it for verification
      const emailData = JSON.parse(payload)
      return await processEmailWebhook(emailData, "sendgrid")
    } else {
      // For testing without signature verification
      const emailData = await request.json()
      return await processEmailWebhook(emailData, "sendgrid")
    }
  } catch (error) {
    console.error("SendGrid webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function processEmailWebhook(emailData: any, provider: string) {
  // Forward to the generic email webhook processor
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...emailData,
      provider,
    }),
  })

  const result = await response.json()
  return NextResponse.json(result, { status: response.status })
}
