import { NextRequest, NextResponse } from "next/server"
import { pdfcoService } from "@/lib/pdfco-service"
import { openaiReferralExtractor } from "@/lib/openai-referral-extractor"
import { createAdminClient } from "@/lib/supabase/server"

export const maxDuration = 300 // Allow up to 5 minutes for large PDF processing
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Processing document upload ===")

    // Get the uploaded file
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    console.log("File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF, PNG, or JPG files only." },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Step 1: Perform OCR using PDF.co
    console.log("Step 1: Performing OCR...")
    let ocrResult
    
    if (file.type === "application/pdf") {
      ocrResult = await pdfcoService.processPDF(buffer, file.name)
    } else {
      ocrResult = await pdfcoService.processImage(buffer, file.name)
    }

    if (!ocrResult.success || !ocrResult.text) {
      return NextResponse.json(
        {
          error: "OCR processing failed",
          details: ocrResult.error || "Could not extract text from document",
        },
        { status: 500 }
      )
    }

    console.log("✅ OCR successful, text length:", ocrResult.text.length)

    // Step 2: Extract referral data using OpenAI
    console.log("Step 2: Extracting referral data with AI...")
    const extractedData = await openaiReferralExtractor.extractWithFallback(
      ocrResult.text
    )

    console.log("✅ Data extracted:", {
      patient: extractedData.patientName,
      confidence: extractedData.confidence,
    })

    // Step 3: Create referral in database
    console.log("Step 3: Creating referral in database...")
    const supabase = createAdminClient()

    // Generate unique referral number
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    const referralNumber = `REF-FAX-${timestamp}-${randomNum}`

    const referralData = {
      referral_number: referralNumber,
      patient_name: extractedData.patientName,
      referral_date: new Date().toISOString().split("T")[0],
      referral_source: "Fax Upload",
      referral_type: "standard", // Required field
      clinical_summary: extractedData.diagnosis, // Required field - use diagnosis as summary
      diagnosis: extractedData.diagnosis,
      insurance_provider: extractedData.insuranceProvider,
      insurance_id: extractedData.insuranceId,
      status: "New",
      ai_recommendation: extractedData.confidence > 70 ? "Review" : "Review",
      ai_reason: `Automated extraction from fax document (${extractedData.confidence}% confidence). ${
        extractedData.additionalNotes || "Please review and verify all information."
      }${extractedData.phoneNumber ? ` Phone: ${extractedData.phoneNumber}` : ""}${extractedData.address ? ` Address: ${extractedData.address}` : ""}`,
    }

    console.log("Inserting referral:", referralData)

    const { data: insertedReferral, error: insertError } = await supabase
      .from("referrals")
      .insert(referralData)
      .select()
      .single()

    if (insertError) {
      console.error("❌ Database error:", insertError)
      console.error("Error details:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      })
      console.error("Data attempted to insert:", referralData)
      
      return NextResponse.json(
        {
          error: "Failed to create referral in database",
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        },
        { status: 500 }
      )
    }

    console.log("✅ Referral created successfully:", insertedReferral.id)

    // Return success with extracted data and referral
    return NextResponse.json(
      {
        success: true,
        message: "Document processed successfully",
        referral: insertedReferral,
        extractedData: {
          ...extractedData,
          ocrText: ocrResult.text.substring(0, 500), // First 500 chars for preview
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Document processing error:", error)
    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

