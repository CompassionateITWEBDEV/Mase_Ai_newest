import { type NextRequest, NextResponse } from "next/server"
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
    const supabase = getServiceClient()
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

    // Check if employee exists
    const { data: employee } = await supabase
      .from("staff")
      .select("id, name")
      .eq("id", employeeId)
      .single()

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Generate certificate number
    const certificateNumber = `CERT-${Date.now()}`
    
    let certificateUrl = ""

    // Upload certificate file to Supabase storage if provided
    if (certificateFile && certificateFile.size > 0) {
      const fileExt = certificateFile.name.split(".").pop()
      const fileName = `${employeeId}/${certificateNumber}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(fileName, certificateFile, {
          contentType: certificateFile.type,
          upsert: false,
        })

      if (uploadError) {
        console.error("Error uploading file:", uploadError)
        // Continue without file - we can still store the certificate info
      } else {
        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from("certificates")
          .getPublicUrl(fileName)
        
        certificateUrl = publicUrl.publicUrl
      }
    }

    // Create a "manual" training entry for external certificates
    const { data: manualTraining, error: trainingError } = await supabase
      .from("in_service_trainings")
      .insert({
        training_code: `EXTERNAL-${Date.now()}`,
        title: title,
        category: "Professional Development",
        type: "online_course",
        duration: Math.round(parseFloat(hoursEarned.toString()) * 60),
        ceu_hours: parseFloat(hoursEarned.toString()),
        description: `External certificate from ${provider}`,
        accreditation: provider,
        status: "active",
        mandatory: false,
      })
      .select()
      .single()

    if (trainingError || !manualTraining) {
      console.error("Error creating training record:", trainingError)
      return NextResponse.json(
        { error: "Failed to create training record" },
        { status: 500 }
      )
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("in_service_enrollments")
      .insert({
        training_id: manualTraining.id,
        employee_id: employeeId,
        enrollment_date: completionDate,
        start_date: completionDate,
        status: "completed",
        progress: 100,
      })
      .select()
      .single()

    if (enrollmentError || !enrollment) {
      console.error("Error creating enrollment record:", enrollmentError)
      return NextResponse.json(
        { error: "Failed to create enrollment record" },
        { status: 500 }
      )
    }

    // Create completion record
    const { data: completion, error: completionError } = await supabase
      .from("in_service_completions")
      .insert({
        enrollment_id: enrollment.id,
        training_id: manualTraining.id,
        employee_id: employeeId,
        completion_date: completionDate,
        score: 100,
        ceu_hours_earned: parseFloat(hoursEarned.toString()),
        certificate_number: certificateNumber,
        certificate_url: certificateUrl,
      })
      .select()
      .single()

    if (completionError) {
      console.error("Error creating completion:", completionError)
      return NextResponse.json(
        { error: "Failed to create completion record" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Certificate uploaded successfully",
      certificate: {
        id: completion.id,
        employeeId: employeeId,
        employeeName: employee.name,
        title: title,
        provider: provider,
        completionDate: completionDate,
        hoursEarned: parseFloat(hoursEarned.toString()),
        certificateNumber: certificateNumber,
        status: "verified",
        certificateUrl: certificateUrl,
        uploadDate: new Date().toISOString(),
        fileName: certificateFile?.name || "",
      },
    })
  } catch (error) {
    console.error("Certificate upload error:", error)
    return NextResponse.json({ error: "Failed to upload certificate" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")

    // Build query
    let query = supabase
      .from("in_service_completions")
      .select(`
        *,
        in_service_trainings (title, category, accreditation)
      `)
      .order("completion_date", { ascending: false })

    // Filter by employee if provided
    if (employeeId) {
      query = query.eq("employee_id", employeeId)
    }

    const { data: certificates, error } = await query

    if (error) {
      console.error("Error fetching certificates:", error)
      return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
    }

    // Get employee names from staff table
    const employeeIds = Array.from(new Set(certificates.map((c: any) => c.employee_id)))
    const { data: staffMembers } = await supabase
      .from("staff")
      .select("id, name")
      .in("id", employeeIds)

    // Map certificates with employee names
    const formattedCertificates = certificates.map((cert: any) => {
      const staff = staffMembers?.find((s: any) => s.id === cert.employee_id)
      return {
        id: cert.id,
        employeeId: cert.employee_id,
        employeeName: staff?.name || "Unknown Employee",
        title: cert.in_service_trainings?.title || "Unknown Training",
        provider: cert.in_service_trainings?.accreditation || "Internal Training",
        completionDate: new Date(cert.completion_date).toISOString().split("T")[0],
        hoursEarned: parseFloat(cert.ceu_hours_earned) || 0,
        certificateNumber: cert.certificate_number || "",
        status: "verified",
        certificateUrl: cert.certificate_url || "",
        uploadDate: cert.created_at || "",
        verificationDate: cert.created_at || "",
      }
    })

    return NextResponse.json({ success: true, certificates: formattedCertificates })
  } catch (error) {
    console.error("Error fetching certificates:", error)
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}
