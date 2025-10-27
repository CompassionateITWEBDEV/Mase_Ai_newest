import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/referrals - Fetch all referrals with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    const status = searchParams.get("status")
    const source = searchParams.get("source")
    const search = searchParams.get("search")

    let query = supabase.from("referrals").select("*").order("referral_date", { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }
    
    if (source && source !== "all") {
      if (source === "extendedcare") {
        query = query.eq("referral_source", "ExtendedCare Network")
      } else if (source === "fax") {
        query = query.eq("referral_source", "Fax Upload")
      } else if (source === "email") {
        query = query.like("referral_source", "Email from%")
      } else if (source === "hospital") {
        query = query.or("referral_source.ilike.%Hospital%,referral_source.ilike.%Clinic%")
      }
    }

    if (search) {
      query = query.or(
        `patient_name.ilike.%${search}%,diagnosis.ilike.%${search}%,insurance_provider.ilike.%${search}%,referral_source.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching referrals:", error)
      return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 })
    }

    return NextResponse.json({ referrals: data || [] })
  } catch (error) {
    console.error("Error in referrals GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/referrals - Create a new referral
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      patientName,
      referralDate,
      referralSource,
      diagnosis,
      insuranceProvider,
      insuranceId,
      aiRecommendation,
      aiReason,
      extendedCareData,
    } = body

    if (!patientName || !referralDate || !diagnosis || !insuranceProvider || !insuranceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("referrals")
      .insert({
        patient_name: patientName,
        referral_date: referralDate,
        referral_source: referralSource || "Manual Entry",
        diagnosis: diagnosis,
        insurance_provider: insuranceProvider,
        insurance_id: insuranceId,
        ai_recommendation: aiRecommendation,
        ai_reason: aiReason,
        extendedcare_data: extendedCareData,
        status: "New",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating referral:", error)
      return NextResponse.json({ error: "Failed to create referral" }, { status: 500 })
    }

    return NextResponse.json({ referral: data }, { status: 201 })
  } catch (error) {
    console.error("Error in referrals POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

