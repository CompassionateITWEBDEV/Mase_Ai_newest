import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Simple decryption function
function decryptCredential(encryptedCredential: string): string {
  return Buffer.from(encryptedCredential, "base64").toString("utf-8")
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Fetch ExtendedCare configuration
    const { data: config, error } = await supabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "extendedcare")
      .single()

    if (error || !config) {
      return NextResponse.json(
        {
          success: false,
          message: "ExtendedCare integration not configured",
        },
        { status: 400 },
      )
    }

    // Decrypt credentials
    const username = config.username ? decryptCredential(config.username) : ""
    const password = config.password ? decryptCredential(config.password) : ""
    const environment = config.environment || "production"

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "ExtendedCare credentials not properly configured",
        },
        { status: 400 },
      )
    }

    // Authenticate with ExtendedCare API
    const apiUrl =
      environment === "sandbox"
        ? "https://api.extendedcare.com/sandbox/v2"
        : "https://api.extendedcare.com/v2"

    try {
      // Authenticate with the real ExtendedCare API
      console.log(`🔐 Attempting authentication to ${apiUrl}/auth/token`)
      
      const authResponse = await fetch(`${apiUrl}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          grant_type: "password",
        }),
      })

      if (authResponse.ok) {
        const authData = await authResponse.json()
        console.log("✅ Successfully authenticated with ExtendedCare API")
        
        return NextResponse.json({
          success: true,
          accessToken: authData.access_token,
          expiresIn: authData.expires_in || 3600,
        })
      } else {
        // Authentication failed - return real error
        const errorText = await authResponse.text()
        console.error(`❌ ExtendedCare authentication failed: ${authResponse.status} ${authResponse.statusText}`)
        console.error("Error details:", errorText)

        return NextResponse.json(
          {
            success: false,
            message: `Authentication failed: ${authResponse.status} ${authResponse.statusText}`,
            error: errorText,
            apiUrl: apiUrl,
          },
          { status: authResponse.status },
        )
      }
    } catch (error: any) {
      // Network error or API unavailable
      console.error("❌ ExtendedCare API network error:", error.message)

      return NextResponse.json(
        {
          success: false,
          message: "Cannot connect to ExtendedCare API",
          error: error.message,
          apiUrl: apiUrl,
          hint: "Please verify the API URL is correct and accessible",
        },
        { status: 503 },
      )
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Authentication failed",
      },
      { status: 500 },
    )
  }
}

