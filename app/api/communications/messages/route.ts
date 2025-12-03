import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "Conversation ID is required" },
        { status: 400 }
      )
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:staff!sender_id(id, name, email)
      `)
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(limit)

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          messages: [],
          message: "Messages table not set up",
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { conversationId, senderId, content, messageType, metadata } = body

    if (!conversationId || !senderId || !content) {
      return NextResponse.json(
        { success: false, error: "Conversation ID, sender ID, and content are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType || "text",
        metadata,
      })
      .select(`
        *,
        sender:staff!sender_id(id, name, email)
      `)
      .single()

    if (error) throw error

    // Update conversation's updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)

    return NextResponse.json({
      success: true,
      message: data,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a message (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get("id")

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", messageId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Message deleted",
    })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete message" },
      { status: 500 }
    )
  }
}

