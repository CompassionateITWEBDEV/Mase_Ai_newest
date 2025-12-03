import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// GET - Get download URL for a document
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      )
    }

    // Get document from database
    const { data: document, error: dbError } = await supabase
      .from("staff_documents")
      .select("*")
      .eq("id", documentId)
      .single()

    if (dbError || !document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if file URL exists
    if (!document.file_url) {
      return NextResponse.json(
        { success: false, error: "No file attached to this document" },
        { status: 404 }
      )
    }

    // Check if it's a placeholder URL
    if (document.file_url.startsWith("local-storage/") || document.file_url.startsWith("pending-upload/")) {
      return NextResponse.json(
        { success: false, error: "File not uploaded to storage" },
        { status: 404 }
      )
    }

    // If it's already a signed URL or public URL, return it
    if (document.file_url.includes("supabase") || document.file_url.startsWith("http")) {
      // Try to get a fresh signed URL
      const filePath = extractFilePath(document.file_url)
      
      if (filePath) {
        const { data: signedUrlData, error: signError } = await supabase.storage
          .from("staff-documents")
          .createSignedUrl(filePath, 60 * 60) // 1 hour expiry

        if (!signError && signedUrlData?.signedUrl) {
          return NextResponse.json({
            success: true,
            downloadUrl: signedUrlData.signedUrl,
            fileName: document.file_name || document.document_type,
            contentType: getContentType(document.file_name),
          })
        }
      }

      // Fallback to existing URL
      return NextResponse.json({
        success: true,
        downloadUrl: document.file_url,
        fileName: document.file_name || document.document_type,
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid file URL" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Helper function to extract file path from Supabase URL
function extractFilePath(url: string): string | null {
  try {
    // Handle signed URLs
    if (url.includes("/object/sign/")) {
      const match = url.match(/\/object\/sign\/staff-documents\/([^?]+)/)
      return match ? decodeURIComponent(match[1]) : null
    }
    
    // Handle public URLs
    if (url.includes("/object/public/")) {
      const match = url.match(/\/object\/public\/staff-documents\/([^?]+)/)
      return match ? decodeURIComponent(match[1]) : null
    }

    // Handle direct storage paths
    if (url.includes("staff-documents/")) {
      const match = url.match(/staff-documents\/(.+)/)
      return match ? decodeURIComponent(match[1]) : null
    }

    return null
  } catch {
    return null
  }
}

// Helper function to get content type from filename
function getContentType(fileName: string | null): string {
  if (!fileName) return "application/octet-stream"
  
  const ext = fileName.split(".").pop()?.toLowerCase()
  const contentTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }
  
  return contentTypes[ext || ""] || "application/octet-stream"
}
