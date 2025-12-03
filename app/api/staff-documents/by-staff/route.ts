import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// GET - Fetch staff documents by staff_id or email
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const email = searchParams.get("email")
    const type = searchParams.get("type") // Optional: filter by document type (license, certification, etc.)

    if (!staffId && !email) {
      return NextResponse.json(
        { success: false, error: "Staff ID or email is required" },
        { status: 400 }
      )
    }

    let query = supabase.from("staff_documents").select("*")

    // If email provided, first find the staff member
    if (email && !staffId) {
      const { data: staffMember } = await supabase
        .from("staff")
        .select("id, name, email")
        .eq("email", email)
        .maybeSingle()

      if (staffMember) {
        query = query.eq("staff_id", staffMember.id)
      } else {
        // No staff found with this email
        return NextResponse.json({
          success: true,
          documents: [],
          message: "No staff member found with this email",
        })
      }
    } else if (staffId) {
      query = query.eq("staff_id", staffId)
    }

    // Filter by document type if specified
    if (type) {
      if (type === "certifications") {
        // Include both licenses and certifications
        query = query.or("document_type.ilike.%license%,document_type.ilike.%certification%,document_type.ilike.%cert%,document_type.eq.RN License,document_type.eq.BLS,document_type.eq.ACLS,document_type.eq.CPR")
      } else {
        query = query.ilike("document_type", `%${type}%`)
      }
    }

    const { data: documents, error } = await query.order("created_at", { ascending: false })

    if (error) {
      // Table might not exist
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          documents: [],
          message: "Staff documents table not set up. Run setup-staff-documents-tables.sql",
        })
      }
      throw error
    }

    // Transform to frontend format
    const formattedDocs = (documents || []).map((doc: any) => ({
      id: doc.id,
      staffId: doc.staff_id,
      staffName: doc.staff_name,
      documentType: doc.document_type,
      documentName: doc.document_name || doc.document_type,
      fileName: doc.file_name,
      fileUrl: doc.file_url,
      fileSize: doc.file_size,
      status: doc.status,
      category: doc.category,
      expirationDate: doc.expiration_date,
      verifiedAt: doc.verified_at,
      verifiedBy: doc.verified_by,
      notes: doc.notes,
      createdAt: doc.created_at,
      // For certifications display
      name: doc.document_name || doc.document_type,
      expires: doc.expiration_date || null,
    }))

    return NextResponse.json({
      success: true,
      documents: formattedDocs,
      count: formattedDocs.length,
    })
  } catch (error) {
    console.error("Error fetching staff documents:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

