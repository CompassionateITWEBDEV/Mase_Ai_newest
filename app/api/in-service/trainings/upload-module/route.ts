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

    // Validate file size (500MB max for training materials - increased for videos)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 500MB" },
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
      // Video types
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
    ]
    
    const allowedExtensions = [
      ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".jpg", ".jpeg", ".png",
      // Video extensions
      ".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"
    ]
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG, MP4, WEBM, OGG, MOV, AVI, MKV" },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const storageFileName = `training-modules/${timestamp}-${randomId}-${sanitizedFileName}`

    // Determine if file should use Storage (videos and large files) or base64 (small documents)
    const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].includes(fileExt)
    const fileSizeMB = file.size / (1024 * 1024)
    const useStorage = isVideo || fileSizeMB > 10 // Use storage for videos or files > 10MB

    let fileUrl: string

    if (useStorage) {
      // Use Supabase Storage for videos and large files (faster, no timeout)
      console.log("Uploading to Supabase Storage (for videos/large files):", { storageFileName, fileSize: file.size, fileType: file.type })
      
      try {
        // Try to upload to storage bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('training-files')
          .upload(storageFileName, fileBuffer, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          // If bucket doesn't exist, try 'training-modules' bucket
          if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found')) {
            console.log("Trying 'training-modules' bucket instead...")
            const { data: altUploadData, error: altUploadError } = await supabase.storage
              .from('training-modules')
              .upload(storageFileName, fileBuffer, {
                contentType: file.type,
                upsert: false,
              })

            if (altUploadError) {
              console.warn("Storage upload failed, falling back to base64:", altUploadError.message)
              // Fall back to base64 if storage fails
              const base64 = Buffer.from(fileBuffer).toString('base64')
              fileUrl = `data:${file.type};base64,${base64}`
            } else {
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('training-modules')
                .getPublicUrl(storageFileName)
              fileUrl = urlData.publicUrl
              console.log("✓ File uploaded to storage:", fileUrl)
            }
          } else {
            throw uploadError
          }
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('training-files')
            .getPublicUrl(storageFileName)
          fileUrl = urlData.publicUrl
          console.log("✓ File uploaded to storage:", fileUrl)
        }
      } catch (storageError: any) {
        console.warn("Storage upload failed, falling back to base64:", storageError.message)
        // Fall back to base64 if storage fails
        const base64 = Buffer.from(fileBuffer).toString('base64')
        fileUrl = `data:${file.type};base64,${base64}`
      }
    } else {
      // Use base64 for small documents (compatibility)
      console.log("Using base64 storage for small document:", { fileName: file.name, fileSize: file.size })
      const base64 = Buffer.from(fileBuffer).toString('base64')
      fileUrl = `data:${file.type};base64,${base64}`
    }

    console.log("File upload completed:", { 
      fileName: file.name, 
      fileUrl: fileUrl.substring(0, 100) + "...",
      method: useStorage ? "Storage" : "Base64",
      size: file.size
    })

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

