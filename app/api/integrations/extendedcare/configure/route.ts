import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Simple encryption function (in production, use proper encryption)
function encryptCredential(credential: string): string {
  // Basic Base64 encoding (in production, use proper encryption like AES)
  return Buffer.from(credential).toString("base64")
}

export async function POST(request: NextRequest) {
  try {
    const { credentials, syncSettings, referralMetrics } = await request.json()

    // Validate required fields
    if (!credentials?.username || !credentials?.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required",
        },
        { status: 400 },
      )
    }

    console.log("Saving ExtendedCare configuration:", {
      username: credentials.username,
      environment: credentials.environment,
      syncSettings,
    })

    // Encrypt sensitive credentials
    const encryptedUsername = encryptCredential(credentials.username)
    const encryptedPassword = encryptCredential(credentials.password)
    const encryptedClientSecret = credentials.clientSecret ? encryptCredential(credentials.clientSecret) : null

    // Save configuration to database using service client (bypasses RLS)
    const supabase = createServerSupabaseClient()

    // Check if configuration already exists
    const { data: existingConfig } = await supabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "extendedcare")
      .single()

    const configData = {
      integration_name: "extendedcare",
      api_url: credentials.environment === "sandbox" 
        ? "https://api.extendedcare.com/sandbox/v2" 
        : "https://api.extendedcare.com/v2",
      username: encryptedUsername,
      password: encryptedPassword,
      api_key: encryptedClientSecret,
      agency_id: credentials.clientId || null,
      environment: credentials.environment || "sandbox",
      auto_sync: syncSettings?.autoEligibilityCheck || false,
      sync_interval_minutes: parseInt(syncSettings?.syncInterval || "15"),
      enable_webhooks: syncSettings?.realTimeUpdates || false,
      data_retention_days: 90,
      compression_enabled: false,
      encryption_enabled: true,
      status: "connected",
      error_message: null,
      last_sync_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let savedConfiguration
    if (existingConfig) {
      // Update existing configuration
      const { data, error } = await supabase
        .from("integrations_config")
        .update(configData)
        .eq("id", existingConfig.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating ExtendedCare configuration:", error)
        throw error
      }
      savedConfiguration = data
    } else {
      // Insert new configuration
      const { data, error } = await supabase
        .from("integrations_config")
        .insert(configData)
        .select()
        .single()

      if (error) {
        console.error("Error inserting ExtendedCare configuration:", error)
        throw error
      }
      savedConfiguration = data
    }

    console.log("ExtendedCare configuration saved successfully:", {
      id: savedConfiguration.id,
      status: savedConfiguration.status,
      environment: credentials.environment,
      username: credentials.username,
    })

    return NextResponse.json({
      success: true,
      message: "ExtendedCare integration configured successfully",
      configuration: {
        id: savedConfiguration.id,
        status: savedConfiguration.status,
        environment: credentials.environment,
      },
    })
  } catch (error) {
    console.error("Failed to save ExtendedCare configuration:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save configuration",
      },
      { status: 500 },
    )
  }
}
