import { type NextRequest, NextResponse } from "next/server"

interface MSWNotification {
  type: "referral_decision" | "eligibility_issue" | "prior_auth_required" | "insurance_denial" | "complex_case"
  priority: "low" | "medium" | "high" | "urgent"
  patientName: string
  referralId: string
  message: string
  actionRequired: string[]
  dueDate?: string
  assignedMSW?: string
}

export async function POST(request: NextRequest) {
  try {
    const notification: MSWNotification = await request.json()

    console.log("Creating MSW notification:", notification)

    // Determine which MSW to notify based on workload and specialization
    const assignedMSW = await assignMSW(notification)
    notification.assignedMSW = assignedMSW

    // Send notification via multiple channels
    await sendEmailNotification(notification)

    if (notification.priority === "urgent") {
      await sendSMSNotification(notification)
    }

    // Create task in MSW dashboard
    await createMSWTask(notification)

    // Log in audit trail
    await logNotification(notification)

    return NextResponse.json({
      success: true,
      notificationId: `MSW-${Date.now()}`,
      assignedMSW,
      deliveryMethods: notification.priority === "urgent" ? ["email", "sms", "dashboard"] : ["email", "dashboard"],
    })
  } catch (error) {
    console.error("MSW notification error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send MSW notification",
      },
      { status: 500 },
    )
  }
}

async function assignMSW(notification: MSWNotification): Promise<string> {
  // Simulate MSW assignment logic
  const mswTeam = [
    { name: "Jennifer Martinez, MSW", specialization: "insurance_issues", currentWorkload: 12 },
    { name: "Robert Chen, MSW", specialization: "complex_cases", currentWorkload: 8 },
    { name: "Sarah Williams, MSW", specialization: "prior_auth", currentWorkload: 15 },
    { name: "Michael Davis, MSW", specialization: "general", currentWorkload: 10 },
  ]

  // Assign based on specialization and workload
  let assignedMSW = mswTeam[0]

  if (notification.type === "prior_auth_required") {
    assignedMSW = mswTeam.find((msw) => msw.specialization === "prior_auth") || assignedMSW
  } else if (notification.type === "insurance_denial" || notification.type === "eligibility_issue") {
    assignedMSW = mswTeam.find((msw) => msw.specialization === "insurance_issues") || assignedMSW
  } else if (notification.type === "complex_case") {
    assignedMSW = mswTeam.find((msw) => msw.specialization === "complex_cases") || assignedMSW
  } else {
    // Assign to MSW with lowest workload
    assignedMSW = mswTeam.reduce((prev, current) => (prev.currentWorkload < current.currentWorkload ? prev : current))
  }

  return assignedMSW.name
}

async function sendEmailNotification(notification: MSWNotification) {
  // Simulate email sending via SendGrid
  console.log("Sending email notification to:", notification.assignedMSW)

  const emailContent = {
    to: getEmailForMSW(notification.assignedMSW),
    subject: `${notification.priority.toUpperCase()}: ${notification.type.replace("_", " ")} - ${notification.patientName}`,
    body: `
      Patient: ${notification.patientName}
      Referral ID: ${notification.referralId}
      Type: ${notification.type}
      Priority: ${notification.priority}
      
      Message: ${notification.message}
      
      Action Required:
      ${notification.actionRequired.map((action) => `- ${action}`).join("\n")}
      
      ${notification.dueDate ? `Due Date: ${notification.dueDate}` : ""}
      
      Please log into M.A.S.E to review and take action.
    `,
  }

  // In real implementation, use SendGrid API
  await new Promise((resolve) => setTimeout(resolve, 500))
}

async function sendSMSNotification(notification: MSWNotification) {
  // Simulate SMS sending via Twilio
  console.log("Sending SMS notification to:", notification.assignedMSW)

  const smsContent = `URGENT: ${notification.type} for ${notification.patientName}. ${notification.message}. Check M.A.S.E dashboard immediately.`

  // In real implementation, use Twilio API
  await new Promise((resolve) => setTimeout(resolve, 300))
}

async function createMSWTask(notification: MSWNotification) {
  // Create task in MSW dashboard
  console.log("Creating MSW task for:", notification.assignedMSW)

  const task = {
    id: `TASK-${Date.now()}`,
    type: notification.type,
    priority: notification.priority,
    patientName: notification.patientName,
    referralId: notification.referralId,
    assignedTo: notification.assignedMSW,
    status: "pending",
    createdAt: new Date().toISOString(),
    dueDate: notification.dueDate,
    actionRequired: notification.actionRequired,
  }

  // In real implementation, save to database
  await new Promise((resolve) => setTimeout(resolve, 200))
}

async function logNotification(notification: MSWNotification) {
  // Log notification in audit trail
  console.log("Logging notification in audit trail")

  const auditEntry = {
    timestamp: new Date().toISOString(),
    action: "msw_notification_sent",
    details: notification,
    userId: "system",
  }

  // In real implementation, save to audit log
  await new Promise((resolve) => setTimeout(resolve, 100))
}

function getEmailForMSW(mswName: string): string {
  // Mock email mapping
  const emailMap: Record<string, string> = {
    "Jennifer Martinez, MSW": "jennifer.martinez@company.com",
    "Robert Chen, MSW": "robert.chen@company.com",
    "Sarah Williams, MSW": "sarah.williams@company.com",
    "Michael Davis, MSW": "michael.davis@company.com",
  }

  return emailMap[mswName] || "msw-team@company.com"
}

export async function GET(request: NextRequest) {
  // Get MSW notifications/tasks
  const { searchParams } = new URL(request.url)
  const mswName = searchParams.get("msw")
  const status = searchParams.get("status")

  // Mock MSW tasks
  const mockTasks = [
    {
      id: "TASK-001",
      type: "prior_auth_required",
      priority: "high",
      patientName: "John Smith",
      referralId: "REF-001",
      assignedTo: "Jennifer Martinez, MSW",
      status: "pending",
      createdAt: "2024-01-22T10:30:00Z",
      dueDate: "2024-01-24T17:00:00Z",
      actionRequired: ["Submit prior authorization", "Contact insurance provider"],
    },
    {
      id: "TASK-002",
      type: "eligibility_issue",
      priority: "medium",
      patientName: "Mary Johnson",
      referralId: "REF-002",
      assignedTo: "Robert Chen, MSW",
      status: "in_progress",
      createdAt: "2024-01-22T09:15:00Z",
      actionRequired: ["Verify insurance coverage", "Contact patient for updated information"],
    },
  ]

  let filteredTasks = mockTasks

  if (mswName) {
    filteredTasks = filteredTasks.filter((task) => task.assignedTo === mswName)
  }

  if (status) {
    filteredTasks = filteredTasks.filter((task) => task.status === status)
  }

  return NextResponse.json({
    success: true,
    tasks: filteredTasks,
    totalCount: filteredTasks.length,
  })
}
