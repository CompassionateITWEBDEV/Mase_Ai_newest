import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch conversations for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    let conversations: any[] = []

    if (staffId) {
      // First, get conversation IDs the user is part of
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("staff_id", staffId)

      if (partError && partError.code !== "42P01") {
        throw partError
      }

      if (participations && participations.length > 0) {
        const conversationIds = participations.map((p: any) => p.conversation_id)

        // Fetch full conversation details
        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .select(`
            *,
            participants:conversation_participants(
              staff:staff(id, name, email, credentials)
            )
          `)
          .in("id", conversationIds)
          .order("updated_at", { ascending: false })

        if (convError && convError.code !== "42P01") {
          throw convError
        }

        conversations = convData || []
      }
    } else {
      // Fetch all conversations (for admin view)
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(
            staff:staff(id, name, email, credentials)
          )
        `)
        .order("updated_at", { ascending: false })

      if (error && error.code !== "42P01") {
        throw error
      }
      conversations = data || []
    }

    // If no conversations, return empty array
    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
        message: "No conversations found",
      })
    }

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv: any) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, sender:staff!sender_id(name)")
          .eq("conversation_id", conv.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        // Get unread count (messages after last_read_at)
        let unreadCount = 0
        if (staffId) {
          const { data: participant } = await supabase
            .from("conversation_participants")
            .select("last_read_at")
            .eq("conversation_id", conv.id)
            .eq("staff_id", staffId)
            .maybeSingle()

          if (participant?.last_read_at) {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .gt("created_at", participant.last_read_at)
              .neq("sender_id", staffId)

            unreadCount = count || 0
          }
        }

        return {
          ...conv,
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageTime: lastMessage?.created_at,
          unread: unreadCount,
        }
      })
    )

    return NextResponse.json({
      success: true,
      conversations: conversationsWithDetails,
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({
      success: false,
      conversations: [],
      error: error instanceof Error ? error.message : "Failed to fetch conversations",
    })
  }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { type, name, createdBy, participantIds } = body

    if (!type || !createdBy || !participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Type, creator, and participants are required" },
        { status: 400 }
      )
    }

    // For direct chats, check if conversation already exists between these two users
    if (type === "direct" && participantIds.length === 2) {
      const [user1, user2] = participantIds

      // Find conversations where both users are participants
      const { data: existingConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("staff_id", user1)

      if (existingConvs && existingConvs.length > 0) {
        const convIds = existingConvs.map((c: any) => c.conversation_id)

        // Check if user2 is also in any of these conversations
        const { data: sharedConvs } = await supabase
          .from("conversation_participants")
          .select(`
            conversation_id,
            conversation:conversations(id, type)
          `)
          .eq("staff_id", user2)
          .in("conversation_id", convIds)

        // Find a direct conversation
        const existingDirect = sharedConvs?.find(
          (c: any) => c.conversation?.type === "direct"
        )

        if (existingDirect) {
          // Return existing conversation
          const { data: fullConv } = await supabase
            .from("conversations")
            .select(`
              *,
              participants:conversation_participants(
                staff:staff(id, name, email, credentials)
              )
            `)
            .eq("id", existingDirect.conversation_id)
            .single()

          return NextResponse.json({
            success: true,
            conversation: fullConv,
            existing: true,
          })
        }
      }
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        type,
        name: type === "group" ? name : null,
        created_by: createdBy,
      })
      .select()
      .single()

    if (convError) throw convError

    // Add participants
    const participantRecords = participantIds.map((staffId: string) => ({
      conversation_id: conversation.id,
      staff_id: staffId,
      is_admin: staffId === createdBy,
    }))

    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert(participantRecords)

    if (partError) throw partError

    // Fetch full conversation with participants
    const { data: fullConv } = await supabase
      .from("conversations")
      .select(`
        *,
        participants:conversation_participants(
          staff:staff(id, name, email, credentials)
        )
      `)
      .eq("id", conversation.id)
      .single()

    return NextResponse.json({
      success: true,
      conversation: fullConv || conversation,
    })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create conversation" },
      { status: 500 }
    )
  }
}

// PUT - Mark conversation as read
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { conversationId, staffId } = body

    if (!conversationId || !staffId) {
      return NextResponse.json(
        { success: false, error: "Conversation ID and staff ID are required" },
        { status: 400 }
      )
    }

    // Update last_read_at for this participant
    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("staff_id", staffId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Conversation marked as read",
    })
  } catch (error) {
    console.error("Error marking conversation as read:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to mark as read" },
      { status: 500 }
    )
  }
}


