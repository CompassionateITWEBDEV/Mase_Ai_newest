import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// GET - Fetch documents expiring within specified days from real database
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const { data: expiringDocs, error } = await supabase
      .from("staff_documents")
      .select("*")
      .not("expiry_date", "is", null)
      .lte("expiry_date", futureDate.toISOString().split("T")[0])
      .gte("expiry_date", today.toISOString().split("T")[0])
      .neq("status", "expired")
      .order("expiry_date", { ascending: true })

    if (error) {
      console.error("Error fetching expiring documents:", error)
      return NextResponse.json({
        success: true,
        documents: [],
        source: "empty",
        message: "Database table not found. Please run: scripts/setup-staff-documents-tables.sql",
      })
    }

    // Calculate days until expiry for each document
    const documentsWithDays = expiringDocs?.map((doc) => {
      const expiryDate = new Date(doc.expiry_date)
      const diffTime = expiryDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return {
        ...doc,
        days_until_expiry: diffDays,
      }
    })

    return NextResponse.json({
      success: true,
      documents: documentsWithDays || [],
      source: "database",
      count: documentsWithDays?.length || 0,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// POST - Check and update expired documents
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Find all documents that have expired but not marked as expired
    const { data: expiredDocs, error: fetchError } = await supabase
      .from("staff_documents")
      .select("id")
      .lt("expiry_date", new Date().toISOString())
      .neq("status", "expired")

    if (fetchError) {
      console.error("Error fetching expired documents:", fetchError)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    if (!expiredDocs || expiredDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No documents to update",
        updated: 0,
      })
    }

    // Update all expired documents
    const { error: updateError } = await supabase
      .from("staff_documents")
      .update({ status: "expired" })
      .in(
        "id",
        expiredDocs.map((d) => d.id),
      )

    if (updateError) {
      console.error("Error updating expired documents:", updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${expiredDocs.length} expired documents`,
      updated: expiredDocs.length,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

