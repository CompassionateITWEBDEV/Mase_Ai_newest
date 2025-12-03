import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch scheduled meetings
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const upcoming = searchParams.get("upcoming") === "true"

    let query = supabase
      .from("scheduled_meetings")
      .select(`
        *,
        organizer:staff!organizer_id(id, name, email),
        participants:meeting_participants(
          staff:staff(id, name, email),
          status
        )
      `)
      .order("meeting_date", { ascending: true })
      .order("start_time", { ascending: true })

    // Filter for upcoming meetings
    if (upcoming) {
      const today = new Date().toISOString().split("T")[0]
      query = query.gte("meeting_date", today).eq("status", "scheduled")
    }

    const { data: meetings, error } = await query

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          meetings: getSampleMeetings(),
          message: "Using sample data - run setup-communications-tables.sql",
        })
      }
      throw error
    }

    if (!meetings || meetings.length === 0) {
      return NextResponse.json({
        success: true,
        meetings: getSampleMeetings(),
        message: "No meetings found - showing sample data",
      })
    }

    // Format meetings
    const formattedMeetings = meetings.map((meeting: any) => ({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      agenda: meeting.agenda,
      date: meeting.meeting_date,
      time: formatTime(meeting.start_time),
      duration: `${meeting.duration_minutes} minutes`,
      participants: meeting.participants?.map((p: any) => p.staff?.name).filter(Boolean) || [],
      type: meeting.meeting_type,
      meetingLink: meeting.meeting_link || `https://meet.irishtriplets.com/${meeting.id}`,
      status: meeting.status,
      organizer: meeting.organizer?.name,
    }))

    return NextResponse.json({
      success: true,
      meetings: formattedMeetings,
    })
  } catch (error) {
    console.error("Error fetching meetings:", error)
    return NextResponse.json({
      success: true,
      meetings: getSampleMeetings(),
      error: error instanceof Error ? error.message : "Failed to fetch meetings",
    })
  }
}

// POST - Schedule a new meeting
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const {
      title,
      description,
      agenda,
      organizerId,
      date,
      time,
      durationMinutes,
      meetingType,
      isRecurring,
      recurrencePattern,
      participantIds,
    } = body

    if (!title || !organizerId || !date || !time) {
      return NextResponse.json(
        { success: false, error: "Title, organizer, date, and time are required" },
        { status: 400 }
      )
    }

    // Generate meeting link
    const meetingLink = `https://meet.irishtriplets.com/${Date.now()}`

    // Create meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("scheduled_meetings")
      .insert({
        title,
        description,
        agenda,
        organizer_id: organizerId,
        meeting_date: date,
        start_time: time,
        duration_minutes: durationMinutes || 30,
        meeting_type: meetingType || "general",
        meeting_link: meetingLink,
        is_recurring: isRecurring || false,
        recurrence_pattern: recurrencePattern,
      })
      .select()
      .single()

    if (meetingError) throw meetingError

    // Add participants
    if (participantIds && participantIds.length > 0) {
      const participantRecords = participantIds.map((staffId: string) => ({
        meeting_id: meeting.id,
        staff_id: staffId,
        status: "pending",
      }))

      await supabase.from("meeting_participants").insert(participantRecords)
    }

    return NextResponse.json({
      success: true,
      meeting: {
        ...meeting,
        meetingLink,
      },
    })
  } catch (error) {
    console.error("Error scheduling meeting:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to schedule meeting" },
      { status: 500 }
    )
  }
}

// PUT - Update meeting (cancel, update status, etc.)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { id, status, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Meeting ID is required" },
        { status: 400 }
      )
    }

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    }
    if (status) updateData.status = status

    const { data, error } = await supabase
      .from("scheduled_meetings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      meeting: data,
    })
  } catch (error) {
    console.error("Error updating meeting:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update meeting" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a meeting
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Meeting ID is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase.from("scheduled_meetings").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Meeting deleted",
    })
  } catch (error) {
    console.error("Error deleting meeting:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete meeting" },
      { status: 500 }
    )
  }
}

// Helper function to format time
function formatTime(time: string): string {
  if (!time) return ""
  const [hours, minutes] = time.split(":")
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

// Sample meetings for when database is not set up
function getSampleMeetings() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  return [
    {
      id: "sample-1",
      title: "Weekly Team Standup",
      date: tomorrow.toISOString().split("T")[0],
      time: "09:00 AM",
      duration: "30 minutes",
      participants: ["Dr. Wilson", "Sarah Johnson", "Michael Chen", "Emily Davis"],
      type: "recurring",
      meetingLink: "https://meet.irishtriplets.com/weekly-standup",
      status: "scheduled",
      agenda: "Review weekly goals, discuss patient assignments, address any concerns",
    },
    {
      id: "sample-2",
      title: "HIPAA Compliance Training",
      date: nextWeek.toISOString().split("T")[0],
      time: "02:00 PM",
      duration: "60 minutes",
      participants: ["All Staff"],
      type: "training",
      meetingLink: "https://meet.irishtriplets.com/hipaa-training",
      status: "scheduled",
      agenda: "Annual HIPAA compliance training and Q&A session",
    },
    {
      id: "sample-3",
      title: "Performance Review - Sarah Johnson",
      date: nextWeek.toISOString().split("T")[0],
      time: "10:00 AM",
      duration: "45 minutes",
      participants: ["Dr. Wilson", "Sarah Johnson", "HR Manager"],
      type: "evaluation",
      meetingLink: "https://meet.irishtriplets.com/performance-review-sj",
      status: "scheduled",
      agenda: "Annual performance evaluation and goal setting",
    },
  ]
}

