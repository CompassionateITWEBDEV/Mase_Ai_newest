import { type NextRequest, NextResponse } from "next/server"

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

    // Simulate saving the configuration to a database
    const savedConfiguration = {
      id: `axxess_config_${Date.now()}`,
      credentials: encryptedCredentials,
      syncSettings,
      apiUrl: config.apiUrl || "https://api.axxess.com/v1",
      status: "active",
      createdAt: new Date().toISOString(),
      lastSync: null,
      nextSync: getNextSyncTime(syncSettings.autoSync ? `${syncSettings.syncInterval}min` : "manual"),
      lastUpdated: new Date().toISOString(),
    }

    console.log("Axxess configuration saved successfully:", {
      id: savedConfiguration.id,
      status: savedConfiguration.status,
      nextSync: savedConfiguration.nextSync,
      environment: credentials.environment,
      agencyId: credentials.agencyId,
    })

    // In a real implementation, you would:
    // 1. Store the encrypted configuration in your database (e.g., Supabase, Neon)
    // 2. Set up scheduled jobs based on syncSettings.syncInterval
    // 3. Register webhooks if enabled
    // 4. Validate the connection to Axxess API

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
    // In a real implementation, you would fetch the configuration from your database
    // For now, return a mock configuration
    const mockConfiguration = {
      id: "axxess_config_mock",
      apiUrl: "https://api.axxess.com/v1",
      environment: "sandbox",
      agencyId: "DEMO_AGENCY",
      syncSettings: {
        autoSync: true,
        syncInterval: 15,
        enableWebhooks: false,
        webhookUrl: "",
        dataRetention: 90,
        compressionEnabled: true,
        encryptionEnabled: true,
      },
      status: "active",
      createdAt: "2024-01-16T10:00:00Z",
      lastSync: "2024-01-16T14:30:00Z",
      nextSync: "2024-01-16T14:45:00Z",
    }

    return NextResponse.json({
      success: true,
      configuration: mockConfiguration,
    })
  } catch (error) {
    console.error("Failed to load Axxess configuration:", error)
    return NextResponse.json(
      {
        error: "Failed to load configuration",
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
