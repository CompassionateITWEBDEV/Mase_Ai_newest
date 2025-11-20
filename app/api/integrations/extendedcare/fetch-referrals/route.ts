import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Simple decryption function
function decryptCredential(encryptedCredential: string): string {
  return Buffer.from(encryptedCredential, "base64").toString("utf-8")
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Fetch ExtendedCare configuration
    const { data: config, error } = await supabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "extendedcare")
      .single()

    if (error || !config) {
      return NextResponse.json({
        success: false,
        message: "ExtendedCare integration not configured",
        referrals: [],
      })
    }

    // Check if auto-sync is enabled
    if (!config.auto_sync) {
      return NextResponse.json({
        success: true,
        message: "Auto-sync is disabled",
        referrals: [],
      })
    }

    // Decrypt credentials
    const username = config.username ? decryptCredential(config.username) : ""
    const password = config.password ? decryptCredential(config.password) : ""
    const environment = config.environment || "production"

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: "ExtendedCare credentials not properly configured",
        referrals: [],
      })
    }

    console.log(`🔐 Authenticating with ExtendedCare as ${username} (${environment})`)

    // Construct API URL based on environment
    const apiUrl =
      environment === "sandbox"
        ? "https://api.extendedcare.com/sandbox/v2"
        : "https://api.extendedcare.com/v2"

    try {
      // First, authenticate with ExtendedCare API
      console.log(`🔐 Authenticating with ExtendedCare at ${apiUrl}`)
      
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

      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        console.error(`❌ Authentication failed: ${authResponse.status} ${authResponse.statusText}`)
        
        // Update status as disconnected
        await supabase
          .from("integrations_config")
          .update({
            status: "disconnected",
            error_message: `Authentication failed: ${authResponse.status}`,
          })
          .eq("id", config.id)

        return NextResponse.json({
          success: false,
          message: `Authentication failed: ${authResponse.status} ${authResponse.statusText}`,
          error: errorText,
          referrals: [],
        })
      }

      const authData = await authResponse.json()
      const accessToken = authData.access_token
      console.log("✅ Successfully authenticated with ExtendedCare API")

      // Fetch pending referrals
      console.log(`📥 Fetching pending referrals from ${apiUrl}/referrals/pending`)
      
      const referralsResponse = await fetch(`${apiUrl}/referrals/pending`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!referralsResponse.ok) {
        const errorText = await referralsResponse.text()
        console.error(`❌ Failed to fetch referrals: ${referralsResponse.status} ${referralsResponse.statusText}`)

        // Update status
        await supabase
          .from("integrations_config")
          .update({
            last_sync_time: new Date().toISOString(),
            status: "connected",
            error_message: `Failed to fetch referrals: ${referralsResponse.status}`,
          })
          .eq("id", config.id)

        return NextResponse.json({
          success: false,
          message: `Failed to fetch referrals: ${referralsResponse.status} ${referralsResponse.statusText}`,
          error: errorText,
          referrals: [],
        })
      }

      const referralsData = await referralsResponse.json()
      const referrals = referralsData.referrals || referralsData || []
      
      console.log(`✅ Successfully retrieved ${referrals.length} referrals from ExtendedCare`)

      // Update last sync time
      await supabase
        .from("integrations_config")
        .update({
          last_sync_time: new Date().toISOString(),
          status: "connected",
          error_message: null,
        })
        .eq("id", config.id)

      return NextResponse.json({
        success: true,
        referrals: referrals,
        count: referrals.length,
      })
    } catch (error: any) {
      // Network error
      console.error("❌ ExtendedCare API network error:", error.message)

      // Update status as disconnected
      await supabase
        .from("integrations_config")
        .update({
          last_sync_time: new Date().toISOString(),
          status: "disconnected",
          error_message: `Network error: ${error.message}`,
        })
        .eq("id", config.id)

      return NextResponse.json({
        success: false,
        message: "Cannot connect to ExtendedCare API",
        error: error.message,
        apiUrl: apiUrl,
        hint: "Please verify the API URL is correct and network is accessible",
        referrals: [],
      })
    }
  } catch (error) {
    console.error("Error fetching ExtendedCare referrals:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch referrals",
        referrals: [],
      },
      { status: 500 },
    )
  }
}

