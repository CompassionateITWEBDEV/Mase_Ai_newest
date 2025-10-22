import { type NextRequest, NextResponse } from "next/server"

interface MiHINWebhookPayload {
  eventType: "admission" | "discharge" | "transfer"
  timestamp: string
  patient: {
    id: string
    name: string
    mrn: string
    dateOfBirth: string
    gender: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
  }
  facility: {
    id: string
    name: string
    npi: string
    address: string
  }
  encounter: {
    id: string
    admissionDate: string
    dischargeDate?: string
    transferDate?: string
    department: string
    roomNumber?: string
    bedNumber?: string
  }
  diagnosis: {
    primary: {
      code: string
      description: string
    }
    secondary: Array<{
      code: string
      description: string
    }>
  }
  physician: {
    name: string
    npi: string
    specialty: string
  }
  insurance: {
    primary: {
      payerName: string
      payerId: string
      memberNumber: string
      groupNumber?: string
    }
    secondary?: {
      payerName: string
      payerId: string
      memberNumber: string
    }
  }
  clinicalData?: {
    vitalSigns?: any
    medications?: any[]
    procedures?: any[]
    labResults?: any[]
  }
}

// Webhook signature verification (in production, verify with MiHIN's public key)
function verifyWebhookSignature(payload: string, signature: string): boolean {
  // In production, implement proper signature verification
  // using MiHIN's public key and HMAC-SHA256
  return true
}

// Calculate home health eligibility and risk score
function calculateEligibility(payload: MiHINWebhookPayload) {
  let riskScore = 0
  let homeHealthEligible = false

  // Age factor
  const age = new Date().getFullYear() - new Date(payload.patient.dateOfBirth).getFullYear()
  if (age >= 65) riskScore += 20
  if (age >= 75) riskScore += 10
  if (age >= 85) riskScore += 10

  // Diagnosis-based scoring
  const primaryDx = payload.diagnosis.primary.description.toLowerCase()

  // High-risk diagnoses for home health
  const highRiskDiagnoses = [
    "heart failure",
    "copd",
    "stroke",
    "hip fracture",
    "diabetes",
    "pneumonia",
    "sepsis",
    "wound",
    "post-surgical",
  ]

  for (const dx of highRiskDiagnoses) {
    if (primaryDx.includes(dx)) {
      riskScore += 25
      homeHealthEligible = true
      break
    }
  }

  // Insurance eligibility
  const insurance = payload.insurance.primary.payerName.toLowerCase()
  if (insurance.includes("medicare") || insurance.includes("medicaid")) {
    riskScore += 15
    homeHealthEligible = true
  }

  // Event type scoring
  if (payload.eventType === "discharge") {
    riskScore += 20
  }

  // Length of stay (if available)
  if (payload.encounter.admissionDate && payload.encounter.dischargeDate) {
    const los = Math.ceil(
      (new Date(payload.encounter.dischargeDate).getTime() - new Date(payload.encounter.admissionDate).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    if (los >= 3) riskScore += 10
    if (los >= 7) riskScore += 10
  }

  return {
    riskScore: Math.min(riskScore, 100),
    homeHealthEligible,
    potentialValue: homeHealthEligible ? Math.floor(Math.random() * 3000) + 2000 : 0,
  }
}

// Process ADT notification and trigger workflows
async function processADTNotification(payload: MiHINWebhookPayload) {
  const eligibility = calculateEligibility(payload)

  // Create notification record
  const notification = {
    id: `adt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    patientId: payload.patient.id,
    patientName: payload.patient.name,
    mrn: payload.patient.mrn,
    eventType: payload.eventType,
    facility: payload.facility.name,
    facilityId: payload.facility.id,
    department: payload.encounter.department,
    diagnosis: [payload.diagnosis.primary.description, ...payload.diagnosis.secondary.map((d) => d.description)],
    primaryDiagnosis: payload.diagnosis.primary.description,
    insurance: payload.insurance.primary.payerName,
    insuranceId: payload.insurance.primary.payerId,
    age: new Date().getFullYear() - new Date(payload.patient.dateOfBirth).getFullYear(),
    gender: payload.patient.gender,
    address: `${payload.patient.address.street}, ${payload.patient.address.city}, ${payload.patient.address.state}`,
    zipCode: payload.patient.address.zipCode,
    admissionDate: payload.encounter.admissionDate,
    dischargeDate: payload.encounter.dischargeDate,
    transferDate: payload.encounter.transferDate,
    physicianName: payload.physician.name,
    physicianNPI: payload.physician.npi,
    estimatedLOS:
      payload.encounter.dischargeDate && payload.encounter.admissionDate
        ? Math.ceil(
            (new Date(payload.encounter.dischargeDate).getTime() -
              new Date(payload.encounter.admissionDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0,
    acuityLevel: eligibility.riskScore >= 80 ? "high" : eligibility.riskScore >= 60 ? "medium" : "low",
    homeHealthEligible: eligibility.homeHealthEligible,
    riskScore: eligibility.riskScore,
    potentialValue: eligibility.potentialValue,
    timestamp: payload.timestamp,
    status: "new",
    contactAttempts: 0,
  }

  // Store notification (in production, save to database)
  console.log("New ADT Notification:", notification)

  // Trigger automated workflows based on risk score and eligibility
  if (eligibility.homeHealthEligible) {
    await triggerAutomatedWorkflows(notification)
  }

  return notification
}

// Trigger automated workflows
async function triggerAutomatedWorkflows(notification: any) {
  try {
    // High-risk patient immediate alert
    if (notification.riskScore >= 85) {
      await sendHighRiskAlert(notification)
    }

    // Auto-assignment based on ZIP code
    if (notification.zipCode) {
      await autoAssignByZipCode(notification)
    }

    // Immediate facility contact for high-value patients
    if (notification.potentialValue >= 4000) {
      await scheduleImmediateContact(notification)
    }

    // Send real-time notifications
    await sendRealTimeNotifications(notification)
  } catch (error) {
    console.error("Error triggering automated workflows:", error)
  }
}

// Send high-risk patient alert
async function sendHighRiskAlert(notification: any) {
  console.log(`🚨 HIGH RISK ALERT: ${notification.patientName} - Risk Score: ${notification.riskScore}%`)

  // In production, send to Slack, Teams, or notification system
  // await sendSlackAlert({
  //   channel: '#high-risk-patients',
  //   message: `High-risk discharge: ${notification.patientName} from ${notification.facility}`,
  //   notification
  // })
}

// Auto-assign based on ZIP code
async function autoAssignByZipCode(notification: any) {
  const zipCodeAssignments: { [key: string]: string } = {
    "48201": "Jennifer Martinez, RN",
    "48067": "Robert Wilson, MSW",
    "48104": "Sarah Johnson, RN",
    "48309": "Michael Chen, RN",
    "48334": "Lisa Rodriguez, MSW",
  }

  const assignedTo = zipCodeAssignments[notification.zipCode]
  if (assignedTo) {
    console.log(`Auto-assigned ${notification.patientName} to ${assignedTo} based on ZIP ${notification.zipCode}`)

    // Update notification assignment
    notification.assignedTo = assignedTo
    notification.status = "reviewed"
  }
}

// Schedule immediate contact for high-value patients
async function scheduleImmediateContact(notification: any) {
  console.log(`💰 HIGH VALUE PATIENT: ${notification.patientName} - Potential Value: $${notification.potentialValue}`)

  // In production, create task in CRM or workflow system
  // await createContactTask({
  //   patientId: notification.patientId,
  //   priority: 'immediate',
  //   assignedTo: notification.assignedTo,
  //   dueDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
  //   notes: `High-value patient discharge - contact facility immediately`
  // })
}

// Send real-time notifications
async function sendRealTimeNotifications(notification: any) {
  // Email notification
  console.log(`📧 Email notification sent for ${notification.patientName}`)

  // SMS notification for high-risk patients
  if (notification.riskScore >= 80) {
    console.log(`📱 SMS alert sent for high-risk patient ${notification.patientName}`)
  }

  // Webhook to external systems
  // await sendWebhook({
  //   url: process.env.EXTERNAL_WEBHOOK_URL,
  //   payload: notification
  // })
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-mihin-signature")
    const body = await request.text()

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 401 })
    }

    const payload: MiHINWebhookPayload = JSON.parse(body)

    // Validate required fields
    if (!payload.eventType || !payload.patient || !payload.facility) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Process the ADT notification
    const notification = await processADTNotification(payload)

    console.log(`✅ Processed ${payload.eventType} notification for ${payload.patient.name}`)

    return NextResponse.json({
      success: true,
      message: "ADT notification processed successfully",
      notificationId: notification.id,
      eligibility: {
        homeHealthEligible: notification.homeHealthEligible,
        riskScore: notification.riskScore,
        potentialValue: notification.potentialValue,
      },
    })
  } catch (error) {
    console.error("Error processing MiHIN webhook:", error)
    return NextResponse.json({ success: false, error: "Failed to process webhook" }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "MiHIN webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
