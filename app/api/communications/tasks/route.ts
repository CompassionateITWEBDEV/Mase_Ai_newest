import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch task assignments
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const status = searchParams.get("status")
    const assignedBy = searchParams.get("assignedBy")

    let query = supabase
      .from("task_assignments")
      .select(`
        *,
        assignee:staff!assigned_to(id, name, email),
        assigner:staff!assigned_by(id, name, email),
        comments:task_comments(
          id,
          content,
          created_at,
          commenter:staff!commenter_id(id, name)
        )
      `)
      .order("created_at", { ascending: false })

    // Filter by assignee
    if (staffId) {
      query = query.eq("assigned_to", staffId)
    }

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Filter by assigner
    if (assignedBy) {
      query = query.eq("assigned_by", assignedBy)
    }

    const { data: tasks, error } = await query

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          tasks: getSampleTasks(),
          message: "Using sample data - run setup-communications-tables.sql",
        })
      }
      throw error
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        success: true,
        tasks: getSampleTasks(),
        message: "No tasks found - showing sample data",
      })
    }

    // Format tasks
    const formattedTasks = tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      assignedTo: task.assignee?.name || "Unassigned",
      assignedToId: task.assigned_to,
      assignedBy: task.assigner?.name || "System",
      assignedById: task.assigned_by,
      dueDate: task.due_date,
      priority: task.priority,
      status: task.status,
      createdAt: task.created_at,
      completedAt: task.completed_at,
      comments: task.comments || [],
    }))

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
    })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({
      success: true,
      tasks: getSampleTasks(),
      error: error instanceof Error ? error.message : "Failed to fetch tasks",
    })
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { title, description, assignedTo, assignedBy, dueDate, priority } = body

    if (!title || !assignedTo) {
      return NextResponse.json(
        { success: false, error: "Title and assignee are required" },
        { status: 400 }
      )
    }

    // Validate assignedTo is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(assignedTo)) {
      return NextResponse.json(
        { success: false, error: "Invalid assignee ID format" },
        { status: 400 }
      )
    }

    // Prepare insert data - assignedBy is optional
    const insertData: any = {
      title,
      description,
      assigned_to: assignedTo,
      due_date: dueDate || null,
      priority: priority || "medium",
      status: "pending",
    }

    // Only add assigned_by if it's a valid UUID
    if (assignedBy && uuidRegex.test(assignedBy)) {
      insertData.assigned_by = assignedBy
    }

    const { data, error } = await supabase
      .from("task_assignments")
      .insert(insertData)
      .select(`
        *,
        assignee:staff!assigned_to(id, name, email),
        assigner:staff!assigned_by(id, name, email)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      task: data,
    })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 500 }
    )
  }
}

// PUT - Update a task
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { id, status, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      )
    }

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from("task_assignments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      task: data,
    })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update task" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase.from("task_assignments").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Task deleted",
    })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete task" },
      { status: 500 }
    )
  }
}

// Sample tasks for when database is not set up
function getSampleTasks() {
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  return [
    {
      id: "sample-1",
      title: "Complete HIPAA Training Module",
      assignedTo: "Sarah Johnson",
      assignedBy: "Dr. Wilson",
      dueDate: nextWeek.toISOString().split("T")[0],
      priority: "high",
      status: "in_progress",
      description: "Complete the annual HIPAA privacy and security training module",
    },
    {
      id: "sample-2",
      title: "Review Patient Care Protocols",
      assignedTo: "Michael Chen",
      assignedBy: "Quality Director",
      dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: "medium",
      status: "pending",
      description: "Review updated patient care protocols and provide feedback",
    },
    {
      id: "sample-3",
      title: "Prepare Monthly Report",
      assignedTo: "Emily Davis",
      assignedBy: "HR Manager",
      dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: "low",
      status: "completed",
      description: "Compile monthly performance metrics and compliance data",
    },
  ]
}

