import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/referrals/[id] - Get a specific referral
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching referral:", error)
      return NextResponse.json({ error: "Failed to fetch referral" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    return NextResponse.json({ referral: data })
  } catch (error) {
    console.error("Error in referral GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/referrals/[id] - Update a referral
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    // Map frontend fields to database fields
    const updateData: any = {}
    
    if (body.status !== undefined) updateData.status = body.status
    if (body.socDueDate !== undefined) updateData.soc_due_date = body.socDueDate
    if (body.aiRecommendation !== undefined) updateData.ai_recommendation = body.aiRecommendation
    if (body.aiReason !== undefined) updateData.ai_reason = body.aiReason
    if (body.eligibilityStatus !== undefined) updateData.eligibility_status = body.eligibilityStatus
    if (body.insuranceMonitoring !== undefined) updateData.insurance_monitoring = body.insuranceMonitoring
    if (body.extendedCareData !== undefined) updateData.extendedcare_data = body.extendedCareData
    
    // Update the updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("referrals")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating referral:", error)
      return NextResponse.json({ error: "Failed to update referral" }, { status: 500 })
    }

    return NextResponse.json({ referral: data })
  } catch (error) {
    console.error("Error in referral PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/referrals/[id] - Delete a referral
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { error } = await supabase.from("referrals").delete().eq("id", id)

    if (error) {
      console.error("Error deleting referral:", error)
      return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in referral DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

