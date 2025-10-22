import { type NextRequest, NextResponse } from "next/server"
import type { ReferralConfiguration } from "@/types/referral-config"

// In a real implementation, this would save to a database
// For now, we'll simulate saving to a mock storage
const mockStorage = new Map<string, ReferralConfiguration>()

export async function POST(request: NextRequest) {
  try {
    const config: ReferralConfiguration = await request.json()

    // Validate configuration
    if (!config.id || !config.name) {
      return NextResponse.json({ error: "Configuration ID and name are required" }, { status: 400 })
    }

    // Validate scoring weights sum to 1.0 (with some tolerance)
    const totalWeight =
      config.scoring.geographicWeight +
      config.scoring.insuranceWeight +
      config.scoring.clinicalWeight +
      config.scoring.capacityWeight +
      config.scoring.qualityWeight

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      return NextResponse.json({ error: "Scoring weights must sum to 100%" }, { status: 400 })
    }

    // Update timestamp
    config.updatedAt = new Date().toISOString()

    // Save configuration
    mockStorage.set(config.id, config)

    console.log(`Configuration saved: ${config.name} (${config.id})`)

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
      config,
    })
  } catch (error) {
    console.error("Configuration save error:", error)
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get("id")

    if (configId) {
      const config = mockStorage.get(configId)
      if (!config) {
        return NextResponse.json({ error: "Configuration not found" }, { status: 404 })
      }
      return NextResponse.json({ config })
    }

    // Return all configurations
    const configs = Array.from(mockStorage.values())
    return NextResponse.json({ configs })
  } catch (error) {
    console.error("Configuration load error:", error)
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
  }
}
