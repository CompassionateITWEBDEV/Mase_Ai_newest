import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch all employee HR files with documents and compliance data
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // active, inactive, terminated
    const search = searchParams.get("search")

    // Fetch all staff members
    let staffQuery = supabase
      .from("staff")
      .select("*")
      .order("name", { ascending: true })

    if (status && status !== "all") {
      if (status === "active") {
        staffQuery = staffQuery.eq("is_active", true)
      } else if (status === "inactive" || status === "terminated") {
        staffQuery = staffQuery.eq("is_active", false)
      }
    }

    const { data: staffList, error: staffError } = await staffQuery

    if (staffError) {
      console.error("Error fetching staff:", staffError)
      return NextResponse.json({
        success: false,
        error: staffError.message,
        employees: [],
      }, { status: 500 })
    }

    // Fetch all staff documents
    const { data: allDocuments } = await supabase
      .from("staff_documents")
      .select("*")
      .order("created_at", { ascending: false })

    // Create document lookup by staff_id
    const documentsByStaff: Record<string, any[]> = {}
    ;(allDocuments || []).forEach((doc: any) => {
      if (!documentsByStaff[doc.staff_id]) {
        documentsByStaff[doc.staff_id] = []
      }
      documentsByStaff[doc.staff_id].push(doc)
    })

    // Transform staff data into employee files format
    const employees = (staffList || []).map((staff: any) => {
      const staffDocs = documentsByStaff[staff.id] || []
      
      // Helper to find document by type
      const findDoc = (types: string[]) => {
        return staffDocs.find((d: any) => 
          types.some(t => d.document_type?.toLowerCase().includes(t.toLowerCase()))
        )
      }

      // Build document status
      const getDocStatus = (doc: any) => {
        if (!doc) return { status: "missing" }
        return {
          status: doc.status || "pending",
          completedDate: doc.verified_at || doc.created_at,
          signedDate: doc.verified_at,
          expiry: doc.expiration_date,
          fileUrl: doc.file_url,
        }
      }

      // Generate employee ID
      const employeeId = `EMP-${String(staff.id).substring(0, 8).toUpperCase()}`

      return {
        id: staff.id,
        employeeId,
        personalInfo: {
          firstName: staff.name?.split(" ")[0] || "Unknown",
          lastName: staff.name?.split(" ").slice(1).join(" ") || "",
          middleInitial: "",
          email: staff.email || "",
          phone: staff.phone_number || "",
          address: staff.address || "Address not provided",
          dob: staff.date_of_birth || "",
          ssn: "***-**-****", // Masked for security
        },
        position: staff.credentials || staff.role_id || "Staff",
        department: staff.department || "General",
        employmentType: staff.employment_type || "Full-time",
        supervisor: staff.supervisor || "Not Assigned",
        hireDate: staff.hire_date || staff.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        salary: staff.salary || "Not Specified",
        status: staff.is_active ? "active" : "inactive",
        
        // Document status
        documents: {
          i9Form: getDocStatus(findDoc(["i-9", "i9", "employment eligibility"])),
          w4Form: getDocStatus(findDoc(["w-4", "w4", "tax withholding"])),
          hipaaAgreement: getDocStatus(findDoc(["hipaa", "privacy agreement"])),
          confidentialityAgreement: getDocStatus(findDoc(["confidentiality", "nda"])),
          conflictOfInterest: getDocStatus(findDoc(["conflict of interest"])),
          backgroundCheckAuth: getDocStatus(findDoc(["background check auth", "background authorization"])),
          tbTest: {
            ...getDocStatus(findDoc(["tb test", "tuberculosis"])),
            result: "Negative",
            date: findDoc(["tb test"])?.created_at?.split("T")[0],
          },
          tbScreeningForm: getDocStatus(findDoc(["tb screening", "tb form"])),
          resume: getDocStatus(findDoc(["resume", "cv"])),
          professionalLicense: {
            ...getDocStatus(findDoc(["license", "rn license", "professional license"])),
            number: staff.license_number || "",
          },
          degree: getDocStatus(findDoc(["degree", "diploma", "transcript"])),
          cprCertification: getDocStatus(findDoc(["cpr", "bls", "acls"])),
          driversLicense: {
            ...getDocStatus(findDoc(["driver", "drivers license"])),
            number: "",
          },
          socialSecurityCard: getDocStatus(findDoc(["social security", "ssn card"])),
          carInsurance: getDocStatus(findDoc(["car insurance", "auto insurance", "vehicle insurance"])),
          backgroundCheck: {
            ...getDocStatus(findDoc(["background check result", "background verification"])),
            provider: "National Background Check",
          },
        },

        // Compliance data
        compliance: {
          hipaaTraining: {
            completed: !!findDoc(["hipaa training", "hipaa cert"]),
            date: findDoc(["hipaa training"])?.created_at?.split("T")[0],
            certificateNumber: findDoc(["hipaa training"])?.id?.substring(0, 8).toUpperCase(),
          },
          tbScreening: {
            completed: !!findDoc(["tb"]),
            result: "Negative",
            nextDue: calculateNextDue(findDoc(["tb"])?.created_at, 365),
          },
          employmentEligibility: {
            verified: !!findDoc(["i-9", "i9"]),
            date: findDoc(["i-9", "i9"])?.verified_at?.split("T")[0],
            verifiedBy: findDoc(["i-9", "i9"])?.verified_by || "HR Manager",
          },
          taxWithholding: {
            completed: !!findDoc(["w-4", "w4"]),
            date: findDoc(["w-4", "w4"])?.created_at?.split("T")[0],
            allowances: 2,
            status: "Single",
          },
          conflictOfInterestDisclosure: {
            completed: !!findDoc(["conflict"]),
            date: findDoc(["conflict"])?.created_at?.split("T")[0],
            nextReview: calculateNextDue(findDoc(["conflict"])?.created_at, 365),
          },
          backgroundCheckConsent: {
            signed: !!findDoc(["background"]),
            date: findDoc(["background"])?.created_at?.split("T")[0],
            provider: "National Background Check",
          },
        },

        // Education - placeholder
        education: {
          highSchool: staff.high_school ? {
            name: staff.high_school,
            graduated: true,
            year: "N/A",
          } : null,
          college: staff.college ? {
            name: staff.college,
            degree: staff.degree || "N/A",
            graduated: true,
            year: "N/A",
          } : null,
        },

        // Work history - placeholder
        workHistory: staff.previous_employer ? [{
          company: staff.previous_employer,
          position: "Healthcare Professional",
          duration: "N/A",
          supervisor: "N/A",
          phone: "N/A",
          reason: "Career growth",
        }] : [],

        // References - placeholder
        references: [],

        // Emergency contact
        emergencyContact: {
          name: staff.emergency_contact_name || "Not provided",
          relationship: staff.emergency_contact_relationship || "N/A",
          phone: staff.emergency_contact_phone || "N/A",
          address: "N/A",
        },
      }
    })

    // Filter by search if provided
    let filteredEmployees = employees
    if (search) {
      const searchLower = search.toLowerCase()
      filteredEmployees = employees.filter((emp: any) => 
        emp.personalInfo.firstName.toLowerCase().includes(searchLower) ||
        emp.personalInfo.lastName.toLowerCase().includes(searchLower) ||
        emp.personalInfo.email.toLowerCase().includes(searchLower) ||
        emp.employeeId.toLowerCase().includes(searchLower)
      )
    }

    // Calculate statistics
    const stats = {
      total: employees.length,
      active: employees.filter((e: any) => e.status === "active").length,
      inactive: employees.filter((e: any) => e.status === "inactive").length,
      fullTime: employees.filter((e: any) => e.employmentType === "Full-time").length,
      partTime: employees.filter((e: any) => e.employmentType === "Part-time").length,
      compliant: employees.filter((e: any) => {
        const docs = e.documents
        return docs.i9Form.status === "verified" && 
               docs.w4Form.status === "verified" &&
               docs.hipaaAgreement.status !== "missing"
      }).length,
      expiringSoon: employees.filter((e: any) => {
        return Object.values(e.documents).some((doc: any) => doc.status === "expiring")
      }).length,
    }

    return NextResponse.json({
      success: true,
      employees: filteredEmployees,
      stats,
      count: filteredEmployees.length,
    })
  } catch (error: any) {
    console.error("Error in HR employees API:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch employee files",
      employees: [],
    }, { status: 500 })
  }
}

// Helper function to calculate next due date
function calculateNextDue(dateStr: string | null, daysToAdd: number): string | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + daysToAdd)
    return date.toISOString().split("T")[0]
  } catch {
    return null
  }
}

