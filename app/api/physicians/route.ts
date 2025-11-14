import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const searchTerm = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"

    let query = supabase
      .from("physicians")
      .select("*")
      .eq("is_active", true)
      .order("last_name", { ascending: true })

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("verification_status", status)
    }

    // Apply search filter
    if (searchTerm) {
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,npi.ilike.%${searchTerm}%,license_number.ilike.%${searchTerm}%,specialty.ilike.%${searchTerm}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching physicians:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ physicians: data || [] })
  } catch (error) {
    console.error("Error in GET /api/physicians:", error)
    return NextResponse.json(
      { error: "Failed to fetch physicians" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["npi", "firstName", "lastName"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Transform camelCase to snake_case for database
    const physicianData = {
      npi: body.npi,
      first_name: body.firstName,
      last_name: body.lastName,
      specialty: body.specialty || null,
      license_number: body.licenseNumber || null,
      license_state: body.licenseState || null,
      license_expiration: body.licenseExpiration || null,
      board_certification: body.boardCertification || null,
      board_expiration: body.boardExpiration || null,
      malpractice_insurance: body.malpracticeInsurance !== false,
      malpractice_expiration: body.malpracticeExpiration || null,
      dea_number: body.deaNumber || null,
      dea_expiration: body.deaExpiration || null,
      hospital_affiliations: body.hospitalAffiliations || [],
      notes: body.notes || null,
      added_by: body.addedBy || "System",
      verification_status: "not_verified",
      last_verified: null,
    }

    const { data, error } = await supabase
      .from("physicians")
      .insert(physicianData)
      .select()
      .single()

    if (error) {
      console.error("Error creating physician:", error)
      
      // Handle duplicate NPI error
      if (error.code === "23505" && error.message.includes("npi")) {
        return NextResponse.json(
          { error: `NPI ${body.npi} already exists. Please use a unique NPI.` },
          { status: 409 }
        )
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ physician: data }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/physicians:", error)
    return NextResponse.json(
      { error: "Failed to create physician" },
      { status: 500 }
    )
  }
}

