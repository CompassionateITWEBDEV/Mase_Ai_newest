import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

// GET /api/referrals - Fetch all referrals with optional filtering
export async function GET(request: NextRequest) {
  try {
    console.log("=== Fetching all referrals ===")
    
    // Use admin client to bypass RLS
    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    
    const status = searchParams.get("status")
    const source = searchParams.get("source")
    const search = searchParams.get("search")

    console.log("Query params:", { status, source, search })

    let query = supabase.from("referrals").select("*").order("created_at", { ascending: false })

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
      console.error("❌ Supabase error fetching referrals:", error)
      return NextResponse.json({ 
        error: "Failed to fetch referrals",
        details: error.message 
      }, { status: 500 })
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} referrals`)
    if (data && data.length > 0) {
      console.log("Sample referral:", data[0])
      console.log("Eligibility status from DB:", data[0].eligibility_status)
      console.log("Insurance monitoring from DB:", data[0].insurance_monitoring)
    }

    return NextResponse.json({ referrals: data || [] })
  } catch (error) {
    console.error("❌ Error in referrals GET:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ 
      error: "Internal server error",
      details: errorMessage 
    }, { status: 500 })
  }
}

// POST /api/referrals - Create a new referral
export async function POST(request: NextRequest) {
  try {
    console.log("=== Starting referral creation ===")
    
    // Use admin client to bypass RLS for server-side referral creation
    let supabase
    try {
      supabase = createAdminClient()
      console.log("Admin client created successfully")
    } catch (adminError) {
      console.error("Failed to create admin client:", adminError)
      return NextResponse.json({ 
        error: "Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY. Please contact administrator.",
        details: adminError instanceof Error ? adminError.message : "Unknown error",
        setupInstructions: "Administrator: Add SUPABASE_SERVICE_ROLE_KEY to .env.local file. See ENV_SETUP_REFERRALS.md"
      }, { status: 500 })
    }

    const body = await request.json()
    console.log("Received referral creation request:", body)

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

    // Validate core required fields only (diagnosis made optional for backwards compatibility)
    if (!patientName || !referralDate || !insuranceProvider || !insuranceId) {
      const missing = []
      if (!patientName) missing.push("patientName")
      if (!referralDate) missing.push("referralDate")
      if (!insuranceProvider) missing.push("insuranceProvider")
      if (!insuranceId) missing.push("insuranceId")
      console.error("Missing required fields:", missing)
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 })
    }

    // Generate unique referral number
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const referralNumber = `REF-${timestamp}-${randomNum}`

    // Build insert data object - ALL required fields included
    const insertData: any = {
      patient_name: patientName,
      referral_date: referralDate,
      referral_source: referralSource || "Manual Entry",
      referral_type: "standard", // Required field - default to "standard"
      clinical_summary: diagnosis || "Manual entry - pending clinical review", // Required field
      insurance_provider: insuranceProvider,
      insurance_id: insuranceId,
      status: "New",
      referral_number: referralNumber,
    }

    // Add optional fields only if they are provided
    if (diagnosis) {
      insertData.diagnosis = diagnosis
    }
    if (aiRecommendation) {
      insertData.ai_recommendation = aiRecommendation
    }
    if (aiReason) {
      insertData.ai_reason = aiReason
    }
    if (extendedCareData) {
      insertData.extendedcare_data = extendedCareData
    }

    console.log("Inserting referral into database:", insertData)

    const { data, error } = await supabase
      .from("referrals")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("Supabase error creating referral:", error)
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        details: error.details,
        hint: error.hint,
      }, { status: 500 })
    }

    console.log("Referral created successfully:", data)
    return NextResponse.json({ referral: data }, { status: 201 })
  } catch (error) {
    console.error("Error in referrals POST:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 })
  }
}

