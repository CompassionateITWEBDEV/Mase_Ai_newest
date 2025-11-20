import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { extendedCareApi } from "@/lib/extendedcare-api"
import { availityApi } from "@/lib/availity-api"

// Decryption function
function decryptCredential(encrypted: string): string {
  try {
    return Buffer.from(encrypted, "base64").toString("utf-8")
  } catch {
    return encrypted
  }
}

// POST /api/referrals/[id]/check-eligibility - Check eligibility for a referral using available integrations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get the referral
    const { data: referral, error: fetchError } = await supabase
      .from("referrals")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    // Check if Availity is configured and use it preferentially
    // Use service client for integrations_config to bypass RLS
    const serviceSupabase = createServiceClient()
    const { data: availityConfig } = await serviceSupabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "availity")
      .eq("status", "connected")
      .single()

    let eligibilityResult: any

    if (availityConfig) {
      // Use Availity for eligibility check
      try {
        console.log("Using Availity for eligibility check")
        
        // Decrypt credentials and configure API
        const decryptedUsername = decryptCredential(availityConfig.username)
        const decryptedPassword = decryptCredential(availityConfig.password)

        availityApi.setCredentials({
          username: decryptedUsername,
          password: decryptedPassword,
          organizationId: availityConfig.agency_id,
          applicationId: availityConfig.api_key || "",
          environment: availityConfig.environment || "production",
        })

        // Parse patient name
        const nameParts = referral.patient_name.split(" ")
        const firstName = nameParts[0] || ""
        const lastName = nameParts.slice(1).join(" ") || nameParts[0]

        // Make eligibility check through Availity
        const availityResponse = await availityApi.checkEligibility({
          patientFirstName: firstName,
          patientLastName: lastName,
          patientDOB: referral.patient_dob || "1970-01-01", // Would need to be stored in referral
          memberId: referral.insurance_id,
          payerId: referral.insurance_provider,
          serviceTypeCode: "33", // Home health
          serviceDate: new Date().toISOString().split("T")[0],
        })

        // Convert Availity response to our format
        eligibilityResult = {
          success: availityResponse.success,
          patientId: id,
          isEligible: availityResponse.isEligible,
          source: "availity",
          planDetails: availityResponse.planDetails ? {
            planName: availityResponse.planDetails.planName,
            groupNumber: availityResponse.planDetails.groupNumber || "",
            copay: availityResponse.copay ? {
              inNetwork: availityResponse.copay.amount,
              outOfNetwork: availityResponse.copay.amount,
            } : undefined,
            deductible: availityResponse.deductible ? {
              inNetwork: availityResponse.deductible.amount,
              outOfNetwork: availityResponse.deductible.amount,
              remaining: availityResponse.deductible.remaining,
            } : undefined,
            outOfPocketMax: availityResponse.outOfPocketMax ? {
              inNetwork: availityResponse.outOfPocketMax.amount,
              outOfNetwork: availityResponse.outOfPocketMax.amount,
              remaining: availityResponse.outOfPocketMax.remaining,
            } : undefined,
          } : undefined,
          priorAuthRequired: availityResponse.priorAuthRequired,
          message: availityResponse.message,
        }

        // Update last sync time
        await serviceSupabase
          .from("integrations_config")
          .update({ last_sync_time: new Date().toISOString() })
          .eq("id", availityConfig.id)
      } catch (error) {
        console.error("Availity eligibility check failed, falling back to ExtendedCare:", error)
        // Fall back to ExtendedCare
        eligibilityResult = await extendedCareApi.checkEligibility(id, referral.insurance_id)
        eligibilityResult.source = "extendedcare"
      }
    } else {
      // Use ExtendedCare API as fallback
      console.log("Using ExtendedCare for eligibility check (Availity not configured)")
      eligibilityResult = await extendedCareApi.checkEligibility(id, referral.insurance_id)
      eligibilityResult.source = "extendedcare"
    }

    // Update referral with eligibility status
    const eligibilityData = {
      ...eligibilityResult,
      timestamp: new Date().toISOString(),
      status: "completed",
    }

    const { data: updatedReferral, error: updateError } = await supabase
      .from("referrals")
      .update({
        eligibility_status: eligibilityData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating referral eligibility:", updateError)
      return NextResponse.json({ error: "Failed to update eligibility status" }, { status: 500 })
    }

    console.log("✅ Successfully saved eligibility to database:", {
      id: updatedReferral.id,
      patient: updatedReferral.patient_name,
      eligibility: eligibilityData
    })

    return NextResponse.json({
      success: true,
      eligibility: eligibilityData,
      referral: updatedReferral,
    })
  } catch (error) {
    console.error("Error checking eligibility:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check eligibility",
      },
      { status: 500 }
    )
  }
}

