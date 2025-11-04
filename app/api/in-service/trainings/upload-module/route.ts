import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Helper to get service role client (bypasses RLS)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== POST /api/in-service/trainings/upload-module - START ===")
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string || "training_module"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (50MB max for training materials)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 50MB" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "image/jpeg",
      "image/png",
    ]
    
    const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".jpg", ".jpeg", ".png"]
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG files are allowed." },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer()

    // Try to upload to Supabase Storage first
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const storageFileName = `training-modules/${timestamp}-${randomId}-${sanitizedFileName}`

    console.log("Attempting to upload file to storage:", { storageFileName, fileSize: file.size, fileType: file.type })

    // ALWAYS use base64 storage for now to avoid bucket issues
    // This ensures files are always accessible regardless of storage bucket configuration
    console.log("Using base64 storage for reliable file access")
    const base64 = Buffer.from(fileBuffer).toString('base64')
    const fileUrl = `data:${file.type};base64,${base64}`
    console.log("File stored as base64:")
    console.log("- File name:", file.name)
    console.log("- File size:", file.size, "bytes")
    console.log("- Base64 length:", base64.length, "characters")
    console.log("- MIME type:", file.type)
    console.log("- FileUrl starts with:", fileUrl.substring(0, 50) + "...")
    
    // NOTE: Storage bucket upload is disabled to prevent "Bucket not found" errors
    // If you want to use storage buckets, you must:
    // 1. Create the bucket in Supabase Storage dashboard
    // 2. Make it public (or configure proper RLS policies)
    // 3. Uncomment the storage upload code below

    console.log("File upload completed:", { fileName: file.name, fileUrl: fileUrl.substring(0, 100) + "..." })

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl: fileUrl,
      fileSize: file.size,
      fileType: file.type,
      message: "Module file uploaded successfully",
    })
  } catch (error: any) {
    console.error("=== POST /api/in-service/trainings/upload-module - ERROR ===")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)

    return NextResponse.json(
      { error: "Failed to upload module file: " + (error.message || "Unknown error") },
      { status: 500 }
    )
  }
}

