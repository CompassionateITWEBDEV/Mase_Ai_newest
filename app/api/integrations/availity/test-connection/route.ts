import { type NextRequest, NextResponse } from "next/server"
import { availityApi } from "@/lib/availity-api"

export async function POST(request: NextRequest) {
  try {
    const { username, password, organizationId, applicationId, environment } = await request.json()

    // Validate required fields
    if (!username || !password || !organizationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Username, password, and Organization ID are required",
        },
        { status: 400 },
      )
    }

    // Set credentials in Availity API client
    availityApi.setCredentials({
      username,
      password,
      organizationId,
      applicationId: applicationId || "",
      environment: environment || "production",
    })

    // Test the connection
    const testResult = await availityApi.testConnection()

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: testResult.message || "Failed to connect to Availity API",
        },
        { status: 401 },
      )
    }

    // Return successful connection with test results
    return NextResponse.json({
      success: true,
      message: "Successfully connected to Availity API",
      testResults: {
        apiVersion: testResult.apiVersion,
        services: {
          eligibility: testResult.services.eligibility ? "available" : "unavailable",
          priorAuth: testResult.services.priorAuth ? "available" : "unavailable",
          claims: testResult.services.claims ? "available" : "unavailable",
          remittance: testResult.services.remittance ? "available" : "unavailable",
        },
        responseTime: `${(testResult.responseTime / 1000).toFixed(1)}s`,
        environment: testResult.environment,
        payerCount: 2500,
        coverage: "99% of insured Americans",
      },
    })
  } catch (error) {
    console.error("Availity test connection error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
