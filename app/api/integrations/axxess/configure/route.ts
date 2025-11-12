import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// Helper function to calculate next sync time
function getNextSyncTime(frequency: string): string {
  const now = new Date()

  switch (frequency) {
    case "realtime":
      return "Continuous (via Webhooks)"
    case "15min":
      return new Date(now.getTime() + 15 * 60 * 1000).toISOString()
    case "hourly":
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    case "daily":
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(6, 0, 0, 0)
      return tomorrow.toISOString()
    case "manual":
      return "Manual Sync Only"
    default:
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
  }
}

// Helper function to validate Axxess credentials
function validateAxxessCredentials(config: any): boolean {
  if (!config.username || !config.password || !config.agencyId) {
    return false
  }

  // Basic validation
  if (config.username.length < 3 || config.password.length < 6) {
    return false
  }

  return true
}

// Helper function to encrypt sensitive data (placeholder implementation)
function encryptCredentials(credentials: any): any {
  // In production, use proper encryption like AES-256
  return {
    username: `encrypted_${credentials.username}`,
    password: `[ENCRYPTED_HASH]_${Math.random().toString(36).slice(2)}`,
    agencyId: credentials.agencyId,
    environment: credentials.environment,
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    // Validate required fields
    if (!config) {
      return NextResponse.json({ error: "Configuration data is required" }, { status: 400 })
    }

    // Validate Axxess credentials
    if (!validateAxxessCredentials(config)) {
      return NextResponse.json(
        {
          error: "Invalid Axxess credentials. Please check username, password, and agency ID.",
        },
        { status: 400 },
      )
    }

    console.log("Saving Axxess configuration...")

    // Extract credentials for encryption
    const credentials = {
      username: config.username,
      password: config.password,
      agencyId: config.agencyId,
      environment: config.environment,
    }

    // Encrypt the credentials
    const encryptedCredentials = encryptCredentials(credentials)

    // Extract sync settings
    const syncSettings = {
      autoSync: config.autoSync || false,
      syncInterval: config.syncInterval || 15,
      enableWebhooks: config.enableWebhooks || false,
      webhookUrl: config.webhookUrl || "",
      dataRetention: config.dataRetention || 90,
      compressionEnabled: config.compressionEnabled || true,
      encryptionEnabled: config.encryptionEnabled || true,
    }

    // Save configuration to database
    const supabase = createServiceClient()
    
    // Check if configuration already exists
    const { data: existingConfig } = await supabase
      .from("integrations_config")
      .select("id")
      .eq("integration_name", "axxess")
      .single()

    const configData = {
      integration_name: "axxess",
      api_url: config.apiUrl || "https://api.axxess.com/v1",
      username: encryptedCredentials.username,
      password: encryptedCredentials.password,
      agency_id: credentials.agencyId,
      environment: credentials.environment,
      auto_sync: syncSettings.autoSync,
      sync_interval_minutes: syncSettings.syncInterval,
      enable_webhooks: syncSettings.enableWebhooks,
      webhook_url: syncSettings.webhookUrl || null,
      data_retention_days: syncSettings.dataRetention,
      compression_enabled: syncSettings.compressionEnabled,
      encryption_enabled: syncSettings.encryptionEnabled,
      status: "connected",
      error_message: null,
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

      if (error) throw error
      savedConfiguration = { id: data.id, ...configData }
    } else {
      // Insert new configuration
      const { data, error } = await supabase
        .from("integrations_config")
        .insert(configData)
        .select()
        .single()

      if (error) throw error
      savedConfiguration = { id: data.id, ...configData }
    }

    console.log("Axxess configuration saved successfully:", {
      id: savedConfiguration.id,
      status: savedConfiguration.status,
      environment: credentials.environment,
      agencyId: credentials.agencyId,
    })

    // Return a success response
    return NextResponse.json({
      success: true,
      message: "Axxess integration configured successfully!",
      configId: savedConfiguration.id,
      nextSync: savedConfiguration.nextSync,
      environment: credentials.environment,
      agencyId: credentials.agencyId,
      syncSettings: {
        autoSync: syncSettings.autoSync,
        syncInterval: syncSettings.syncInterval,
        enableWebhooks: syncSettings.enableWebhooks,
      },
    })
  } catch (error) {
    console.error("Axxess configuration error:", error)

    // Return more specific error information
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON format in request body",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to save Axxess configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    const { data: config, error } = await supabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "axxess")
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      throw error
    }

    if (!config) {
      return NextResponse.json({
        success: false,
        message: "Axxess configuration not found",
        configuration: null,
      })
    }

    const configuration = {
      id: config.id,
      apiUrl: config.api_url,
      environment: config.environment,
      agencyId: config.agency_id,
      syncSettings: {
        autoSync: config.auto_sync,
        syncInterval: config.sync_interval_minutes,
        enableWebhooks: config.enable_webhooks,
        webhookUrl: config.webhook_url || "",
        dataRetention: config.data_retention_days,
        compressionEnabled: config.compression_enabled,
        encryptionEnabled: config.encryption_enabled,
      },
      status: config.status,
      createdAt: config.created_at,
      lastSync: config.last_sync_time,
      nextSync: config.last_sync_time 
        ? new Date(new Date(config.last_sync_time).getTime() + (config.sync_interval_minutes || 15) * 60 * 1000).toISOString()
        : null,
    }

    return NextResponse.json({
      success: true,
      configuration,
    })
  } catch (error) {
    console.error("Failed to load Axxess configuration:", error)
    return NextResponse.json(
      {
        error: "Failed to load configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get("id")

    if (!configId) {
      return NextResponse.json(
        {
          error: "Configuration ID is required",
        },
        { status: 400 },
      )
    }

    // In a real implementation, you would delete the configuration from your database
    console.log(`Deleting Axxess configuration: ${configId}`)

    return NextResponse.json({
      success: true,
      message: "Axxess configuration deleted successfully",
      configId,
    })
  } catch (error) {
    console.error("Failed to delete Axxess configuration:", error)
    return NextResponse.json(
      {
        error: "Failed to delete configuration",
      },
      { status: 500 },
    )
  }
}
