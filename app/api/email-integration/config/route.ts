import { type NextRequest, NextResponse } from "next/server"

interface EmailConfiguration {
  provider: string
  webhookUrl: string
  apiKey: string
  username?: string
  password?: string
  forwardingEmail: string
  autoProcessing: boolean
  requireSignature: boolean
  allowedSenders: string[]
  subjectFilters: string[]
  spamProtection: boolean
  encryptionEnabled: boolean
}

// In a real application, this would be stored in a database
let currentConfig: EmailConfiguration = {
  provider: "",
  webhookUrl: "",
  apiKey: "",
  forwardingEmail: "referrals@yourhealthcareagency.com",
  autoProcessing: true,
  requireSignature: false,
  allowedSenders: [],
  subjectFilters: ["referral", "patient", "admission"],
  spamProtection: true,
  encryptionEnabled: true,
}

export async function GET() {
  try {
    return NextResponse.json(currentConfig)
  } catch (error) {
    console.error("Failed to load email configuration:", error)
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: EmailConfiguration = await request.json()

    // Validate required fields
    if (!config.provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 })
    }

    if (!config.apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    if (!config.forwardingEmail) {
      return NextResponse.json({ error: "Forwarding email is required" }, { status: 400 })
    }

    // Generate webhook URL based on provider
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
    config.webhookUrl = `${baseUrl}/api/email/${config.provider.toLowerCase()}/webhook`

    // Save configuration (in a real app, this would go to a database)
    currentConfig = config

    console.log(`Email configuration saved for provider: ${config.provider}`)

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
      webhookUrl: config.webhookUrl,
    })
  } catch (error) {
    console.error("Failed to save email configuration:", error)
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
  }
}
