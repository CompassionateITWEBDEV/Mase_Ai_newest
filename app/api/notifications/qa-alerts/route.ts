import { type NextRequest, NextResponse } from "next/server"

// Enhanced QA Alert System with Clinical Director/QA RN Notifications
export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    alertType,
    documentId,
    patientName,
    urgency,
    assignedTo,
    approvalLevel,
    dueDate,
    qualityFlags,
    aiScore,
    clinicalConcerns,
  } = body

  // Define notification recipients based on approval level and urgency
  const notificationRecipients = {
    qa_rn: [
      {
        id: "QA-001",
        name: "Jennifer Adams, RN",
        email: "j.adams@company.com",
        phone: "+1-555-0101",
        credentials: "RN, BSN, COS-C",
        role: "Senior QA RN",
        preferredMethod: "email",
      },
      {
        id: "QA-002",
        name: "Patricia Wilson, RN",
        email: "p.wilson@company.com",
        phone: "+1-555-0102",
        credentials: "RN, MSN, CHPN",
        role: "QA RN",
        preferredMethod: "sms",
      },
    ],
    clinical_director: [
      {
        id: "CD-001",
        name: "Dr. Michael Rodriguez",
        email: "m.rodriguez@company.com",
        phone: "+1-555-0201",
        credentials: "MD, Internal Medicine",
        role: "Clinical Director",
        preferredMethod: "email",
      },
      {
        id: "CD-002",
        name: "Dr. Sarah Thompson",
        email: "s.thompson@company.com",
        phone: "+1-555-0202",
        credentials: "MD, Family Medicine",
        role: "Associate Clinical Director",
        preferredMethod: "email",
      },
    ],
    compliance: [
      {
        id: "COMP-001",
        name: "Lisa Chen",
        email: "l.chen@company.com",
        phone: "+1-555-0301",
        role: "Compliance Officer",
        preferredMethod: "email",
      },
    ],
  }

  // Determine notification urgency and routing
  const urgencyConfig = {
    low: {
      deliveryMethod: ["email"],
      escalationTime: 24 * 60 * 60 * 1000, // 24 hours
      retryAttempts: 2,
    },
    medium: {
      deliveryMethod: ["email", "dashboard"],
      escalationTime: 12 * 60 * 60 * 1000, // 12 hours
      retryAttempts: 3,
    },
    high: {
      deliveryMethod: ["email", "sms", "dashboard"],
      escalationTime: 4 * 60 * 60 * 1000, // 4 hours
      retryAttempts: 5,
    },
    urgent: {
      deliveryMethod: ["email", "sms", "phone", "dashboard"],
      escalationTime: 1 * 60 * 60 * 1000, // 1 hour
      retryAttempts: 10,
      requiresImmediate: true,
    },
  }

  const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.medium

  // Create comprehensive alert with clinical context
  const alert = {
    id: `ALERT-${Date.now()}`,
    type: alertType,
    documentId,
    patientName,
    urgency,
    assignedTo,
    approvalLevel,
    dueDate,
    createdAt: new Date().toISOString(),

    // Clinical Context
    clinicalContext: {
      aiScore,
      qualityFlags,
      clinicalConcerns: clinicalConcerns || [],
      riskLevel: aiScore < 75 ? "high" : aiScore < 85 ? "medium" : "low",
      complianceImpact: qualityFlags > 3 ? "high" : qualityFlags > 1 ? "medium" : "low",
    },

    // Notification Configuration
    notificationConfig: {
      deliveryMethods: config.deliveryMethod,
      escalationTime: config.escalationTime,
      retryAttempts: config.retryAttempts,
      requiresImmediate: config.requiresImmediate || false,
    },

    // Alert Content Templates
    alertTemplates: {
      email: {
        subject: generateEmailSubject(alertType, patientName, urgency),
        body: generateEmailBody(alertType, {
          patientName,
          documentId,
          aiScore,
          qualityFlags,
          dueDate,
          assignedTo,
          approvalLevel,
        }),
        priority: urgency === "urgent" ? "high" : "normal",
      },
      sms: {
        message: generateSMSMessage(alertType, patientName, urgency, documentId),
        shortCode: "OASIS-QA",
      },
      dashboard: {
        title: `${alertType.replace(/_/g, " ").toUpperCase()}: ${patientName}`,
        message: `AI Score: ${aiScore}% | Flags: ${qualityFlags} | Due: ${new Date(dueDate).toLocaleDateString()}`,
        actionRequired: true,
        actionUrl: `/oasis-qa?document=${documentId}`,
      },
    },
  }

  // Determine recipients based on approval level
  let recipients: any[] = []

  if (approvalLevel === "qa_rn" || approvalLevel === "both") {
    recipients = [...recipients, ...notificationRecipients.qa_rn]
  }

  if (approvalLevel === "clinical_director" || approvalLevel === "both") {
    recipients = [...recipients, ...notificationRecipients.clinical_director]
  }

  // Add compliance team for high-risk cases
  if (urgency === "urgent" || aiScore < 75) {
    recipients = [...recipients, ...notificationRecipients.compliance]
  }

  // Send notifications through multiple channels
  const notificationResults = []

  for (const recipient of recipients) {
    for (const method of config.deliveryMethod) {
      if (recipient.preferredMethod === method || urgency === "urgent") {
        const result = await sendNotification(method, recipient, alert)
        notificationResults.push({
          recipient: recipient.name,
          method,
          status: result.success ? "sent" : "failed",
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  // Log alert for audit trail
  const auditLog = {
    alertId: alert.id,
    documentId,
    alertType,
    urgency,
    approvalLevel,
    recipientCount: recipients.length,
    notificationsSent: notificationResults.filter((r) => r.status === "sent").length,
    notificationsFailed: notificationResults.filter((r) => r.status === "failed").length,
    clinicalContext: alert.clinicalContext,
    timestamp: new Date().toISOString(),
  }

  // Schedule escalation if required
  if (config.escalationTime && urgency !== "low") {
    await scheduleEscalation(alert.id, config.escalationTime)
  }

  return NextResponse.json({
    success: true,
    alert,
    notificationResults,
    auditLog,
    message: `QA alert sent to ${recipients.length} recipients via ${config.deliveryMethod.length} channels`,
    escalationScheduled: config.escalationTime ? true : false,
    complianceStatus: "CLINICAL_OVERSIGHT_NOTIFIED",
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const alertType = searchParams.get("alertType")
  const urgency = searchParams.get("urgency")
  const approvalLevel = searchParams.get("approvalLevel")
  const recipientId = searchParams.get("recipientId")

  // Mock alert history with clinical oversight tracking
  const alertHistory = [
    {
      id: "ALERT-001",
      type: "qa_review_required",
      patientName: "Margaret Anderson",
      documentId: "OASIS-2024-001",
      urgency: "medium",
      approvalLevel: "qa_rn",
      assignedTo: "Jennifer Adams, RN",
      createdAt: "2024-01-16T10:33:00Z",
      status: "acknowledged",
      acknowledgedBy: "Jennifer Adams, RN",
      acknowledgedAt: "2024-01-16T10:45:00Z",
      clinicalContext: {
        aiScore: 87,
        qualityFlags: 2,
        riskLevel: "medium",
      },
    },
    {
      id: "ALERT-002",
      type: "clinical_director_approval_required",
      patientName: "Dorothy Williams",
      documentId: "OASIS-2024-003",
      urgency: "high",
      approvalLevel: "clinical_director",
      assignedTo: "Dr. Michael Rodriguez",
      createdAt: "2024-01-16T14:20:00Z",
      status: "pending",
      clinicalContext: {
        aiScore: 78,
        qualityFlags: 4,
        riskLevel: "high",
        clinicalConcerns: ["Medication reconciliation incomplete", "Functional assessment inconsistency"],
      },
    },
    {
      id: "ALERT-003",
      type: "urgent_review_required",
      patientName: "James Patterson",
      documentId: "OASIS-2024-005",
      urgency: "urgent",
      approvalLevel: "both",
      assignedTo: "QA Team & Clinical Director",
      createdAt: "2024-01-16T16:10:00Z",
      status: "escalated",
      escalatedAt: "2024-01-16T17:10:00Z",
      clinicalContext: {
        aiScore: 72,
        qualityFlags: 6,
        riskLevel: "high",
        complianceImpact: "high",
      },
    },
  ]

  // Filter alerts based on query parameters
  let filteredAlerts = alertHistory

  if (alertType) {
    filteredAlerts = filteredAlerts.filter((alert) => alert.type === alertType)
  }

  if (urgency) {
    filteredAlerts = filteredAlerts.filter((alert) => alert.urgency === urgency)
  }

  if (approvalLevel) {
    filteredAlerts = filteredAlerts.filter((alert) => alert.approvalLevel === approvalLevel)
  }

  // Alert statistics
  const alertStats = {
    total: alertHistory.length,
    pending: alertHistory.filter((a) => a.status === "pending").length,
    acknowledged: alertHistory.filter((a) => a.status === "acknowledged").length,
    escalated: alertHistory.filter((a) => a.status === "escalated").length,
    byUrgency: {
      low: alertHistory.filter((a) => a.urgency === "low").length,
      medium: alertHistory.filter((a) => a.urgency === "medium").length,
      high: alertHistory.filter((a) => a.urgency === "high").length,
      urgent: alertHistory.filter((a) => a.urgency === "urgent").length,
    },
    byApprovalLevel: {
      qa_rn: alertHistory.filter((a) => a.approvalLevel === "qa_rn").length,
      clinical_director: alertHistory.filter((a) => a.approvalLevel === "clinical_director").length,
      both: alertHistory.filter((a) => a.approvalLevel === "both").length,
    },
    averageResponseTime: "2.3 hours",
    escalationRate: "12%",
  }

  return NextResponse.json({
    success: true,
    alerts: filteredAlerts,
    alertStats,
    message: "QA alerts retrieved successfully",
    complianceStatus: "CLINICAL_OVERSIGHT_ACTIVE",
  })
}

// Helper function to generate email subject
function generateEmailSubject(alertType: string, patientName: string, urgency: string): string {
  const urgencyPrefix = urgency === "urgent" ? "[URGENT] " : urgency === "high" ? "[HIGH] " : ""

  const subjectTemplates = {
    qa_review_required: `${urgencyPrefix}QA Review Required - ${patientName}`,
    clinical_director_approval_required: `${urgencyPrefix}Clinical Director Approval Required - ${patientName}`,
    urgent_review_required: `${urgencyPrefix}URGENT: Clinical Review Required - ${patientName}`,
    compliance_alert: `${urgencyPrefix}Compliance Alert - ${patientName}`,
    quality_flag_detected: `${urgencyPrefix}Quality Flags Detected - ${patientName}`,
  }

  return (
    subjectTemplates[alertType as keyof typeof subjectTemplates] || `${urgencyPrefix}OASIS QA Alert - ${patientName}`
  )
}

// Helper function to generate email body
function generateEmailBody(alertType: string, context: any): string {
  const { patientName, documentId, aiScore, qualityFlags, dueDate, assignedTo, approvalLevel } = context

  return `
Dear Clinical Team,

This is an automated notification regarding OASIS quality assurance requiring your immediate attention.

PATIENT INFORMATION:
- Patient: ${patientName}
- Document ID: ${documentId}
- AI Quality Score: ${aiScore}%
- Quality Flags: ${qualityFlags}
- Due Date: ${new Date(dueDate).toLocaleDateString()}

APPROVAL REQUIRED:
- Level: ${approvalLevel.replace(/_/g, " ").toUpperCase()}
- Assigned To: ${assignedTo}

CLINICAL OVERSIGHT REQUIRED:
This assessment requires clinical director approval before submission to Axxess. Please review the AI analysis findings and provide your clinical judgment.

ACTION REQUIRED:
1. Review the OASIS assessment and AI analysis
2. Validate clinical accuracy and completeness
3. Provide approval or request revisions
4. Document clinical rationale for approval decision

Please access the QA dashboard to complete your review: [Dashboard Link]

For urgent matters, please contact the QA team immediately.

Best regards,
OASIS QA System
Clinical Quality Assurance Team
  `.trim()
}

// Helper function to generate SMS message
function generateSMSMessage(alertType: string, patientName: string, urgency: string, documentId: string): string {
  const urgencyPrefix = urgency === "urgent" ? "URGENT: " : ""
  return `${urgencyPrefix}OASIS QA Alert - ${patientName} (${documentId}) requires clinical approval. Review dashboard immediately.`
}

// Helper function to send notifications
async function sendNotification(
  method: string,
  recipient: any,
  alert: any,
): Promise<{ success: boolean; messageId?: string }> {
  // Mock notification sending - in production, integrate with actual services
  const delay = Math.random() * 1000 + 500
  await new Promise((resolve) => setTimeout(resolve, delay))

  // Simulate occasional failures for testing
  const success = Math.random() > 0.05 // 95% success rate

  return {
    success,
    messageId: success ? `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined,
  }
}

// Helper function to schedule escalation
async function scheduleEscalation(alertId: string, escalationTime: number): Promise<void> {
  // In production, this would schedule a job or set a timer
  console.log(`Escalation scheduled for alert ${alertId} in ${escalationTime}ms`)
}
