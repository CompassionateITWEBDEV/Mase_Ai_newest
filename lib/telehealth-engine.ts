import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface ConsultRequest {
  patientId: string
  patientInitials: string
  nurseName: string
  nurseId: string
  reasonForConsult: string
  urgencyLevel: "low" | "medium" | "high" | "critical"
  timestamp: Date
}

export interface Doctor {
  id: string
  name: string
  npi: string
  dea: string
  email: string
  isAvailable: boolean
  specialties: string[]
  rating: number
  responseTime: number
}

export class TelehealthEngine {
  private availableDoctors: Doctor[] = []

  async findAvailableDoctor(consultRequest: ConsultRequest): Promise<Doctor | null> {
    // Filter available doctors
    const available = this.availableDoctors.filter((doc) => doc.isAvailable)

    if (available.length === 0) {
      return null
    }

    // Sort by response time and rating
    available.sort((a, b) => {
      if (consultRequest.urgencyLevel === "critical") {
        return a.responseTime - b.responseTime
      }
      return b.rating - a.rating
    })

    return available[0]
  }

  async initiateConsult(consultRequest: ConsultRequest, doctor: Doctor): Promise<string> {
    // Generate consultation summary using AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: "You are a medical consultation coordinator. Generate a brief consultation initiation summary.",
      prompt: `Initiate telehealth consultation:
        Patient: ${consultRequest.patientInitials}
        Nurse: ${consultRequest.nurseName}
        Doctor: ${doctor.name}
        Reason: ${consultRequest.reasonForConsult}
        Urgency: ${consultRequest.urgencyLevel}
      `,
    })

    return text
  }

  async checkPatientPrimaryDoctor(patientId: string): Promise<boolean> {
    // Simulate checking if primary doctor is available
    // In real implementation, this would check the doctor's availability
    return Math.random() > 0.7 // 30% chance primary doctor is available
  }

  addDoctor(doctor: Doctor): void {
    this.availableDoctors.push(doctor)
  }

  updateDoctorAvailability(doctorId: string, isAvailable: boolean): void {
    const doctor = this.availableDoctors.find((d) => d.id === doctorId)
    if (doctor) {
      doctor.isAvailable = isAvailable
    }
  }
}

export const telehealthEngine = new TelehealthEngine()
