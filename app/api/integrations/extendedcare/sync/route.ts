import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Simple decryption function
function decryptCredential(encryptedCredential: string): string {
  return Buffer.from(encryptedCredential, "base64").toString("utf-8")
}

interface ExtendedCareReferralRequest {
  patientName: string
  patientId: string
  diagnosis: string
  diagnosisCode: string
  insuranceProvider: string
  insuranceId: string
  requestedServices: string[]
  urgencyLevel: "routine" | "urgent" | "stat"
  referringProvider: {
    name: string
    npi: string
    facility: string
  }
  estimatedEpisodeLength: number
  geographicLocation: {
    address: string
    city: string
    state: string
    zipCode: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  specialRequirements?: string[]
  preferredStartDate?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    console.log("🔄 Starting ExtendedCare sync...")

    // Fetch ExtendedCare configuration
    const { data: config, error: configError } = await supabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "extendedcare")
      .single()

    if (configError || !config) {
      return NextResponse.json({
        success: false,
        message: "ExtendedCare integration not configured",
        synced: 0,
      })
    }

    // Check if auto-sync is enabled
    if (!config.auto_sync) {
      return NextResponse.json({
        success: false,
        message: "Auto-sync is disabled in configuration",
        synced: 0,
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
        synced: 0,
      })
    }

    console.log(`🔐 Authenticating with ExtendedCare as ${username} (${environment})`)

    // Construct API URL based on environment
    const apiUrl =
      environment === "sandbox"
        ? "https://api.extendedcare.com/sandbox/v2"
        : "https://api.extendedcare.com/v2"

    let referrals: ExtendedCareReferralRequest[] = []

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
        console.error("Error details:", errorText)

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
          synced: 0,
          total: 0,
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
          synced: 0,
          total: 0,
        })
      }

      const referralsData = await referralsResponse.json()
      referrals = referralsData.referrals || referralsData || []
      console.log(`✅ Retrieved ${referrals.length} referrals from ExtendedCare`)
    } catch (error: any) {
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
        synced: 0,
        total: 0,
      })
    }

    // Convert and save referrals to database
    let savedCount = 0

    for (const ecReferral of referrals) {
      try {
        // Check if referral already exists
        const { data: existing } = await supabase
          .from("referrals")
          .select("id")
          .eq("patient_id", ecReferral.patientId)
          .eq("referral_source", "ExtendedCare Network")
          .single()

        if (existing) {
          console.log(`⏭️ Skipping duplicate referral for ${ecReferral.patientName}`)
          continue
        }

        // Convert to our format
        const referralData = {
          patient_name: ecReferral.patientName,
          patient_id: ecReferral.patientId,
          referral_date: new Date().toISOString().split("T")[0],
          referral_source: "ExtendedCare Network",
          diagnosis: ecReferral.diagnosis,
          insurance_provider: ecReferral.insuranceProvider,
          insurance_id: ecReferral.insuranceId,
          status: "New",
          ai_recommendation: ecReferral.urgencyLevel === "stat" ? "Review" : "Approve",
          ai_reason:
            ecReferral.urgencyLevel === "stat"
              ? "STAT referral requires immediate review"
              : "Standard ExtendedCare referral with good coverage",
          extended_care_data: {
            networkId: `EC-${Date.now()}`,
            referralType: "network",
            reimbursementRate: 0.92,
            contractedServices: ecReferral.requestedServices,
            priorityLevel: ecReferral.urgencyLevel === "routine" ? "standard" : ecReferral.urgencyLevel,
          },
        }

        // Insert referral
        const { error: insertError } = await supabase.from("referrals").insert(referralData)

        if (!insertError) {
          savedCount++
          console.log(`✅ Saved referral for ${ecReferral.patientName}`)
        } else {
          console.error(`❌ Failed to save referral for ${ecReferral.patientName}:`, insertError)
        }
      } catch (error) {
        console.error(`❌ Error processing referral for ${ecReferral.patientName}:`, error)
      }
    }

    // Update last sync time
    await supabase
      .from("integrations_config")
      .update({
        last_sync_time: new Date().toISOString(),
        status: "connected",
        error_message: null,
      })
      .eq("id", config.id)

    console.log(`🎉 Sync complete: ${savedCount} referrals saved out of ${referrals.length} retrieved`)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${savedCount} referrals from ExtendedCare`,
      synced: savedCount,
      total: referrals.length,
      skipped: referrals.length - savedCount,
    })
  } catch (error) {
    console.error("❌ Sync error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Sync failed",
        synced: 0,
      },
      { status: 500 },
    )
  }
}
