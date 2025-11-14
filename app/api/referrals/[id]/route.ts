import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// PATCH /api/referrals/[id] - Update referral status
export async function PATCH(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    console.log("=== Updating referral ===")
    console.log("Referral ID:", params.id)

    const supabase = createAdminClient()
    const body = await request.json()
    
    console.log("Update data:", body)

    const { status, socDueDate } = body

    if (!status) {
      console.error("❌ Missing status in request")
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Build update data
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString(),
    }

    if (socDueDate) {
      updateData.soc_due_date = socDueDate
    }

    console.log("Updating referral with data:", updateData)

    const { data, error } = await supabase
      .from("referrals")
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
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    console.log("✅ Referral updated successfully:", data)
    return NextResponse.json({ referral: data, success: true })
  } catch (error) {
    console.error("❌ Error updating referral:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 })
  }
}

// GET /api/referrals/[id] - Get single referral
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching referral:", error)
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    return NextResponse.json({ referral: data })
  } catch (error) {
    console.error("Error in referral GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/referrals/[id] - Delete referral
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("referrals")
      .delete()
      .eq("id", params.id)

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
