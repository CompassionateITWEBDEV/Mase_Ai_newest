import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET /api/authorizations/[id] - Fetch a single authorization
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    console.log("=== Fetching authorization ===")
    console.log("Authorization ID:", params.id)

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("authorizations")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("❌ Supabase error:", error)
      return NextResponse.json({
        error: `Database error: ${error.message}`,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    if (!data) {
      console.error("❌ Authorization not found")
      return NextResponse.json({ error: "Authorization not found" }, { status: 404 })
    }

    console.log("✅ Authorization fetched successfully")
    return NextResponse.json({ authorization: data })
  } catch (error) {
    console.error("❌ Error fetching authorization:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({
      error: `Internal server error: ${errorMessage}`
    }, { status: 500 })
  }
}

// PATCH /api/authorizations/[id] - Update an authorization
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    console.log("=== Updating authorization ===")
    console.log("Authorization ID:", params.id)

    const supabase = createAdminClient()
    const body = await request.json()
    
    console.log("Update data:", body)

    const {
      status,
      authorizationNumber,
      approvedServices,
      approvedVisits,
      denialReason,
      reviewerNotes,
      expirationDate,
      actualReimbursement,
      timelineEntry,
      userRole
    } = body

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString()
      // Note: updated_at is automatically set by database trigger
    }

    if (status !== undefined) updateData.status = status
    if (authorizationNumber !== undefined) updateData.authorization_number = authorizationNumber
    if (approvedServices !== undefined) updateData.approved_services = approvedServices
    if (approvedVisits !== undefined) updateData.approved_visits = approvedVisits
    if (denialReason !== undefined) updateData.denial_reason = denialReason
    if (reviewerNotes !== undefined) updateData.reviewer_notes = reviewerNotes
    if (expirationDate !== undefined) updateData.expiration_date = expirationDate
    if (actualReimbursement !== undefined) updateData.actual_reimbursement = actualReimbursement

    // Set response date if status is approved or denied
    if (status === "approved" || status === "denied") {
      updateData.response_date = new Date().toISOString().split('T')[0]
    }

    // Auto-generate authorization number if approved
    if (status === "approved" && !authorizationNumber) {
      updateData.authorization_number = `AUTH-${Date.now()}`
    }

    console.log("Update data prepared:", updateData)

    // First, get current authorization data to update timeline
    const { data: currentAuth, error: fetchError } = await supabase
      .from("authorizations")
      .select("timeline")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("❌ Error fetching current authorization:", fetchError)
      return NextResponse.json({
        error: `Database error: ${fetchError.message}`
      }, { status: 500 })
    }

    // Update timeline
    const currentTimeline = currentAuth?.timeline || []
    const newTimelineEntry = timelineEntry || {
      date: new Date().toISOString(),
      action: status ? `Status updated to ${status}` : "Authorization updated",
      user: userRole || "System",
      notes: reviewerNotes || undefined
    }

    updateData.timeline = [...currentTimeline, newTimelineEntry]

    // Perform the update
    const { data, error } = await supabase
      .from("authorizations")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Supabase error:", error)
      return NextResponse.json({
        error: `Database error: ${error.message}`,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    if (!data) {
      console.error("❌ No data returned after update")
      return NextResponse.json({ error: "Authorization not found" }, { status: 404 })
    }

    console.log("✅ Authorization updated successfully:", data)

    // 🔗 SYNC WITH REFERRAL - Update referral status when authorization is approved/denied
    if (data.referral_id && (status === "approved" || status === "denied")) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("🔗 [INTEGRATION] Authorization status changed - updating linked referral")
      console.log("   Authorization ID:", params.id)
      console.log("   Linked Referral ID:", data.referral_id)
      console.log("   Authorization Status:", status)
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      
      try {
        const newReferralStatus = status === "approved" ? "Approved" : "Denied"
        
        console.log("   Updating referral to status:", newReferralStatus)
        console.log("   This will trigger patient creation if approved!")
        
        // Use the referral API endpoint to trigger patient creation
        const referralUpdateResponse = await fetch(`${request.url.split('/api')[0]}/api/referrals/${data.referral_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newReferralStatus,
            socDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 5 days from now
          })
        })

        if (!referralUpdateResponse.ok) {
          const errorData = await referralUpdateResponse.json()
          throw new Error(errorData.error || "Failed to update referral")
        }

        const referralResult = await referralUpdateResponse.json()
        const updatedReferral = referralResult.referral

        if (updatedReferral) {
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
          console.log("✅ [INTEGRATION] Referral status updated successfully!")
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
          console.log("📋 Referral ID:", data.referral_id)
          console.log("👤 Patient:", updatedReferral.patient_name)
          console.log("📊 Authorization Status:", status)
          console.log("📊 Referral Old Status: Pending Auth")
          console.log("📊 Referral New Status:", updatedReferral.status)
          console.log("🕐 Updated At:", updatedReferral.updated_at)
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
          console.log("🎯 Referral now visible in correct tab!")
          if (status === "approved") {
            console.log("👥 Patient record auto-created in Patient Tracking!")
          }
          console.log("🔄 Please refresh Referral Processing tab to see changes")
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        } else {
          console.error("⚠️ No referral data returned - referral may not exist")
        }
      } catch (integrationError) {
        console.error("⚠️ Error syncing with referral:", integrationError)
        // Don't fail the authorization update if referral sync fails
      }
    }

    return NextResponse.json({ authorization: data, success: true })
  } catch (error) {
    console.error("❌ Error updating authorization:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({
      error: `Internal server error: ${errorMessage}`
    }, { status: 500 })
  }
}

// DELETE /api/authorizations/[id] - Delete an authorization
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    console.log("=== Deleting authorization ===")
    console.log("Authorization ID:", params.id)

    const supabase = createAdminClient()

    const { error } = await supabase
      .from("authorizations")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("❌ Supabase error:", error)
      return NextResponse.json({
        error: `Database error: ${error.message}`,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    console.log("✅ Authorization deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error deleting authorization:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({
      error: `Internal server error: ${errorMessage}`
    }, { status: 500 })
  }
}

