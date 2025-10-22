import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const employeeId = formData.get("employeeId") as string
    const title = formData.get("title") as string
    const provider = formData.get("provider") as string
    const completionDate = formData.get("completionDate") as string
    const hoursEarned = Number.parseFloat(formData.get("hoursEarned") as string)
    const certificateFile = formData.get("certificate") as File

    if (!employeeId || !title || !provider || !completionDate || !hoursEarned) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Upload the certificate file to cloud storage
    // 2. Store certificate data in database
    // 3. Update employee's CEU hours
    // 4. Check if employee meets requirements
    // 5. Remove work restrictions if compliant

    const certificateId = `CERT_${Date.now()}`
    const certificateNumber = `${provider.substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, "0")}`

    // Mock certificate verification process
    const certificate = {
      id: certificateId,
      employeeId,
      title,
      provider,
      completionDate,
      hoursEarned,
      certificateNumber,
      status: "pending_verification",
      uploadDate: new Date().toISOString(),
      fileName: certificateFile?.name || "certificate.pdf",
      fileSize: certificateFile?.size || 0,
    }

    // Simulate verification delay
    setTimeout(() => {
      console.log(`Certificate ${certificateId} verified and approved`)
      // In real implementation, update database and send notifications
    }, 2000)

    return NextResponse.json({
      success: true,
      certificate,
      message: "Certificate uploaded successfully and is pending verification",
    })
  } catch (error) {
    console.error("Certificate upload error:", error)
    return NextResponse.json({ error: "Failed to upload certificate" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 })
    }

    // Mock employee certificates
    const certificates = [
      {
        id: "CERT-001",
        employeeId,
        title: "Advanced Wound Care Management",
        provider: "American Nurses Association",
        completionDate: "2024-03-15",
        hoursEarned: 8.0,
        certificateNumber: "ANA-2024-001",
        status: "verified",
        uploadDate: "2024-03-16T10:00:00Z",
        verificationDate: "2024-03-17T14:30:00Z",
      },
      {
        id: "CERT-002",
        employeeId,
        title: "Infection Control in Healthcare",
        provider: "CDC Training Institute",
        completionDate: "2024-01-20",
        hoursEarned: 6.0,
        certificateNumber: "CDC-2024-002",
        status: "verified",
        uploadDate: "2024-01-21T09:15:00Z",
        verificationDate: "2024-01-22T11:45:00Z",
      },
    ]

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error("Error fetching certificates:", error)
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}
