import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

interface AxxessPatient {
  id: string
  axxessId: string
  name: string
  referralDate: string
  currentStatus: "Active" | "Pending" | "Discharged" | "On Hold"
  dischargeStatus: string
  referralAccepted: boolean
  assignedStaff: string
  socDueDate: string
  location: string
  referralType: "Hospital" | "Facility" | "Clinic"
  priority: "High" | "Medium" | "Low"
  diagnosis: string
  age: number
  insurance: string
  phoneNumber: string
  address: string
  emergencyContact: string
  episodeStartDate: string
  episodeEndDate: string
  nextReEvalDate: string
  lupaStatus: "Safe" | "At Risk" | "Over Threshold"
  totalEpisodeCost: number
  projectedCost: number
  visitFrequencies: any[]
  patientGoals: any[]
}

interface SyncResponse {
  success: boolean
  patients: any[] // Updated to any[] to accommodate referralData
  message: string
  syncTimestamp: string
  recordsProcessed: number
  errors?: string[]
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncResponse>> {
  try {
    const { lastSync, includeVisitData, includeLupaData } = await request.json()

    console.log(`Starting Axxess patient sync - Last Sync: ${lastSync}`)

    const supabase = createServiceClient()

    // Fetch Axxess configuration from database
    const { data: axxessConfig, error: configError } = await supabase
      .from("integrations_config")
      .select("*")
      .eq("integration_name", "axxess")
      .single()

    if (configError || !axxessConfig) {
      return NextResponse.json(
        {
          success: false,
          patients: [],
          message: "Axxess configuration not found. Please configure Axxess integration first.",
          syncTimestamp: new Date().toISOString(),
          recordsProcessed: 0,
          errors: ["Axxess configuration not found"],
        },
        { status: 400 }
      )
    }

    if (axxessConfig.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          patients: [],
          message: `Axxess integration status: ${axxessConfig.status}. Please check configuration.`,
          syncTimestamp: new Date().toISOString(),
          recordsProcessed: 0,
          errors: [`Integration status: ${axxessConfig.status}`],
        },
        { status: 400 }
      )
    }

    // Decrypt credentials (in production, use proper decryption)
    // For now, we'll use the stored credentials
    const credentials = {
      username: axxessConfig.username?.replace("encrypted_", "") || "",
      password: axxessConfig.password || "",
      agencyId: axxessConfig.agency_id || "",
      environment: axxessConfig.environment || "sandbox",
      apiUrl: axxessConfig.api_url || "https://api.axxess.com/v1",
    }

    console.log(`Connecting to Axxess API for agency: ${credentials.agencyId}`)

    // TODO: Replace with actual Axxess API call
    // For now, we'll use mock data but structure it for real API integration
    // In production, you would:
    // 1. Authenticate with Axxess API using credentials
    // 2. Fetch patient data from Axxess
    // 3. Transform Axxess data format to our format
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock Axxess patient data with enhanced visit frequency and LUPA information
    const mockAxxessPatients: AxxessPatient[] = [
      {
        id: "PT-2024-001",
        axxessId: "AX-12345",
        name: "John Smith",
        referralDate: "2024-01-15",
        currentStatus: "Active",
        dischargeStatus: "N/A",
        referralAccepted: true,
        assignedStaff: "Sarah Johnson, RN",
        socDueDate: "2024-01-22",
        location: "Main Campus",
        referralType: "Hospital",
        priority: "High",
        diagnosis: "Post-surgical wound care, diabetes management",
        age: 72,
        insurance: "Medicare",
        phoneNumber: "(555) 123-4567",
        address: "123 Main Street, City, ST 12345",
        emergencyContact: "Jane Smith (Wife) - (555) 123-4568",
        episodeStartDate: "2024-01-15",
        episodeEndDate: "2024-03-15",
        nextReEvalDate: "2024-02-14",
        lupaStatus: "Safe",
        totalEpisodeCost: 1850.0,
        projectedCost: 2200.0,
        visitFrequencies: [
          {
            discipline: "RN",
            authorized: 20,
            used: 5,
            remaining: 15,
            weeklyFrequency: "2x/week",
            lastVisit: "2024-01-20",
            nextScheduled: "2024-01-22",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 125.0,
            totalCost: 625.0,
          },
          {
            discipline: "HHA",
            authorized: 30,
            used: 8,
            remaining: 22,
            weeklyFrequency: "3x/week",
            lastVisit: "2024-01-21",
            nextScheduled: "2024-01-23",
            lupaThreshold: 15,
            isOverThreshold: false,
            costPerVisit: 65.0,
            totalCost: 520.0,
          },
        ],
        patientGoals: [
          {
            id: "G001",
            discipline: "RN",
            goal: "Wound healing and infection prevention",
            targetDate: "2024-02-28",
            status: "In Progress",
            progress: 60,
            notes: "Wound showing good healing progress",
          },
        ],
      },
      {
        id: "PT-2024-002",
        axxessId: "AX-12346",
        name: "Maria Garcia",
        referralDate: "2024-01-18",
        currentStatus: "Active",
        dischargeStatus: "N/A",
        referralAccepted: true,
        assignedStaff: "Michael Brown, PT",
        socDueDate: "2024-01-25",
        location: "West Branch",
        referralType: "Facility",
        priority: "Medium",
        diagnosis: "Hip replacement rehabilitation",
        age: 65,
        insurance: "Medicare Advantage",
        phoneNumber: "(555) 234-5678",
        address: "456 Park Avenue, City, ST 12345",
        emergencyContact: "Carlos Garcia (Son) - (555) 234-5679",
        episodeStartDate: "2024-01-18",
        episodeEndDate: "2024-03-18",
        nextReEvalDate: "2024-02-17",
        lupaStatus: "Safe",
        totalEpisodeCost: 2100.0,
        projectedCost: 2500.0,
        visitFrequencies: [
          {
            discipline: "PT",
            authorized: 18,
            used: 6,
            remaining: 12,
            weeklyFrequency: "3x/week",
            lastVisit: "2024-01-21",
            nextScheduled: "2024-01-23",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 150.0,
            totalCost: 900.0,
          },
          {
            discipline: "RN",
            authorized: 12,
            used: 4,
            remaining: 8,
            weeklyFrequency: "1x/week",
            lastVisit: "2024-01-20",
            nextScheduled: "2024-01-24",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 125.0,
            totalCost: 500.0,
          },
        ],
        patientGoals: [
          {
            id: "G002",
            discipline: "PT",
            goal: "Restore mobility and strength",
            targetDate: "2024-03-01",
            status: "In Progress",
            progress: 50,
            notes: "Patient making steady progress with exercises",
          },
        ],
      },
      {
        id: "PT-2024-003",
        axxessId: "AX-12347",
        name: "Robert Lee",
        referralDate: "2024-01-20",
        currentStatus: "Active",
        dischargeStatus: "N/A",
        referralAccepted: true,
        assignedStaff: "Emily Davis, RN",
        socDueDate: "2024-01-27",
        location: "South Clinic",
        referralType: "Clinic",
        priority: "Low",
        diagnosis: "Hypertension management, medication compliance",
        age: 58,
        insurance: "Private Insurance",
        phoneNumber: "(555) 345-6789",
        address: "789 Broadway, City, ST 12345",
        emergencyContact: "Susan Lee (Wife) - (555) 345-6790",
        episodeStartDate: "2024-01-20",
        episodeEndDate: "2024-03-20",
        nextReEvalDate: "2024-02-19",
        lupaStatus: "Safe",
        totalEpisodeCost: 1200.0,
        projectedCost: 1500.0,
        visitFrequencies: [
          {
            discipline: "RN",
            authorized: 8,
            used: 2,
            remaining: 6,
            weeklyFrequency: "1x/week",
            lastVisit: "2024-01-19",
            nextScheduled: "2024-01-26",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 125.0,
            totalCost: 250.0,
          },
        ],
        patientGoals: [
          {
            id: "G003",
            discipline: "RN",
            goal: "Maintain blood pressure within target range",
            targetDate: "2024-02-28",
            status: "In Progress",
            progress: 75,
            notes: "BP readings consistently within target range",
          },
        ],
      },
      {
        id: "PT-2024-004",
        axxessId: "AX-12348",
        name: "Helen Rodriguez",
        referralDate: "2024-01-22",
        currentStatus: "Active",
        dischargeStatus: "N/A",
        referralAccepted: true,
        assignedStaff: "Patricia Wilson, RN",
        socDueDate: "2024-01-29",
        location: "East Wing",
        referralType: "Hospital",
        priority: "High",
        diagnosis: "Post-stroke rehabilitation, dysphagia",
        age: 68,
        insurance: "Medicare",
        phoneNumber: "(555) 789-0123",
        address: "456 Elm Street, City, ST 12345",
        emergencyContact: "Carlos Rodriguez (Husband) - (555) 321-0987",
        episodeStartDate: "2024-01-22",
        episodeEndDate: "2024-03-22",
        nextReEvalDate: "2024-02-21",
        lupaStatus: "At Risk",
        totalEpisodeCost: 2650.0,
        projectedCost: 3100.0,
        visitFrequencies: [
          {
            discipline: "RN",
            authorized: 16,
            used: 6,
            remaining: 10,
            weeklyFrequency: "2x/week",
            lastVisit: "2024-01-21",
            nextScheduled: "2024-01-23",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 125.0,
            totalCost: 750.0,
          },
          {
            discipline: "PT",
            authorized: 14,
            used: 8,
            remaining: 6,
            weeklyFrequency: "2x/week",
            lastVisit: "2024-01-21",
            nextScheduled: "2024-01-23",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 150.0,
            totalCost: 1200.0,
          },
          {
            discipline: "OT",
            authorized: 12,
            used: 5,
            remaining: 7,
            weeklyFrequency: "2x/week",
            lastVisit: "2024-01-20",
            nextScheduled: "2024-01-22",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 140.0,
            totalCost: 700.0,
          },
        ],
        patientGoals: [
          {
            id: "G006",
            discipline: "PT",
            goal: "Improve balance and reduce fall risk",
            targetDate: "2024-02-28",
            status: "In Progress",
            progress: 45,
            notes: "Patient showing steady improvement in balance exercises",
          },
          {
            id: "G007",
            discipline: "OT",
            goal: "Safe swallowing with modified diet",
            targetDate: "2024-02-15",
            status: "In Progress",
            progress: 60,
            notes: "Progressing well with swallowing exercises",
          },
        ],
      },
      {
        id: "PT-2024-005",
        axxessId: "AX-12349",
        name: "William Chen",
        referralDate: "2024-01-23",
        currentStatus: "Active",
        dischargeStatus: "N/A",
        referralAccepted: true,
        assignedStaff: "David Rodriguez, RN",
        socDueDate: "2024-01-30",
        location: "North Branch",
        referralType: "Facility",
        priority: "Medium",
        diagnosis: "COPD exacerbation, medication management",
        age: 71,
        insurance: "Medicare Advantage",
        phoneNumber: "(555) 890-1234",
        address: "789 Oak Drive, City, ST 12345",
        emergencyContact: "Linda Chen (Daughter) - (555) 432-1098",
        episodeStartDate: "2024-01-23",
        episodeEndDate: "2024-03-23",
        nextReEvalDate: "2024-02-22",
        lupaStatus: "Over Threshold",
        totalEpisodeCost: 3450.0,
        projectedCost: 4200.0,
        visitFrequencies: [
          {
            discipline: "RN",
            authorized: 18,
            used: 14,
            remaining: 4,
            weeklyFrequency: "3x/week",
            lastVisit: "2024-01-22",
            nextScheduled: "2024-01-24",
            lupaThreshold: 10,
            isOverThreshold: true,
            costPerVisit: 125.0,
            totalCost: 1750.0,
          },
          {
            discipline: "PT",
            authorized: 10,
            used: 8,
            remaining: 2,
            weeklyFrequency: "2x/week",
            lastVisit: "2024-01-21",
            nextScheduled: "2024-01-23",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 150.0,
            totalCost: 1200.0,
          },
          {
            discipline: "HHA",
            authorized: 25,
            used: 15,
            remaining: 10,
            weeklyFrequency: "3x/week",
            lastVisit: "2024-01-22",
            nextScheduled: "2024-01-24",
            lupaThreshold: 15,
            isOverThreshold: false,
            costPerVisit: 65.0,
            totalCost: 975.0,
          },
        ],
        patientGoals: [
          {
            id: "G008",
            discipline: "RN",
            goal: "Stabilize COPD symptoms and improve medication compliance",
            targetDate: "2024-03-01",
            status: "In Progress",
            progress: 70,
            notes: "Patient responding well to medication adjustments",
          },
          {
            id: "G009",
            discipline: "PT",
            goal: "Improve exercise tolerance and breathing techniques",
            targetDate: "2024-02-20",
            status: "In Progress",
            progress: 55,
            notes: "Good progress with pulmonary rehabilitation exercises",
          },
        ],
      },
    ]

    // Filter records based on last sync date if provided
    let filteredPatients = mockAxxessPatients
    if (lastSync) {
      const lastSyncDate = new Date(lastSync)
      // In real implementation, filter based on last modified date
      console.log(`Filtering records modified after ${lastSyncDate}`)
    }

    // Calculate LUPA status based on visit utilization
    filteredPatients = filteredPatients.map((patient) => {
      const overThresholdCount = patient.visitFrequencies.filter((v) => v.isOverThreshold).length
      const atRiskCount = patient.visitFrequencies.filter(
        (v) => v.used / v.authorized > 0.8 && !v.isOverThreshold,
      ).length

      let lupaStatus: "Safe" | "At Risk" | "Over Threshold" = "Safe"
      if (overThresholdCount > 0) {
        lupaStatus = "Over Threshold"
      } else if (atRiskCount > 0) {
        lupaStatus = "At Risk"
      }

      return {
        ...patient,
        lupaStatus,
      }
    })

    // Save synced patients to database
    const savedPatients = []
    const errors: string[] = []

    for (const patient of filteredPatients) {
      try {
        // Check if patient already exists by axxess_id
        const { data: existingPatient } = await supabase
          .from("patients")
          .select("id")
          .eq("axxess_id", patient.axxessId)
          .single()

        const patientData = {
          axxess_id: patient.axxessId,
          name: patient.name,
          referral_date: patient.referralDate || null,
          current_status: patient.currentStatus,
          discharge_status: patient.dischargeStatus || null,
          referral_accepted: patient.referralAccepted,
          soc_due_date: patient.socDueDate || null,
          location: patient.location || null,
          referral_type: patient.referralType,
          priority: patient.priority,
          diagnosis: patient.diagnosis || null,
          age: patient.age || null,
          insurance: patient.insurance || null,
          phone_number: patient.phoneNumber || null,
          address: patient.address || null,
          emergency_contact: patient.emergencyContact || null,
          episode_start_date: patient.episodeStartDate || null,
          episode_end_date: patient.episodeEndDate || null,
          next_re_eval_date: patient.nextReEvalDate || null,
          lupa_status: patient.lupaStatus,
          total_episode_cost: patient.totalEpisodeCost || 0,
          projected_cost: patient.projectedCost || 0,
          visit_frequencies: patient.visitFrequencies || [],
          patient_goals: patient.patientGoals || [],
          dme_orders: [],
          wound_care: null,
          updated_at: new Date().toISOString(),
        }

        if (existingPatient) {
          // Update existing patient
          const { error: updateError } = await supabase
            .from("patients")
            .update(patientData)
            .eq("id", existingPatient.id)

          if (updateError) throw updateError
          savedPatients.push({ ...patient, id: existingPatient.id })
        } else {
          // Insert new patient
          const { data: newPatient, error: insertError } = await supabase
            .from("patients")
            .insert(patientData)
            .select()
            .single()

          if (insertError) throw insertError
          savedPatients.push({ ...patient, id: newPatient.id })
        }
      } catch (error: any) {
        console.error(`Error saving patient ${patient.axxessId}:`, error)
        errors.push(`Failed to save patient ${patient.name} (${patient.axxessId}): ${error.message}`)
      }
    }

    // Update last sync time in configuration
    await supabase
      .from("integrations_config")
      .update({ 
        last_sync_time: new Date().toISOString(),
        status: errors.length > 0 ? "error" : "connected",
        error_message: errors.length > 0 ? errors.join("; ") : null,
      })
      .eq("integration_name", "axxess")

    // Update the response format to match referral dashboard expectations
    const response: SyncResponse = {
      success: errors.length === 0 || savedPatients.length > 0,
      patients: savedPatients.map((patient) => ({
        ...patient,
        // Convert to referral format for dashboard integration
        referralData: {
          id: patient.id,
          patientName: patient.name,
          diagnosis: patient.diagnosis,
          source: "axxess" as const,
          insurance: patient.insurance,
          urgency: patient.priority === "High" ? "Urgent" : ("Routine" as const),
          status: patient.currentStatus === "Active" ? "accepted" : ("processing" as const),
          confidence: 95,
          estimatedValue: patient.totalEpisodeCost,
          receivedAt: patient.referralDate,
          axxessId: patient.axxessId,
          assignedTo: patient.assignedStaff,
        },
      })),
      message: `Successfully synced ${savedPatients.length} of ${filteredPatients.length} patients from Axxess${errors.length > 0 ? ` (${errors.length} errors)` : ""}`,
      syncTimestamp: new Date().toISOString(),
      recordsProcessed: savedPatients.length,
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log(`Axxess patient sync completed: ${savedPatients.length} records saved${errors.length > 0 ? `, ${errors.length} errors` : ""}`)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Axxess patient sync error:", error)

    const errorResponse: SyncResponse = {
      success: false,
      patients: [],
      message: "Failed to sync patients from Axxess",
      syncTimestamp: new Date().toISOString(),
      recordsProcessed: 0,
      errors: [error instanceof Error ? error.message : "Unknown error occurred"],
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const axxessId = searchParams.get("axxessId")

    if (!patientId && !axxessId) {
      return NextResponse.json(
        {
          success: false,
          message: "Patient ID or Axxess ID is required",
        },
        { status: 400 },
      )
    }

    // Mock individual patient lookup
    const patientData = {
      success: true,
      patient: {
        id: patientId || "PT-2024-001",
        axxessId: axxessId || "AX-12345",
        lastUpdated: new Date().toISOString(),
        visitHistory: [
          {
            date: "2024-01-20",
            discipline: "RN",
            duration: 45,
            notes: "Wound assessment and dressing change",
            cost: 125.0,
          },
          {
            date: "2024-01-19",
            discipline: "PT",
            duration: 60,
            notes: "Gait training and strengthening exercises",
            cost: 150.0,
          },
        ],
        lupaAnalysis: {
          currentStatus: "At Risk",
          thresholdAnalysis: {
            RN: { used: 8, threshold: 10, status: "Safe" },
            PT: { used: 7, threshold: 10, status: "Safe" },
            HHA: { used: 12, threshold: 15, status: "Safe" },
          },
          recommendations: [
            "Monitor RN visit frequency to stay within LUPA threshold",
            "Consider combining PT/OT visits to optimize therapy outcomes",
            "Schedule re-evaluation in 2 weeks for potential authorization increase",
          ],
        },
      },
    }

    return NextResponse.json(patientData)
  } catch (error) {
    console.error("Error retrieving patient data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
