import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const uploadType = formData.get("type") as string
    const priority = formData.get("priority") as string
    const patientId = formData.get("patientId") as string
    const notes = formData.get("notes") as string

    // Validate required fields
    if (!files.length || !uploadType || !priority) {
      return NextResponse.json({ error: "Missing required fields: files, type, or priority" }, { status: 400 })
    }

    // Validate file types
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/tiff",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    const invalidFiles = files.filter((file) => !allowedTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { error: `Invalid file types: ${invalidFiles.map((f) => f.name).join(", ")}` },
        { status: 400 },
      )
    }

    // Validate file sizes (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    const oversizedFiles = files.filter((file) => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        { error: `Files too large: ${oversizedFiles.map((f) => f.name).join(", ")}` },
        { status: 400 },
      )
    }

    // Process each file
    const uploadResults = []

    for (const file of files) {
      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split(".").pop()
      const uniqueFilename = `${uploadType}_${timestamp}_${randomId}.${fileExtension}`

      // In a real application, you would:
      // 1. Save file to cloud storage (AWS S3, Google Cloud, etc.)
      // 2. Save metadata to database
      // 3. Trigger AI processing workflow

      // For demo purposes, we'll simulate the process
      const uploadRecord = {
        id: `upload_${timestamp}_${randomId}`,
        originalName: file.name,
        filename: uniqueFilename,
        size: file.size,
        type: file.type,
        uploadType,
        priority,
        patientId: patientId || null,
        notes: notes || null,
        status: "uploaded",
        uploadedAt: new Date().toISOString(),
        uploadedBy: "current_user_id", // Would come from authentication
      }

      uploadResults.push(uploadRecord)

      // Trigger AI processing (in real app, this would be a background job)
      await triggerAIProcessing(uploadRecord)

      // Send notifications based on priority
      if (priority === "urgent") {
        await sendUrgentNotification(uploadRecord)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${files.length} file(s)`,
      uploads: uploadResults,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error during file upload" }, { status: 500 })
  }
}

async function triggerAIProcessing(uploadRecord: any) {
  // In a real application, this would trigger a background job
  // For demo, we'll make a call to the processing endpoint
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/oasis-upload/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId: uploadRecord.id }),
    })

    if (!response.ok) {
      console.error("Failed to trigger AI processing")
    }
  } catch (error) {
    console.error("Error triggering AI processing:", error)
  }
}

async function sendUrgentNotification(uploadRecord: any) {
  try {
    // Send email notification for urgent uploads
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/urgent-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadId: uploadRecord.id,
        uploadType: uploadRecord.uploadType,
        filename: uploadRecord.originalName,
        patientId: uploadRecord.patientId,
      }),
    })

    if (!response.ok) {
      console.error("Failed to send urgent notification")
    }
  } catch (error) {
    console.error("Error sending urgent notification:", error)
  }
}
