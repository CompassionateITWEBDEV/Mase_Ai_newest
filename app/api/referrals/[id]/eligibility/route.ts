import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extendedCareApi } from "@/lib/extendedcare-api"

// POST /api/referrals/[id]/eligibility - Check eligibility for a referral
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    
    // Get the referral
    const { data: referral, error: fetchError } = await supabase
      .from("referrals")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    // Check eligibility through ExtendedCare API
    const eligibilityResult = await extendedCareApi.checkEligibility(id, referral.insurance_id)

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

    return NextResponse.json({ 
      referral: updatedReferral,
      eligibility: eligibilityResult 
    })
  } catch (error) {
    console.error("Error in eligibility check:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


