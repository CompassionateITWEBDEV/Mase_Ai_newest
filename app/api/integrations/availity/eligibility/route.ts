import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { availityApi } from "@/lib/availity-api"

// Decryption function to match the one in config route
function decryptCredential(encrypted: string): string {
  try {
    return Buffer.from(encrypted, "base64").toString("utf-8")
  } catch {
    return encrypted
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientFirstName,
      patientLastName,
      patientDOB,
      memberId,
      payerId,
      serviceTypeCode,
      serviceDate,
    } = body

    // Validate required fields
    if (!patientFirstName || !patientLastName || !patientDOB || !memberId || !payerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required patient information",
        },
        { status: 400 },
      )
    }

    // Get Availity configuration from database
    const supabase = createServiceClient()
    const { data: config, error: configError } = await supabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "availity")
      .eq("status", "connected")
      .single()

    if (configError || !config) {
      return NextResponse.json(
        {
          success: false,
          message: "Availity integration not configured or not connected",
        },
        { status: 503 },
      )
    }

    // Decrypt credentials and set up API client
    const decryptedUsername = decryptCredential(config.username)
    const decryptedPassword = decryptCredential(config.password)

    availityApi.setCredentials({
      username: decryptedUsername,
      password: decryptedPassword,
      organizationId: config.agency_id,
      applicationId: config.api_key || "",
      environment: config.environment || "production",
    })

    // Check eligibility through Availity
    const eligibilityResult = await availityApi.checkEligibility({
      patientFirstName,
      patientLastName,
      patientDOB,
      memberId,
      payerId,
      serviceTypeCode: serviceTypeCode || "33", // Default to home health
      serviceDate: serviceDate || new Date().toISOString().split("T")[0],
    })

    // Update last sync time
    await supabase
      .from("integrations_config")
      .update({ last_sync_time: new Date().toISOString() })
      .eq("id", config.id)

    return NextResponse.json({
      success: eligibilityResult.success,
      eligibility: eligibilityResult,
    })
  } catch (error) {
    console.error("Availity eligibility check error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Eligibility check failed",
      },
      { status: 500 },
    )
  }
}

