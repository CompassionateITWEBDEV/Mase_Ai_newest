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
    const meetingId = searchParams.get("meetingId")

    // Fetch single meeting by ID
    if (meetingId) {
      // Check if it's a sample meeting
      if (meetingId.startsWith("sample-")) {
        const sampleMeetings = getSampleMeetings()
        const meeting = sampleMeetings.find(m => m.id === meetingId)
        if (meeting) {
          return NextResponse.json({ success: true, meeting })
        }
        return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 })
      }

      const { data: meeting, error } = await supabase
        .from("scheduled_meetings")
        .select(`
          *,
          organizer:staff!organizer_id(id, name, email),
          participants:meeting_participants(
            staff:staff(id, name, email),
            status
          )
        `)
        .eq("id", meetingId)
        .single()

      if (error) {
        // Try sample meetings if DB fails
        const sampleMeetings = getSampleMeetings()
        const sampleMeeting = sampleMeetings.find(m => m.id === meetingId || m.id === `sample-${meetingId}`)
        if (sampleMeeting) {
          return NextResponse.json({ success: true, meeting: sampleMeeting })
        }
        return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 })
      }

      // Format single meeting
      const formattedMeeting = {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        agenda: meeting.agenda,
        date: meeting.meeting_date,
        time: formatTime(meeting.start_time),
        duration: `${meeting.duration_minutes} minutes`,
        durationMinutes: meeting.duration_minutes,
        participants: meeting.participants?.map((p: any) => ({
          id: p.staff?.id,
          name: p.staff?.name,
          email: p.staff?.email,
          status: p.status
        })).filter((p: any) => p.id) || [],
        participantNames: meeting.participants?.map((p: any) => p.staff?.name).filter(Boolean) || [],
        type: meeting.meeting_type,
        meetingLink: meeting.meeting_link || `/meeting/${meeting.id}`,
        status: meeting.status,
        organizer: meeting.organizer?.name,
        organizerId: meeting.organizer_id,
        organizerEmail: meeting.organizer?.email,
      }

      return NextResponse.json({ success: true, meeting: formattedMeeting })
    }

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
      durationMinutes: meeting.duration_minutes, // For programmatic use
      participants: meeting.participants?.map((p: any) => ({
        id: p.staff?.id,
        name: p.staff?.name,
        email: p.staff?.email,
        status: p.status
      })).filter((p: any) => p.id) || [],
      participantNames: meeting.participants?.map((p: any) => p.staff?.name).filter(Boolean) || [],
      type: meeting.meeting_type,
      meetingLink: `/meeting/${meeting.id}`,
      status: meeting.status,
      organizer: meeting.organizer?.name,
      organizerId: meeting.organizer_id,
      organizerEmail: meeting.organizer?.email,
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

    // Only title, date, and time are required
    if (!title || !date || !time) {
      return NextResponse.json(
        { success: false, error: "Title, date, and time are required" },
        { status: 400 }
      )
    }

    // Validate organizerId is a valid UUID if provided
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validOrganizerId = organizerId && uuidRegex.test(organizerId) ? organizerId : null

    // Map meeting type to valid database values
    // Database constraint allows: general, training, evaluation, urgent
    const validMeetingTypes = ["general", "training", "evaluation", "urgent"]
    let dbMeetingType = meetingType || "general"
    
    // Map common types to valid database values
    if (dbMeetingType === "meeting" || dbMeetingType === "planning" || dbMeetingType === "orientation") {
      dbMeetingType = "general"
    }
    
    // Ensure it's a valid type
    if (!validMeetingTypes.includes(dbMeetingType)) {
      dbMeetingType = "general"
    }

    // Generate meeting link - will be updated after insert with actual ID
    const tempMeetingId = Date.now().toString()

    // Prepare insert data
    const insertData: any = {
      title,
      description,
      agenda,
      meeting_date: date,
      start_time: time,
      duration_minutes: durationMinutes || 30,
      meeting_type: dbMeetingType,
      meeting_link: `/meeting/${tempMeetingId}`,
      is_recurring: isRecurring || false,
      recurrence_pattern: recurrencePattern,
    }

    // Only add organizer_id if it's a valid UUID
    if (validOrganizerId) {
      insertData.organizer_id = validOrganizerId
    }

    // Create meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("scheduled_meetings")
      .insert(insertData)
      .select()
      .single()

    if (meetingError) throw meetingError

    // Update meeting link with actual meeting ID
    const actualMeetingLink = `/meeting/${meeting.id}`
    await supabase
      .from("scheduled_meetings")
      .update({ meeting_link: actualMeetingLink })
      .eq("id", meeting.id)

    // Add participants - only valid UUIDs
    if (participantIds && participantIds.length > 0) {
      const validParticipantIds = participantIds.filter((id: string) => uuidRegex.test(id))
      if (validParticipantIds.length > 0) {
        const participantRecords = validParticipantIds.map((staffId: string) => ({
          meeting_id: meeting.id,
          staff_id: staffId,
          status: "pending",
        }))

        await supabase.from("meeting_participants").insert(participantRecords)
      }
    }

    return NextResponse.json({
      success: true,
      meeting: {
        ...meeting,
        meetingLink: actualMeetingLink,
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
      durationMinutes: 30,
      participants: [
        { id: "sample-1", name: "Dr. Wilson", email: "wilson@example.com" },
        { id: "sample-2", name: "Sarah Johnson", email: "sarah@example.com" },
        { id: "sample-3", name: "Michael Chen", email: "michael@example.com" },
      ],
      participantNames: ["Dr. Wilson", "Sarah Johnson", "Michael Chen"],
      type: "recurring",
      meetingLink: "/meeting/sample-1",
      status: "scheduled",
      agenda: "Review weekly goals, discuss patient assignments, address any concerns",
      organizer: "Dr. Wilson",
      organizerId: "sample-1",
    },
    {
      id: "sample-2",
      title: "HIPAA Compliance Training",
      date: nextWeek.toISOString().split("T")[0],
      time: "02:00 PM",
      duration: "60 minutes",
      durationMinutes: 60,
      participants: [
        { id: "sample-1", name: "Dr. Wilson", email: "wilson@example.com" },
        { id: "sample-2", name: "Sarah Johnson", email: "sarah@example.com" },
        { id: "sample-3", name: "Michael Chen", email: "michael@example.com" },
        { id: "sample-4", name: "Emily Davis", email: "emily@example.com" },
      ],
      participantNames: ["Dr. Wilson", "Sarah Johnson", "Michael Chen", "Emily Davis"],
      type: "training",
      meetingLink: "/meeting/sample-2",
      status: "scheduled",
      agenda: "Annual HIPAA compliance training and Q&A session",
      organizer: "Emily Davis",
      organizerId: "sample-4",
    },
    {
      id: "sample-3",
      title: "Performance Review - Sarah Johnson",
      date: nextWeek.toISOString().split("T")[0],
      time: "10:00 AM",
      duration: "45 minutes",
      durationMinutes: 45,
      participants: [
        { id: "sample-1", name: "Dr. Wilson", email: "wilson@example.com" },
        { id: "sample-2", name: "Sarah Johnson", email: "sarah@example.com" },
      ],
      participantNames: ["Dr. Wilson", "Sarah Johnson"],
      type: "evaluation",
      meetingLink: "/meeting/sample-3",
      status: "scheduled",
      agenda: "Annual performance evaluation and goal setting",
      organizer: "Dr. Wilson",
      organizerId: "sample-1",
    },
  ]
}

