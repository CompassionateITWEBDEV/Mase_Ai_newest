import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// Simple decryption (matches encryption in configure route)
function decryptCredential(encrypted: string): string {
  try {
    return Buffer.from(encrypted, "base64").toString("utf-8")
  } catch {
    return encrypted
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Fetch Availity configuration from database
    const { data: config, error } = await supabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "availity")
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is ok
      console.error("Error fetching Availity configuration:", error)
      throw error
    }

    if (!config) {
      return NextResponse.json({
        success: true,
        configured: false,
        message: "Availity integration not configured",
      })
    }

    // Decrypt credentials (don't send password to client)
    const decryptedUsername = decryptCredential(config.username || "")

    return NextResponse.json({
      success: true,
      configured: true,
      configuration: {
        username: decryptedUsername,
        organizationId: config.agency_id,
        applicationId: config.api_key,
        environment: config.environment || "production",
        status: config.status,
        lastSyncTime: config.last_sync_time,
        syncSettings: {
          autoEligibilityCheck: config.auto_sync || false,
          syncFrequency: String(config.sync_interval_minutes || 15),
          realTimeUpdates: config.enable_webhooks || false,
          // Additional settings would be stored as metadata in a real implementation
          autoPriorAuth: true,
          batchProcessing: true,
          enableClaims: false,
          enableRemittance: false,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching Availity configuration:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch configuration",
      },
      { status: 500 },
    )
  }
}

