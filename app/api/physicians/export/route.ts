import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: physicians, error } = await supabase
      .from("physicians")
      .select("*")
      .eq("is_active", true)
      .order("last_name", { ascending: true })

    if (error) {
      console.error("Error fetching physicians for export:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert to CSV format
    const headers = [
      "NPI",
      "First Name",
      "Last Name",
      "Specialty",
      "License Number",
      "License State",
      "License Expiration",
      "CAQH ID",
      "Verification Status",
      "Last Verified",
      "Board Certification",
      "Board Expiration",
      "Malpractice Insurance",
      "Malpractice Expiration",
      "DEA Number",
      "DEA Expiration",
      "Hospital Affiliations",
      "Notes",
      "Added By",
      "Created At",
    ]

    const csvRows = [headers.join(",")]

    physicians?.forEach((physician) => {
      const row = [
        physician.npi,
        physician.first_name,
        physician.last_name,
        physician.specialty || "",
        physician.license_number || "",
        physician.license_state || "",
        physician.license_expiration || "",
        physician.caqh_id || "",
        physician.verification_status,
        physician.last_verified || "",
        physician.board_certification || "",
        physician.board_expiration || "",
        physician.malpractice_insurance ? "Yes" : "No",
        physician.malpractice_expiration || "",
        physician.dea_number || "",
        physician.dea_expiration || "",
        physician.hospital_affiliations?.join("; ") || "",
        physician.notes ? `"${physician.notes.replace(/"/g, '""')}"` : "",
        physician.added_by || "",
        new Date(physician.created_at).toLocaleDateString(),
      ]
      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="physicians_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/physicians/export:", error)
    return NextResponse.json(
      { error: "Failed to export physicians" },
      { status: 500 }
    )
  }
}




