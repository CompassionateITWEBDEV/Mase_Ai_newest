import { type NextRequest, NextResponse } from "next/server"

interface TestEmailRequest {
  provider: string
  testEmail: string
}

export async function POST(request: NextRequest) {
  try {
    const { provider, testEmail }: TestEmailRequest = await request.json()

    console.log(`Testing email integration for provider: ${provider}`)

    const startTime = Date.now()

    // Create a comprehensive test email
    const testEmailData = createTestEmail(provider, testEmail)

    // Process the test email through the webhook
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testEmailData),
    })

    const webhookResult = await webhookResponse.json()
    const processingTime = Date.now() - startTime

    if (webhookResponse.ok) {
      return NextResponse.json({
        success: true,
        message: `Test email processed successfully via ${provider}`,
        processingTime,
        referralData: webhookResult.extractedData,
        webhookResponse: {
          referralId: webhookResult.referralId,
          decision: webhookResult.decision,
          status: "processed",
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Webhook processing failed: ${webhookResult.error}`,
        processingTime,
        error: webhookResult.error,
      })
    }
  } catch (error) {
    console.error("Email integration test failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Test failed due to system error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function createTestEmail(provider: string, testEmail: string) {
  const testScenarios = [
    {
      subject: "Test Referral - Integration Verification",
      body: `Dear Home Health Team,

This is a test referral to verify email integration with ${provider}.

Patient: Test Patient
DOB: 01/01/1980
Diagnosis: Integration testing
Insurance Provider: Test Insurance
Insurance ID: TEST123456
Address: 123 Test Street, Test City, TC 12345
Phone: (555) 123-4567

Services Requested:
- Skilled Nursing
- Physical Therapy

Urgency: Routine
Estimated Episode Length: 30 days
Referring Physician: Dr. Test

This is an automated test email.

Best regards,
Test Hospital`,
    },
  ]

  const scenario = testScenarios[0]

  return {
    from: testEmail,
    to: "referrals@yourhealthcareagency.com",
    subject: scenario.subject,
    text: scenario.body,
    html: `<pre>${scenario.body}</pre>`,
    timestamp: new Date().toISOString(),
    messageId: `test-${Date.now()}@${provider}.com`,
    provider: provider,
  }
}
