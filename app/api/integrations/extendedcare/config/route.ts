import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Simple decryption function (matches encryption in configure route)
function decryptCredential(encryptedCredential: string): string {
  // Basic Base64 decoding (in production, use proper decryption)
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

    if (error) {
      if (error.code === "PGRST116") {
        // No configuration found
        return NextResponse.json({
          success: false,
          message: "ExtendedCare integration not configured",
          configured: false,
        })
      }
      throw error
    }

    // Decrypt credentials for use (don't send back to frontend)
    const decryptedConfig = {
      id: config.id,
      username: config.username ? decryptCredential(config.username) : "",
      password: config.password ? decryptCredential(config.password) : "",
      clientId: config.agency_id || "",
      clientSecret: config.api_key ? decryptCredential(config.api_key) : "",
      environment: config.environment || "sandbox",
      autoSync: config.auto_sync || false,
      syncIntervalMinutes: config.sync_interval_minutes || 15,
      enableWebhooks: config.enable_webhooks || false,
      status: config.status || "disconnected",
      lastSyncTime: config.last_sync_time,
    }

    // For frontend, return sanitized config (no passwords)
    const sanitizedConfig = {
      id: config.id,
      username: decryptedConfig.username,
      clientId: decryptedConfig.clientId,
      environment: decryptedConfig.environment,
      autoSync: decryptedConfig.autoSync,
      syncIntervalMinutes: decryptedConfig.syncIntervalMinutes,
      enableWebhooks: decryptedConfig.enableWebhooks,
      status: decryptedConfig.status,
      lastSyncTime: decryptedConfig.lastSyncTime,
      configured: true,
    }

    return NextResponse.json({
      success: true,
      config: sanitizedConfig,
      configured: true,
    })
  } catch (error) {
    console.error("Error fetching ExtendedCare configuration:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch configuration",
        configured: false,
      },
      { status: 500 },
    )
  }
}
