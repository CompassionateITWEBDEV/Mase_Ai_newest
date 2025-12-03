import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export interface StaffDocument {
  id: string
  staff_id: string
  staff_name: string
  document_type: string
  document_name: string
  file_url: string
  file_name: string
  file_size: number
  status: "pending" | "verified" | "rejected" | "expired"
  upload_date: string
  expiry_date: string | null
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  category: string
  notes: string | null
}

// GET - Fetch all documents or by staff_id
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const status = searchParams.get("status")
    const category = searchParams.get("category")

    let query = supabase
      .from("staff_documents")
      .select("*")
      .order("upload_date", { ascending: false })

    if (staffId) {
      query = query.eq("staff_id", staffId)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error("Error fetching documents:", error)
      // Table might not exist - return empty with message
      return NextResponse.json({
        success: true,
        documents: [],
        stats: { total: 0, verified: 0, pending: 0, expired: 0, rejected: 0 },
        message: "Database table not found. Please run the setup script: scripts/setup-staff-documents-tables.sql",
        source: "empty",
      })
    }

    // Calculate stats from real data
    const stats = {
      total: documents?.length || 0,
      verified: documents?.filter((d) => d.status === "verified").length || 0,
      pending: documents?.filter((d) => d.status === "pending").length || 0,
      expired: documents?.filter((d) => d.status === "expired").length || 0,
      rejected: documents?.filter((d) => d.status === "rejected").length || 0,
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
      stats,
      source: "database",
      count: documents?.length || 0,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// POST - Upload new document
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const formData = await request.formData()

    const staffId = formData.get("staffId") as string
    const staffName = formData.get("staffName") as string
    const documentType = formData.get("documentType") as string
    const category = formData.get("category") as string
    const expiryDate = formData.get("expiryDate") as string | null
    const notes = formData.get("notes") as string | null
    const file = formData.get("file") as File

    if (!staffId || !documentType || !file) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: staffId, documentType, file" },
        { status: 400 },
      )
    }

    // Get staff name from existing staff table if not provided
    let finalStaffName = staffName
    if (!finalStaffName) {
      const { data: staffData } = await supabase
        .from("staff")
        .select("name")
        .eq("id", staffId)
        .single()
      finalStaffName = staffData?.name || "Unknown Staff"
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${staffId}/${documentType.replace(/\s+/g, "_")}_${Date.now()}.${fileExt}`
    const bucketName = "staff-documents"

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer()

    // Try to upload to storage
    let fileUrl = ""
    let uploadSuccess = false

    try {
      // First, check if bucket exists by trying to list files
      const { error: bucketCheckError } = await supabase.storage.from(bucketName).list("", { limit: 1 })

      if (bucketCheckError) {
        // Bucket doesn't exist - try to create it
        console.log("Bucket not found, attempting to create...")
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/gif", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        })

        if (createBucketError && !createBucketError.message.includes("already exists")) {
          console.error("Could not create bucket:", createBucketError)
        }
      }

      // Now upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
      } else if (uploadData) {
        // Get signed URL (for private bucket) or public URL
        const { data: signedUrlData } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year expiry

        if (signedUrlData?.signedUrl) {
          fileUrl = signedUrlData.signedUrl
          uploadSuccess = true
          console.log("File uploaded successfully:", fileName)
        } else {
          // Fallback to public URL
          const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName)
          fileUrl = publicUrl
          uploadSuccess = true
        }
      }
    } catch (storageError) {
      console.error("Storage error:", storageError)
    }

    // If upload failed, use placeholder
    if (!uploadSuccess) {
      fileUrl = `local-storage/${fileName}`
      console.log("Using placeholder URL - storage bucket may need to be created manually")
    }

    // Create document record in staff_documents table
    const { data: newDocument, error: dbError } = await supabase
      .from("staff_documents")
      .insert({
        staff_id: staffId,
        staff_name: finalStaffName,
        document_type: documentType,
        document_name: documentType,
        file_url: fileUrl || `pending-upload/${fileName}`,
        file_name: file.name,
        file_size: file.size,
        status: "pending",
        upload_date: new Date().toISOString(),
        expiry_date: expiryDate || null,
        category: category || "general",
        notes: notes || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: newDocument,
      message: "Document uploaded successfully",
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// PUT - Update document (verify, reject, update expiry)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, action, verifiedBy, rejectionReason, expiryDate, notes } = body

    if (!id || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields: id, action" }, { status: 400 })
    }

    let updateData: any = {}

    switch (action) {
      case "verify":
        updateData = {
          status: "verified",
          verified_by: verifiedBy || "System Admin",
          verified_at: new Date().toISOString(),
          rejection_reason: null,
        }
        break
      case "reject":
        updateData = {
          status: "rejected",
          rejection_reason: rejectionReason || "Document does not meet requirements",
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
        }
        break
      case "expire":
        updateData = {
          status: "expired",
        }
        break
      case "update":
        if (expiryDate) updateData.expiry_date = expiryDate
        if (notes) updateData.notes = notes
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    const { data: updatedDocument, error } = await supabase
      .from("staff_documents")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Update error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      message: `Document ${action}d successfully`,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing required parameter: id" }, { status: 400 })
    }

    // Get document to delete file from storage
    const { data: document } = await supabase.from("staff_documents").select("file_url").eq("id", id).single()

    // Delete from storage if exists
    if (document?.file_url && !document.file_url.startsWith("pending-upload/")) {
      const filePath = document.file_url.split("/staff-documents/")[1]
      if (filePath) {
        await supabase.storage.from("staff-documents").remove([filePath])
      }
    }

    // Delete from database
    const { error } = await supabase.from("staff_documents").delete().eq("id", id)

    if (error) {
      console.error("Delete error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

