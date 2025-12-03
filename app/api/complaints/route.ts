import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ComplaintData {
  type: string
  subject: string
  description: string
  location?: string
  dateOfIncident?: string
  urgency?: string
  anonymous?: boolean
  witnessesPresent?: boolean
  witnessDetails?: string
  actionsTaken?: string
  desiredOutcome?: string
  submittedByName?: string
  submittedByRole?: string
}

// GET - Fetch complaints
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const userId = searchParams.get("userId")
    const complaintId = searchParams.get("id")
    const trackingNumber = searchParams.get("trackingNumber")

    let query = supabase
      .from("hr_complaints")
      .select(`
        *,
        complaint_notes (
          id,
          note,
          action_type,
          author_name,
          author_role,
          created_at
        )
      `)
      .order("created_at", { ascending: false })

    // Filter by specific complaint ID
    if (complaintId) {
      query = query.eq("id", complaintId)
    }

    // Filter by tracking number (for anonymous tracking)
    if (trackingNumber) {
      query = query.eq("tracking_number", trackingNumber)
    }

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Filter by type
    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    // Filter by user (for "my complaints")
    if (userId) {
      query = query.eq("submitted_by_id", userId)
    }

    const { data: complaints, error } = await query

    if (error) {
      console.error("Error fetching complaints:", error)
      return NextResponse.json(
        { success: false, message: `Failed to fetch complaints: ${error.message}` },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedComplaints = complaints?.map((complaint) => ({
      id: complaint.complaint_id,
      dbId: complaint.id,
      type: complaint.type,
      subject: complaint.subject,
      description: complaint.description,
      location: complaint.location,
      dateOfIncident: complaint.date_of_incident,
      urgency: complaint.urgency,
      anonymous: complaint.anonymous,
      submittedBy: complaint.anonymous ? "Anonymous" : complaint.submitted_by_name,
      submittedByRole: complaint.submitted_by_role,
      status: complaint.status,
      assignedTo: complaint.assigned_to_name || "Pending Assignment",
      assignedToRole: complaint.assigned_to_role,
      submittedDate: complaint.submitted_date,
      lastUpdated: complaint.last_updated,
      resolution: complaint.resolution,
      resolutionDate: complaint.resolution_date,
      trackingNumber: complaint.tracking_number,
      witnessesPresent: complaint.witnesses_present,
      witnessDetails: complaint.witness_details,
      actionsTaken: complaint.actions_taken,
      desiredOutcome: complaint.desired_outcome,
      investigationNotes: complaint.complaint_notes?.map((note: any) => ({
        date: new Date(note.created_at).toISOString().split("T")[0],
        note: note.note,
        investigator: note.author_name,
        actionType: note.action_type,
      })) || [],
    }))

    return NextResponse.json({
      success: true,
      complaints: transformedComplaints,
      total: transformedComplaints?.length || 0,
    })
  } catch (error) {
    console.error("Error in complaints GET:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch complaints" },
      { status: 500 }
    )
  }
}

// POST - Create new complaint
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data: ComplaintData = await request.json()

    // Validate required fields
    if (!data.type || !data.subject || !data.description) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: type, subject, description" },
        { status: 400 }
      )
    }

    // Insert complaint
    const { data: complaint, error } = await supabase
      .from("hr_complaints")
      .insert({
        type: data.type,
        subject: data.subject,
        description: data.description,
        location: data.location || null,
        date_of_incident: data.dateOfIncident || null,
        urgency: data.urgency || "medium",
        anonymous: data.anonymous || false,
        witnesses_present: data.witnessesPresent || false,
        witness_details: data.witnessDetails || null,
        actions_taken: data.actionsTaken || null,
        desired_outcome: data.desiredOutcome || null,
        submitted_by_name: data.anonymous ? "Anonymous" : (data.submittedByName || "Unknown"),
        submitted_by_role: data.anonymous ? null : data.submittedByRole,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating complaint:", error)
      return NextResponse.json(
        { success: false, message: `Failed to create complaint: ${error.message}` },
        { status: 500 }
      )
    }

    // Add initial note
    await supabase.from("complaint_notes").insert({
      complaint_id: complaint.id,
      note: data.anonymous 
        ? "Anonymous complaint received and logged" 
        : "Complaint received and logged",
      action_type: "received",
      author_name: "System",
      author_role: "Auto",
    })

    // Determine auto-routing based on type
    let assignedTo = "Patient Care Coordinator"
    let assignedToRole = "Coordinator"
    
    switch (data.type) {
      case "harassment":
      case "discrimination":
      case "retaliation":
        assignedTo = "Sarah Mitchell"
        assignedToRole = "HR Director"
        break
      case "safety":
        assignedTo = "Jennifer Davis"
        assignedToRole = "Safety Officer"
        break
      case "ethics":
      case "policy-violation":
        assignedTo = "David Wilson"
        assignedToRole = "Compliance Officer"
        break
      default:
        assignedTo = "Michael Rodriguez"
        assignedToRole = "HR Manager"
    }

    // Auto-assign based on type
    if (data.urgency === "high") {
      await supabase
        .from("hr_complaints")
        .update({
          assigned_to_name: assignedTo,
          assigned_to_role: assignedToRole,
          status: "under-investigation",
        })
        .eq("id", complaint.id)

      // Add assignment note
      await supabase.from("complaint_notes").insert({
        complaint_id: complaint.id,
        note: `High priority complaint auto-assigned to ${assignedTo} (${assignedToRole})`,
        action_type: "assigned",
        author_name: "System",
        author_role: "Auto",
      })
    }

    console.log(`[Complaints] New complaint created: ${complaint.complaint_id}`)

    return NextResponse.json({
      success: true,
      message: "Complaint submitted successfully",
      complaintId: complaint.complaint_id,
      trackingNumber: complaint.tracking_number,
      assignedTo: data.urgency === "high" ? assignedTo : "Pending Assignment",
    })
  } catch (error) {
    console.error("Error in complaints POST:", error)
    return NextResponse.json(
      { success: false, message: "Failed to submit complaint" },
      { status: 500 }
    )
  }
}

// PUT - Update complaint (assign, update status, add resolution)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json()
    const { id, action, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Complaint ID is required" },
        { status: 400 }
      )
    }

    // Get current complaint
    const { data: currentComplaint, error: fetchError } = await supabase
      .from("hr_complaints")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !currentComplaint) {
      return NextResponse.json(
        { success: false, message: "Complaint not found" },
        { status: 404 }
      )
    }

    let updatePayload: any = {}
    let noteText = ""
    let noteAction = ""

    switch (action) {
      case "assign":
        updatePayload = {
          assigned_to_name: updateData.assignedToName,
          assigned_to_role: updateData.assignedToRole,
          assigned_to_id: updateData.assignedToId || null,
          status: "under-investigation",
        }
        noteText = `Complaint assigned to ${updateData.assignedToName} (${updateData.assignedToRole})`
        noteAction = "assigned"
        break

      case "update-status":
        updatePayload = { status: updateData.status }
        noteText = `Status updated to: ${updateData.status}`
        noteAction = "status-update"
        break

      case "resolve":
        updatePayload = {
          status: "resolved",
          resolution: updateData.resolution,
          resolution_date: new Date().toISOString(),
        }
        noteText = `Complaint resolved: ${updateData.resolution}`
        noteAction = "resolved"
        break

      case "close":
        updatePayload = { status: "closed" }
        noteText = "Complaint closed"
        noteAction = "closed"
        break

      case "add-note":
        // Just add a note without updating the complaint
        await supabase.from("complaint_notes").insert({
          complaint_id: id,
          note: updateData.note,
          action_type: updateData.noteType || "note",
          author_name: updateData.authorName || "HR Staff",
          author_role: updateData.authorRole || "HR",
        })
        return NextResponse.json({
          success: true,
          message: "Note added successfully",
        })

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        )
    }

    // Update complaint
    const { error: updateError } = await supabase
      .from("hr_complaints")
      .update(updatePayload)
      .eq("id", id)

    if (updateError) {
      console.error("Error updating complaint:", updateError)
      return NextResponse.json(
        { success: false, message: `Failed to update complaint: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Add note for the action
    if (noteText) {
      await supabase.from("complaint_notes").insert({
        complaint_id: id,
        note: noteText,
        action_type: noteAction,
        author_name: updateData.authorName || "HR Staff",
        author_role: updateData.authorRole || "HR",
      })
    }

    console.log(`[Complaints] Complaint ${currentComplaint.complaint_id} updated: ${action}`)

    return NextResponse.json({
      success: true,
      message: `Complaint ${action} successfully`,
    })
  } catch (error) {
    console.error("Error in complaints PUT:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update complaint" },
      { status: 500 }
    )
  }
}

// DELETE - Delete complaint (admin only)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Complaint ID is required" },
        { status: 400 }
      )
    }

    // Delete complaint (cascade will delete notes and attachments)
    const { error } = await supabase
      .from("hr_complaints")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting complaint:", error)
      return NextResponse.json(
        { success: false, message: `Failed to delete complaint: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`[Complaints] Complaint ${id} deleted`)

    return NextResponse.json({
      success: true,
      message: "Complaint deleted successfully",
    })
  } catch (error) {
    console.error("Error in complaints DELETE:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete complaint" },
      { status: 500 }
    )
  }
}


