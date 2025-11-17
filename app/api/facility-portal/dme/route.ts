import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Singleton Supabase client for serverless
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
    const orderData = await request.json()
    const supabase = getServiceClient()

    // Validate required fields
    if (!orderData.patientInitials || !orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: patientInitials, items" },
        { status: 400 }
      )
    }

    const supplier = orderData.supplier || "parachute"
    
    // Calculate total cost (mock pricing: $25 per item)
    const totalCost = orderData.items.reduce((sum: number, item: any) => sum + (item.quantity || 1) * 25, 0)

    // Get referral if provided
    let referralId = null
    if (orderData.referralId) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_number', orderData.referralId)
        .single()
      referralId = referral?.id
    }

    // Get facility user
    const { data: facilityUser } = await supabase
      .from('facility_users')
      .select('id, facility_name')
      .eq('facility_name', orderData.facilityName || 'Mercy Hospital')
      .single()

    // Create DME order in database
    const { data: newOrder, error: orderError } = await supabase
      .from('dme_orders')
      .insert({
        referral_id: referralId,
        facility_user_id: facilityUser?.id,
        patient_name: orderData.patientName || orderData.patientInitials,
        patient_initials: orderData.patientInitials,
        items: orderData.items,
        status: 'approved', // Auto-approve for demo
        supplier: supplier,
        order_date: new Date().toISOString().split('T')[0],
        approved_date: new Date().toISOString().split('T')[0],
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tracking_number: `${supplier.toUpperCase()}${Math.floor(Math.random() * 100000000)}`,
        total_cost: totalCost,
        insurance_coverage: 90.0,
        notes: orderData.notes || ''
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating DME order:', orderError)
      return NextResponse.json(
        { error: "Failed to create DME order: " + orderError.message },
        { status: 500 }
      )
    }

    // Create notification message
    await supabase
      .from('facility_messages')
      .insert({
        from_type: 'system',
        from_name: 'M.A.S.E. DME Team',
        to_type: 'facility',
        to_id: facilityUser?.id,
        to_name: facilityUser?.facility_name || 'Mercy Hospital',
        subject: `DME Order ${newOrder.order_number} Approved`,
        content: `Your DME order for patient ${orderData.patientInitials} has been approved and processed through ${supplier === "parachute" ? "Parachute Health" : "Verse Medical"}. Tracking: ${newOrder.tracking_number}`,
        message_type: 'notification',
        referral_id: referralId,
        dme_order_id: newOrder.id,
        priority: 'normal'
      })

    const response = {
      orderId: newOrder.order_number,
      status: "approved",
      supplier: supplier === "parachute" ? "Parachute Health" : "Verse Medical",
      estimatedDelivery: newOrder.estimated_delivery,
      trackingNumber: newOrder.tracking_number,
      message: `DME order approved and processed through ${supplier === "parachute" ? "Parachute Health" : "Verse Medical"}`,
      items: newOrder.items,
      totalCost: newOrder.total_cost,
      insuranceCoverage: `${newOrder.insurance_coverage}%`,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error processing DME order:', error)
    return NextResponse.json(
      { error: "Failed to process DME order: " + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const referralNumber = searchParams.get("referralId")
    const facilityName = searchParams.get("facilityName") || 'Mercy Hospital'
    const supabase = getServiceClient()

    let query = supabase
      .from('dme_orders')
      .select(`
        id,
        order_number,
        referral_id,
        patient_name,
        patient_initials,
        items,
        status,
        supplier,
        order_date,
        approved_date,
        shipped_date,
        delivered_date,
        estimated_delivery,
        tracking_number,
        total_cost,
        insurance_coverage,
        notes,
        referrals!dme_orders_referral_id_fkey (
          referral_number
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    // Filter by referral if provided
    if (referralNumber) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_number', referralNumber)
        .single()
      
      if (referral) {
        query = query.eq('referral_id', referral.id)
      }
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching DME orders:', error)
      return NextResponse.json(
        { error: "Failed to fetch DME orders: " + error.message },
        { status: 500 }
      )
    }

    // Return orders with all fields for the frontend
    const ordersWithMetadata = (orders || []).map(order => ({
      ...order,
      order_id: order.order_number,
      created_at: order.order_date
    }))

    return NextResponse.json(ordersWithMetadata)
  } catch (error) {
    console.error('Error in GET DME orders:', error)
    return NextResponse.json(
      { error: "Failed to fetch DME orders: " + (error as Error).message },
      { status: 500 }
    )
  }
}
