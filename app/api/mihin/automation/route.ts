import { type NextRequest, NextResponse } from "next/server"

interface AutomationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  trigger: {
    type: "risk_score" | "diagnosis" | "facility" | "insurance" | "age" | "event_type"
    condition: "equals" | "greater_than" | "less_than" | "contains" | "in_list"
    value: any
  }
  actions: Array<{
    type: "assign" | "notify" | "contact" | "escalate" | "tag"
    parameters: any
  }>
  priority: number
  createdAt: string
  lastTriggered?: string
  triggerCount: number
}

interface ContactWorkflow {
  id: string
  name: string
  description: string
  enabled: boolean
  steps: Array<{
    order: number
    type: "call" | "email" | "sms" | "wait" | "assign"
    delay: number // minutes
    parameters: any
  }>
  triggerConditions: {
    riskScore?: number
    diagnoses?: string[]
    facilities?: string[]
    insurance?: string[]
  }
}

// Mock automation rules
let automationRules: AutomationRule[] = [
  {
    id: "rule-001",
    name: "High-Risk Discharge Alert",
    description: "Immediate alert for patients with risk score ≥ 85%",
    enabled: true,
    trigger: {
      type: "risk_score",
      condition: "greater_than",
      value: 85,
    },
    actions: [
      {
        type: "notify",
        parameters: {
          channels: ["email", "sms", "slack"],
          recipients: ["manager@masepro.com", "+1234567890"],
          message: "High-risk patient discharge requires immediate attention",
        },
      },
      {
        type: "assign",
        parameters: {
          assignTo: "priority_team",
          priority: "urgent",
        },
      },
    ],
    priority: 1,
    createdAt: "2024-01-01T00:00:00Z",
    lastTriggered: "2024-01-15T14:25:00Z",
    triggerCount: 23,
  },
  {
    id: "rule-002",
    name: "Auto-Assign by ZIP Code",
    description: "Automatically assign patients based on service area",
    enabled: true,
    trigger: {
      type: "event_type",
      condition: "equals",
      value: "discharge",
    },
    actions: [
      {
        type: "assign",
        parameters: {
          zipCodeMapping: {
            "48201": "Jennifer Martinez, RN",
            "48067": "Robert Wilson, MSW",
            "48104": "Sarah Johnson, RN",
            "48309": "Michael Chen, RN",
            "48334": "Lisa Rodriguez, MSW",
          },
        },
      },
    ],
    priority: 2,
    createdAt: "2024-01-01T00:00:00Z",
    lastTriggered: "2024-01-15T16:50:00Z",
    triggerCount: 156,
  },
  {
    id: "rule-003",
    name: "Heart Failure Protocol",
    description: "Special handling for heart failure patients",
    enabled: true,
    trigger: {
      type: "diagnosis",
      condition: "contains",
      value: "heart failure",
    },
    actions: [
      {
        type: "tag",
        parameters: {
          tags: ["heart_failure", "high_priority"],
        },
      },
      {
        type: "contact",
        parameters: {
          method: "immediate_call",
          script: "heart_failure_discharge_script",
        },
      },
    ],
    priority: 1,
    createdAt: "2024-01-01T00:00:00Z",
    lastTriggered: "2024-01-15T18:35:00Z",
    triggerCount: 34,
  },
]

// Mock contact workflows
let contactWorkflows: ContactWorkflow[] = [
  {
    id: "workflow-001",
    name: "Standard Discharge Follow-up",
    description: "Standard 4-step follow-up process for all discharges",
    enabled: true,
    steps: [
      {
        order: 1,
        type: "call",
        delay: 0,
        parameters: {
          target: "facility",
          script: "discharge_inquiry_script",
          maxAttempts: 3,
        },
      },
      {
        order: 2,
        type: "wait",
        delay: 30,
        parameters: {},
      },
      {
        order: 3,
        type: "call",
        delay: 0,
        parameters: {
          target: "patient_family",
          script: "patient_outreach_script",
          maxAttempts: 2,
        },
      },
      {
        order: 4,
        type: "email",
        delay: 60,
        parameters: {
          template: "physician_notification",
          recipients: ["physician", "case_manager"],
        },
      },
    ],
    triggerConditions: {
      riskScore: 70,
    },
  },
  {
    id: "workflow-002",
    name: "High-Risk Rapid Response",
    description: "Expedited process for high-risk patients",
    enabled: true,
    steps: [
      {
        order: 1,
        type: "assign",
        delay: 0,
        parameters: {
          assignTo: "senior_clinician",
          priority: "urgent",
        },
      },
      {
        order: 2,
        type: "call",
        delay: 5,
        parameters: {
          target: "facility",
          script: "urgent_discharge_script",
          maxAttempts: 5,
        },
      },
      {
        order: 3,
        type: "sms",
        delay: 10,
        parameters: {
          template: "urgent_patient_contact",
          recipients: ["patient", "emergency_contact"],
        },
      },
      {
        order: 4,
        type: "escalate",
        delay: 30,
        parameters: {
          escalateTo: "manager",
          reason: "high_risk_no_contact",
        },
      },
    ],
    triggerConditions: {
      riskScore: 85,
      diagnoses: ["heart failure", "stroke", "sepsis"],
    },
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (type === "rules") {
      return NextResponse.json({
        success: true,
        data: automationRules,
      })
    }

    if (type === "workflows") {
      return NextResponse.json({
        success: true,
        data: contactWorkflows,
      })
    }

    // Return both rules and workflows
    return NextResponse.json({
      success: true,
      data: {
        rules: automationRules,
        workflows: contactWorkflows,
        stats: {
          totalRules: automationRules.length,
          activeRules: automationRules.filter((r) => r.enabled).length,
          totalWorkflows: contactWorkflows.length,
          activeWorkflows: contactWorkflows.filter((w) => w.enabled).length,
          totalTriggers: automationRules.reduce((sum, r) => sum + r.triggerCount, 0),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching automation configuration:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch automation configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (type === "rule") {
      const newRule: AutomationRule = {
        id: `rule-${Date.now()}`,
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? true,
        trigger: data.trigger,
        actions: data.actions,
        priority: data.priority ?? 5,
        createdAt: new Date().toISOString(),
        triggerCount: 0,
      }

      automationRules.push(newRule)

      return NextResponse.json({
        success: true,
        message: "Automation rule created successfully",
        data: newRule,
      })
    }

    if (type === "workflow") {
      const newWorkflow: ContactWorkflow = {
        id: `workflow-${Date.now()}`,
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? true,
        steps: data.steps,
        triggerConditions: data.triggerConditions,
      }

      contactWorkflows.push(newWorkflow)

      return NextResponse.json({
        success: true,
        message: "Contact workflow created successfully",
        data: newWorkflow,
      })
    }

    return NextResponse.json({ success: false, error: "Invalid type specified" }, { status: 400 })
  } catch (error) {
    console.error("Error creating automation:", error)
    return NextResponse.json({ success: false, error: "Failed to create automation" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, data, action } = body

    if (action === "toggle") {
      if (type === "rule") {
        automationRules = automationRules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
      } else if (type === "workflow") {
        contactWorkflows = contactWorkflows.map((workflow) =>
          workflow.id === id ? { ...workflow, enabled: !workflow.enabled } : workflow,
        )
      }

      return NextResponse.json({
        success: true,
        message: `${type} toggled successfully`,
      })
    }

    if (action === "execute") {
      // Execute automation rule or workflow manually
      if (type === "rule") {
        const rule = automationRules.find((r) => r.id === id)
        if (!rule) {
          return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 })
        }

        // Simulate rule execution
        await executeAutomationRule(rule, data.notification)

        // Update trigger count
        automationRules = automationRules.map((r) =>
          r.id === id
            ? {
                ...r,
                triggerCount: r.triggerCount + 1,
                lastTriggered: new Date().toISOString(),
              }
            : r,
        )

        return NextResponse.json({
          success: true,
          message: "Automation rule executed successfully",
        })
      }

      if (type === "workflow") {
        const workflow = contactWorkflows.find((w) => w.id === id)
        if (!workflow) {
          return NextResponse.json({ success: false, error: "Workflow not found" }, { status: 404 })
        }

        // Simulate workflow execution
        await executeContactWorkflow(workflow, data.notification)

        return NextResponse.json({
          success: true,
          message: "Contact workflow executed successfully",
        })
      }
    }

    // Update automation rule or workflow
    if (type === "rule") {
      automationRules = automationRules.map((rule) => (rule.id === id ? { ...rule, ...data } : rule))
    } else if (type === "workflow") {
      contactWorkflows = contactWorkflows.map((workflow) => (workflow.id === id ? { ...workflow, ...data } : workflow))
    }

    return NextResponse.json({
      success: true,
      message: `${type} updated successfully`,
    })
  } catch (error) {
    console.error("Error updating automation:", error)
    return NextResponse.json({ success: false, error: "Failed to update automation" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    if (!type || !id) {
      return NextResponse.json({ success: false, error: "Type and ID are required" }, { status: 400 })
    }

    if (type === "rule") {
      automationRules = automationRules.filter((rule) => rule.id !== id)
    } else if (type === "workflow") {
      contactWorkflows = contactWorkflows.filter((workflow) => workflow.id !== id)
    }

    return NextResponse.json({
      success: true,
      message: `${type} deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting automation:", error)
    return NextResponse.json({ success: false, error: "Failed to delete automation" }, { status: 500 })
  }
}

// Execute automation rule
async function executeAutomationRule(rule: AutomationRule, notification: any) {
  console.log(`Executing automation rule: ${rule.name}`)

  for (const action of rule.actions) {
    switch (action.type) {
      case "notify":
        await sendNotification(action.parameters, notification)
        break
      case "assign":
        await assignNotification(action.parameters, notification)
        break
      case "contact":
        await initiateContact(action.parameters, notification)
        break
      case "escalate":
        await escalateNotification(action.parameters, notification)
        break
      case "tag":
        await tagNotification(action.parameters, notification)
        break
    }
  }
}

// Execute contact workflow
async function executeContactWorkflow(workflow: ContactWorkflow, notification: any) {
  console.log(`Executing contact workflow: ${workflow.name}`)

  for (const step of workflow.steps.sort((a, b) => a.order - b.order)) {
    if (step.delay > 0) {
      console.log(`Waiting ${step.delay} minutes before next step...`)
      // In production, schedule the next step
    }

    switch (step.type) {
      case "call":
        await makePhoneCall(step.parameters, notification)
        break
      case "email":
        await sendEmail(step.parameters, notification)
        break
      case "sms":
        await sendSMS(step.parameters, notification)
        break
      case "assign":
        await assignNotification(step.parameters, notification)
        break
      case "wait":
        // Handled above
        break
    }
  }
}

// Helper functions for automation actions
async function sendNotification(parameters: any, notification: any) {
  console.log(`📧 Sending notification: ${parameters.message}`)
  // In production, integrate with email/SMS/Slack services
}

async function assignNotification(parameters: any, notification: any) {
  console.log(`👤 Assigning notification to: ${parameters.assignTo}`)
  // In production, update notification assignment in database
}

async function initiateContact(parameters: any, notification: any) {
  console.log(`📞 Initiating contact: ${parameters.method}`)
  // In production, create contact task or make API call
}

async function escalateNotification(parameters: any, notification: any) {
  console.log(`⬆️ Escalating to: ${parameters.escalateTo}`)
  // In production, notify manager or create urgent task
}

async function tagNotification(parameters: any, notification: any) {
  console.log(`🏷️ Adding tags: ${parameters.tags.join(", ")}`)
  // In production, update notification tags in database
}

async function makePhoneCall(parameters: any, notification: any) {
  console.log(`📞 Making phone call to: ${parameters.target}`)
  // In production, integrate with Twilio or other phone service
}

async function sendEmail(parameters: any, notification: any) {
  console.log(`📧 Sending email using template: ${parameters.template}`)
  // In production, integrate with SendGrid or other email service
}

async function sendSMS(parameters: any, notification: any) {
  console.log(`📱 Sending SMS using template: ${parameters.template}`)
  // In production, integrate with Twilio SMS service
}
