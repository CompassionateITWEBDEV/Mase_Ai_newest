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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facilityName = searchParams.get('facilityName') || 'Mercy Hospital'
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const supabase = getServiceClient()

    // Get facility user
    const { data: facilityUser } = await supabase
      .from('facility_users')
      .select('id, facility_name')
      .eq('facility_name', facilityName)
      .single()

    let query = supabase
      .from('facility_messages')
      .select(`
        id,
        message_number,
        from_type,
        from_name,
        to_type,
        to_name,
        subject,
        content,
        message_type,
        referral_id,
        dme_order_id,
        read,
        read_at,
        priority,
        created_at,
        referrals!facility_messages_referral_id_fkey (
          referral_number
        )
      `)
      .or(`to_id.eq.${facilityUser?.id},from_id.eq.${facilityUser?.id}`)
      .order('created_at', { ascending: false })
      .limit(100)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: "Failed to fetch messages: " + error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend expectations
    const transformedMessages = (messages || []).map(msg => ({
      id: msg.message_number || msg.id,
      from: msg.from_name,
      to: msg.to_name,
      subject: msg.subject,
      content: msg.content,
      timestamp: msg.created_at,
      read: msg.read,
      type: msg.message_type,
      priority: msg.priority,
      referralId: msg.referrals?.referral_number || null
    }))

    return NextResponse.json(transformedMessages)
  } catch (error) {
    console.error('Error in GET messages:', error)
    return NextResponse.json(
      { error: "Failed to fetch messages: " + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const messageData = await request.json()
    const supabase = getServiceClient()

    // Validate required fields
    if (!messageData.subject || !messageData.content) {
      return NextResponse.json(
        { error: "Missing required fields: subject, content" },
        { status: 400 }
      )
    }

    // Get facility user
    const { data: facilityUser } = await supabase
      .from('facility_users')
      .select('id, facility_name, contact_name')
      .eq('facility_name', messageData.facilityName || 'Mercy Hospital')
      .single()

    // Get referral if provided
    let referralId = null
    if (messageData.referralId) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_number', messageData.referralId)
        .single()
      referralId = referral?.id
    }

    // Create message in database
    const { data: newMessage, error: messageError } = await supabase
      .from('facility_messages')
      .insert({
        from_type: 'facility',
        from_id: facilityUser?.id,
        from_name: facilityUser?.facility_name || 'Mercy Hospital',
        to_type: 'mase_team',
        to_name: 'M.A.S.E. Team',
        subject: messageData.subject,
        content: messageData.content,
        message_type: messageData.type || 'message',
        referral_id: referralId,
        priority: messageData.priority || 'normal'
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { error: "Failed to send message: " + messageError.message },
        { status: 500 }
      )
    }

    const response = {
      id: newMessage.message_number,
      status: "sent",
      message: "Message sent successfully to M.A.S.E. team",
      deliveryTime: newMessage.created_at,
      readReceipt: false,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: "Failed to send message: " + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { messageId, read } = await request.json()
    const supabase = getServiceClient()

    if (!messageId) {
      return NextResponse.json(
        { error: "Missing required field: messageId" },
        { status: 400 }
      )
    }

    // Update message read status
    const { data, error } = await supabase
      .from('facility_messages')
      .update({
        read: read !== undefined ? read : true,
        read_at: read !== false ? new Date().toISOString() : null
      })
      .eq('message_number', messageId)
      .select()
      .single()

    if (error) {
      console.error('Error updating message:', error)
      return NextResponse.json(
        { error: "Failed to update message: " + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: data })
  } catch (error) {
    console.error('Error in PATCH message:', error)
    return NextResponse.json(
      { error: "Failed to update message: " + (error as Error).message },
      { status: 500 }
    )
  }
}
