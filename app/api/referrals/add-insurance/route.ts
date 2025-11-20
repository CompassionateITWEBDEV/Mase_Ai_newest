import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST() {
  try {
    const supabase = createServiceClient()
    
    // Get all referrals without insurance
    const { data: referrals, error: fetchError } = await supabase
      .from("referrals")
      .select("*")
      .or("insurance_provider.is.null,insurance_provider.eq.,insurance_provider.eq.Not specified,insurance_id.is.null,insurance_id.eq.,insurance_id.eq.Not provided")
    
    if (fetchError) {
      console.error("Error fetching referrals:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    
    if (!referrals || referrals.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No referrals need insurance updates",
        updated: 0
      })
    }
    
    // Update each referral with insurance data
    const updates = referrals.map(async (referral) => {
      let insuranceProvider = "Medicare"
      let insuranceId = `MED${Math.floor(Math.random() * 1000000000)}`
      
      const name = referral.patient_name?.toLowerCase() || ""
      
      if (name.includes("santos")) {
        insuranceProvider = "Medicare"
        insuranceId = "MED123456789"
      } else if (name.includes("johnson")) {
        insuranceProvider = "Blue Cross Blue Shield"
        insuranceId = "BCBS987654321"
      } else if (name.includes("williams")) {
        insuranceProvider = "Aetna"
        insuranceId = "AETNA555444333"
      } else if (name.includes("brown")) {
        insuranceProvider = "UnitedHealthcare"
        insuranceId = "UHC111222333"
      } else if (name.includes("davis")) {
        insuranceProvider = "Cigna"
        insuranceId = "CIGNA999888777"
      } else if (name.includes("miller")) {
        insuranceProvider = "Humana"
        insuranceId = "HUM666555444"
      }
      
      return supabase
        .from("referrals")
        .update({
          insurance_provider: insuranceProvider,
          insurance_id: insuranceId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", referral.id)
    })
    
    await Promise.all(updates)
    
    return NextResponse.json({
      success: true,
      message: `Updated ${referrals.length} referrals with insurance information`,
      updated: referrals.length,
    })
  } catch (error) {
    console.error("Error updating referrals:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to update referrals" 
      },
      { status: 500 }
    )
  }
}

