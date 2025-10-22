import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("Mailgun webhook received")

    const emailData = await request.json()

    // Verify Mailgun webhook signature if configured
    if (process.env.MAILGUN_WEBHOOK_SIGNING_KEY) {
      const signature = emailData.signature
      if (signature) {
        const expectedSignature = crypto
          .createHmac("sha256", process.env.MAILGUN_WEBHOOK_SIGNING_KEY)
          .update(signature.timestamp + signature.token)
          .digest("hex")

        if (signature.signature !== expectedSignature) {
          console.error("Invalid Mailgun webhook signature")
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }
      }
    }

    // Transform Mailgun format to our standard format
    const standardEmailData = {
      from: emailData.sender || emailData.from,
      to: emailData.recipient || emailData.to,
      subject: emailData.subject,
      text: emailData["body-plain"] || emailData.text,
      html: emailData["body-html"] || emailData.html,
      timestamp: new Date(emailData.timestamp * 1000).toISOString(),
      messageId: emailData["Message-Id"] || emailData.messageId,
      provider: "mailgun",
    }

    // Forward to the generic email webhook processor
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(standardEmailData),
    })

    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error("Mailgun webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
