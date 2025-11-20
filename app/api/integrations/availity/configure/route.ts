import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { availityApi } from "@/lib/availity-api"

// Simple encryption (in production, use proper encryption like AWS KMS or Supabase Vault)
function encryptCredential(credential: string): string {
  // In production, implement proper encryption
  // For now, we'll just encode it (NOT SECURE, just for demo)
  return Buffer.from(credential).toString("base64")
}

export async function POST(request: NextRequest) {
  try {
    const { credentials, syncSettings } = await request.json()

    // Validate required fields
    if (!credentials?.username || !credentials?.password || !credentials?.organizationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Username, password, and Organization ID are required",
        },
        { status: 400 },
      )
    }

    // Set credentials and test connection first
    availityApi.setCredentials({
      username: credentials.username,
      password: credentials.password,
      organizationId: credentials.organizationId,
      applicationId: credentials.applicationId || "",
      environment: credentials.environment || "production",
    })

    const testResult = await availityApi.testConnection()
    
    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to verify Availity credentials. Please check and try again.",
        },
        { status: 401 },
      )
    }

    // Encrypt sensitive credentials
    const encryptedUsername = encryptCredential(credentials.username)
    const encryptedPassword = encryptCredential(credentials.password)

    // Save configuration to database using service client (bypasses RLS)
    const supabase = createServiceClient()
    
    // Check if configuration already exists
    const { data: existingConfig } = await supabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "availity")
      .single()

    const configData = {
      integration_name: "availity",
      api_url: testResult.environment === "sandbox" 
        ? "https://api.availity.com/sandbox/v1" 
        : "https://api.availity.com/availity/v1",
      username: encryptedUsername,
      password: encryptedPassword,
      api_key: credentials.applicationId || null,
      agency_id: credentials.organizationId,
      environment: credentials.environment || "production",
      auto_sync: syncSettings?.autoEligibilityCheck || false,
      sync_interval_minutes: parseInt(syncSettings?.syncFrequency || "15"),
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
        console.error("Error updating Availity configuration:", error)
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
        console.error("Error inserting Availity configuration:", error)
        throw error
      }
      savedConfiguration = data
    }

    console.log("Availity configuration saved successfully:", {
      id: savedConfiguration.id,
      status: savedConfiguration.status,
      environment: credentials.environment,
      organizationId: credentials.organizationId,
    })

    // Store additional sync settings as metadata
    const settingsMetadata = {
      autoPriorAuth: syncSettings?.autoPriorAuth || false,
      realTimeUpdates: syncSettings?.realTimeUpdates || false,
      batchProcessing: syncSettings?.batchProcessing || false,
      enableClaims: syncSettings?.enableClaims || false,
      enableRemittance: syncSettings?.enableRemittance || false,
    }

    return NextResponse.json({
      success: true,
      message: "Availity integration configured successfully",
      configuration: {
        id: savedConfiguration.id,
        status: savedConfiguration.status,
        settings: settingsMetadata,
      },
    })
  } catch (error) {
    console.error("Availity configuration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to save configuration",
      },
      { status: 500 },
    )
  }
}
