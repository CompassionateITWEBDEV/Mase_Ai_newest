import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface EncounterData {
  patientInitials: string
  doctorName: string
  nurseName: string
  chiefComplaint: string
  symptoms: string[]
  vitalSigns?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    oxygenSaturation?: number
  }
  assessment: string
  plan: string
  medications?: string[]
  followUp?: string
}

export interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
  diagnosisCodes: string[]
  medications: string[]
  timestamp: Date
}

export class AIDocGenerator {
  async generateSOAPNote(encounterData: EncounterData): Promise<SOAPNote> {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a medical documentation AI. Generate a structured SOAP note based on the encounter data. 
      Format the response as JSON with the following structure:
      {
        "subjective": "Patient's reported symptoms and history",
        "objective": "Observable findings and vital signs",
        "assessment": "Clinical assessment and diagnosis",
        "plan": "Treatment plan and recommendations",
        "diagnosisCodes": ["ICD-10 codes"],
        "medications": ["prescribed medications"]
      }`,
      prompt: `Generate SOAP note for:
        Patient: ${encounterData.patientInitials}
        Doctor: ${encounterData.doctorName}
        Nurse: ${encounterData.nurseName}
        Chief Complaint: ${encounterData.chiefComplaint}
        Symptoms: ${encounterData.symptoms.join(", ")}
        Vital Signs: ${JSON.stringify(encounterData.vitalSigns || {})}
        Assessment: ${encounterData.assessment}
        Plan: ${encounterData.plan}
      `,
    })

    try {
      const parsed = JSON.parse(text)
      return {
        ...parsed,
        timestamp: new Date(),
      }
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        subjective: encounterData.chiefComplaint,
        objective: `Vital signs: ${JSON.stringify(encounterData.vitalSigns || {})}`,
        assessment: encounterData.assessment,
        plan: encounterData.plan,
        diagnosisCodes: [],
        medications: encounterData.medications || [],
        timestamp: new Date(),
      }
    }
  }

  async generatePrescription(medication: string, patientInitials: string, doctorName: string): Promise<string> {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: "You are a medical prescription generator. Create a properly formatted prescription.",
      prompt: `Generate prescription for:
        Patient: ${patientInitials}
        Doctor: ${doctorName}
        Medication: ${medication}
        Include dosage, frequency, duration, and instructions.
      `,
    })

    return text
  }
}

export const aiDocGenerator = new AIDocGenerator()
