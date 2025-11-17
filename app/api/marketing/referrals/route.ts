import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Singleton Supabase client
let serviceClient: any = null

function getServiceClient() {
  if (!serviceClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration")
    }
    
    serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return serviceClient
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getServiceClient()

    // Validate required fields
    const requiredFields = ["facilityName", "contactName", "patientName", "serviceNeeded", "referredBy"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Enhanced routing logic
    let routingDestination = "general"
    let organizationName = "M.A.S.E. Pro"

    if (
      body.serviceNeeded === "behavioral" ||
      body.serviceNeeded === "detox" ||
      body.serviceNeeded === "mental-health"
    ) {
      routingDestination = "serenity"
      organizationName = "Serenity"
    } else if (["home-health", "skilled-nursing", "therapy", "hospice"].includes(body.serviceNeeded)) {
      routingDestination = "chhs"
      organizationName = "CHHS"
    }

    // Insert into Supabase database
    const { data: newReferral, error: insertError } = await supabase
      .from('marketing_referrals')
      .insert({
        facility_name: body.facilityName,
        contact_name: body.contactName,
        contact_phone: body.contactPhone || null,
        contact_email: body.contactEmail || null,
        patient_name: body.patientName,
        patient_age: body.patientAge || null,
        service_needed: body.serviceNeeded,
        urgency_level: body.urgencyLevel || "routine",
        referral_date: body.referralDate || new Date().toISOString().split('T')[0],
        referred_by: body.referredBy,
        insurance_type: body.insuranceType || null,
        notes: body.notes || null,
        source: body.source || "direct",
        facility_id: body.facilityId || null,
        routing_destination: routingDestination,
        organization_name: organizationName,
        status: "new"
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ [REFERRAL INTAKE] Error inserting marketing referral:', insertError)
      return NextResponse.json(
        { success: false, error: "Failed to create referral: " + insertError.message },
        { status: 500 }
      )
    }

    // ✅ SUCCESS LOG - Referral inserted into database
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ [REFERRAL INTAKE] Successfully inserted into database!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 Referral Number:', newReferral.referral_number)
    console.log('🏥 Facility:', newReferral.facility_name)
    console.log('👤 Contact:', newReferral.contact_name)
    console.log('🤒 Patient:', newReferral.patient_name)
    console.log('💊 Service:', newReferral.service_needed)
    console.log('⏱️  Urgency:', newReferral.urgency_level.toUpperCase())
    console.log('🎯 Routing:', `${newReferral.organization_name} (${newReferral.routing_destination})`)
    console.log('👨‍💼 Marketer:', newReferral.referred_by)
    console.log('📱 Source:', newReferral.source)
    console.log('🆔 Database ID:', newReferral.id)
    console.log('📅 Created:', new Date(newReferral.created_at).toLocaleString())
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Send webhook notification with enhanced data
    if (process.env.WEBHOOK_URL) {
      console.log('📤 Sending webhook notification...')
      await fetch(process.env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "new_marketing_referral",
          data: newReferral,
          routing: {
            destination: routingDestination,
            organization: organizationName,
          },
          urgency: body.urgencyLevel || "routine",
          timestamp: new Date().toISOString(),
        }),
      }).catch(err => console.error('❌ Webhook error:', err))
    }

    // Log urgent referrals with special attention
    if (body.urgencyLevel === "urgent" || body.urgencyLevel === "stat") {
      console.log('')
      console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨')
      console.log(`🚨 URGENT REFERRAL ALERT: ${newReferral.referral_number}`)
      console.log(`🚨 Priority Level: ${body.urgencyLevel.toUpperCase()}`)
      console.log(`🚨 Patient: ${newReferral.patient_name}`)
      console.log(`🚨 Facility: ${newReferral.facility_name}`)
      console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨')
      console.log('')
    }

    return NextResponse.json({
      success: true,
      referral: {
        id: newReferral.id,
        referralNumber: newReferral.referral_number,
        facilityName: newReferral.facility_name,
        contactName: newReferral.contact_name,
        patientName: newReferral.patient_name,
        serviceNeeded: newReferral.service_needed,
        urgencyLevel: newReferral.urgency_level,
        status: newReferral.status,
        createdAt: newReferral.created_at,
      },
      routing: {
        destination: routingDestination,
        organization: organizationName,
      },
      message: `Referral successfully submitted and routed to ${organizationName}`,
    })
  } catch (error) {
    console.error("Error processing referral:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to process referral: " + (error as Error).message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Optional query parameters
    const status = searchParams.get("status")
    const referredBy = searchParams.get("referredBy")
    const routingDestination = searchParams.get("routing")
    const limit = parseInt(searchParams.get("limit") || "50")
    
    // Build query
    let query = supabase
      .from('marketing_referrals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (referredBy) {
      query = query.eq('referred_by', referredBy)
    }
    if (routingDestination) {
      query = query.eq('routing_destination', routingDestination)
    }
    
    const { data: referrals, error } = await query
    
    if (error) {
      console.error('Error fetching marketing referrals:', error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch referrals: " + error.message },
        { status: 500 }
      )
    }
    
    // Transform to match frontend expectations
    const transformedReferrals = (referrals || []).map(ref => ({
      id: ref.referral_number || ref.id,
      referralNumber: ref.referral_number,
      facilityName: ref.facility_name,
      contactName: ref.contact_name,
      contactPhone: ref.contact_phone,
      contactEmail: ref.contact_email,
      patientName: ref.patient_name,
      patientAge: ref.patient_age,
      serviceNeeded: ref.service_needed,
      urgencyLevel: ref.urgency_level,
      status: ref.status,
      referredBy: ref.referred_by,
      routingDestination: ref.routing_destination,
      organizationName: ref.organization_name,
      createdAt: ref.created_at,
      insuranceType: ref.insurance_type,
      notes: ref.notes,
    }))

    return NextResponse.json({
      success: true,
      referrals: transformedReferrals,
      count: transformedReferrals.length,
    })
  } catch (error) {
    console.error("Error fetching referrals:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch referrals: " + (error as Error).message 
    }, { status: 500 })
  }
}
