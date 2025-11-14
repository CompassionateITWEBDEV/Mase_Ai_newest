import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from("physicians")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching physician:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ physician: data })
  } catch (error) {
    console.error("Error in GET /api/physicians/[id]:", error)
    return NextResponse.json(
      { error: "Failed to fetch physician" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Transform camelCase to snake_case for database
    const updateData: any = {}
    
    if (body.verificationStatus !== undefined) updateData.verification_status = body.verificationStatus
    if (body.lastVerified !== undefined) updateData.last_verified = body.lastVerified
    if (body.caqhId !== undefined) updateData.caqh_id = body.caqhId
    if (body.firstName !== undefined) updateData.first_name = body.firstName
    if (body.lastName !== undefined) updateData.last_name = body.lastName
    if (body.specialty !== undefined) updateData.specialty = body.specialty
    if (body.licenseNumber !== undefined) updateData.license_number = body.licenseNumber
    if (body.licenseState !== undefined) updateData.license_state = body.licenseState
    if (body.licenseExpiration !== undefined) updateData.license_expiration = body.licenseExpiration
    if (body.boardCertification !== undefined) updateData.board_certification = body.boardCertification
    if (body.boardExpiration !== undefined) updateData.board_expiration = body.boardExpiration
    if (body.malpracticeInsurance !== undefined) updateData.malpractice_insurance = body.malpracticeInsurance
    if (body.malpracticeExpiration !== undefined) updateData.malpractice_expiration = body.malpracticeExpiration
    if (body.deaNumber !== undefined) updateData.dea_number = body.deaNumber
    if (body.deaExpiration !== undefined) updateData.dea_expiration = body.deaExpiration
    if (body.hospitalAffiliations !== undefined) updateData.hospital_affiliations = body.hospitalAffiliations
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data, error } = await supabase
      .from("physicians")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating physician:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ physician: data })
  } catch (error) {
    console.error("Error in PATCH /api/physicians/[id]:", error)
    return NextResponse.json(
      { error: "Failed to update physician" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("physicians")
      .update({ is_active: false })
      .eq("id", id)

    if (error) {
      console.error("Error deleting physician:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/physicians/[id]:", error)
    return NextResponse.json(
      { error: "Failed to delete physician" },
      { status: 500 }
    )
  }
}

