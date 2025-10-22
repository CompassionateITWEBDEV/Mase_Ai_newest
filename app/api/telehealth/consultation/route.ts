import { type NextRequest, NextResponse } from "next/server"
import { telehealthEngine } from "@/lib/telehealth-engine"
import { aiDocGenerator } from "@/lib/ai-doc-generator"
import { ehrIntegration } from "@/lib/ehr-integration"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case "request_consultation":
        const consultRequest = {
          patientId: data.patientId,
          patientInitials: data.patientInitials,
          nurseName: data.nurseName,
          nurseId: data.nurseId,
          reasonForConsult: data.reasonForConsult,
          urgencyLevel: data.urgencyLevel,
          timestamp: new Date(),
        }

        // Check if primary doctor is available
        const primaryAvailable = await telehealthEngine.checkPatientPrimaryDoctor(data.patientId)

        if (!primaryAvailable) {
          // Find available doctor from network
          const availableDoctor = await telehealthEngine.findAvailableDoctor(consultRequest)

          if (availableDoctor) {
            const consultSummary = await telehealthEngine.initiateConsult(consultRequest, availableDoctor)

            return NextResponse.json({
              success: true,
              doctor: availableDoctor,
              consultationId: `consult-${Date.now()}`,
              summary: consultSummary,
            })
          } else {
            return NextResponse.json(
              {
                success: false,
                message: "No doctors available at this time",
              },
              { status: 503 },
            )
          }
        } else {
          return NextResponse.json({
            success: true,
            message: "Primary doctor contacted",
            primaryDoctor: true,
          })
        }

      case "complete_consultation":
        const encounterData = {
          patientInitials: data.patientInitials,
          doctorName: data.doctorName,
          nurseName: data.nurseName,
          chiefComplaint: data.chiefComplaint,
          symptoms: data.symptoms,
          vitalSigns: data.vitalSigns,
          assessment: data.assessment,
          plan: data.plan,
          medications: data.medications,
        }

        // Generate SOAP note using AI
        const soapNote = await aiDocGenerator.generateSOAPNote(encounterData)

        // Create EHR record
        const ehrRecord = {
          patientId: data.patientId,
          encounterId: data.encounterId,
          doctorId: data.doctorId,
          nurseId: data.nurseId,
          soapNote,
          prescriptions: data.prescriptions || [],
          timestamp: new Date(),
          status: "pending" as const,
        }

        // Send to EHR system
        const ehrSuccess = await ehrIntegration.sendToEHR(ehrRecord)

        if (ehrSuccess) {
          // Notify stakeholders
          await ehrIntegration.notifyStakeholders(ehrRecord)

          return NextResponse.json({
            success: true,
            soapNote,
            ehrRecord: ehrRecord.encounterId,
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              message: "Failed to save to EHR",
            },
            { status: 500 },
          )
        }

      default:
        return NextResponse.json(
          {
            success: false,
            message: "Invalid action",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("Telehealth consultation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")

    if (doctorId) {
      // Get doctor's consultation history
      return NextResponse.json({
        success: true,
        consultations: [
          {
            id: "consult-123",
            patientInitials: "J.D.",
            date: new Date().toISOString(),
            status: "completed",
            duration: 15,
            compensation: 125,
          },
        ],
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: "Doctor ID required",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Get consultations error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
