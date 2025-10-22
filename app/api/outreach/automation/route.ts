import { type NextRequest, NextResponse } from "next/server"

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: {
    type: "email_opened" | "email_not_opened" | "no_response" | "facility_status_change" | "time_based"
    conditions: Record<string, any>
  }
  actions: {
    type: "send_email" | "send_sms" | "schedule_call" | "update_status" | "notify_team"
    parameters: Record<string, any>
    delay?: number // in hours
  }[]
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
  performance: {
    triggered: number
    successful: number
    failed: number
    lastTriggered?: string
  }
  targetCriteria?: {
    facilityTypes?: string[]
    priority?: string[]
    status?: string[]
  }
}

// Mock data - replace with actual database operations
const mockAutomationRules: AutomationRule[] = [
  {
    id: "1",
    name: "Auto Follow-up Email",
    description: "Send follow-up email 3 days after initial email is opened but no response received",
    trigger: {
      type: "no_response",
      conditions: {
        emailOpened: true,
        daysSinceOpened: 3,
        responseReceived: false,
      },
    },
    actions: [
      {
        type: "send_email",
        parameters: {
          templateId: "followup-email-1",
          personalization: "medium",
        },
        delay: 0,
      },
    ],
    isActive: true,
    priority: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    performance: {
      triggered: 45,
      successful: 42,
      failed: 3,
      lastTriggered: "2024-01-20T10:30:00Z",
    },
    targetCriteria: {
      facilityTypes: ["SNF", "Hospital"],
      priority: ["high", "medium"],
    },
  },
  {
    id: "2",
    name: "Escalate to Phone Call",
    description: "Schedule phone call after 2 email attempts with no response",
    trigger: {
      type: "no_response",
      conditions: {
        emailsSent: 2,
        daysSinceLastEmail: 7,
        responseReceived: false,
      },
    },
    actions: [
      {
        type: "schedule_call",
        parameters: {
          priority: "medium",
          assignTo: "sales_team",
          notes: "Follow up on email campaign - no response to 2 emails",
        },
        delay: 0,
      },
      {
        type: "notify_team",
        parameters: {
          team: "sales",
          message: "High-priority facility needs phone follow-up",
          urgency: "medium",
        },
        delay: 0,
      },
    ],
    isActive: true,
    priority: 2,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-18T00:00:00Z",
    performance: {
      triggered: 23,
      successful: 20,
      failed: 3,
      lastTriggered: "2024-01-19T14:15:00Z",
    },
    targetCriteria: {
      priority: ["high"],
    },
  },
  {
    id: "3",
    name: "High-Value Facility Alert",
    description: "Immediately notify sales team when high-value facility shows interest",
    trigger: {
      type: "facility_status_change",
      conditions: {
        statusChangedTo: "interested",
        potentialValue: { min: 50000 },
      },
    },
    actions: [
      {
        type: "notify_team",
        parameters: {
          team: "sales",
          message: "High-value facility ({{facility_name}}) showed interest - immediate follow-up required",
          urgency: "high",
          assignTo: "senior_sales",
        },
        delay: 0,
      },
      {
        type: "send_sms",
        parameters: {
          templateId: "urgent-followup-sms",
          sendTo: "facility_contact",
        },
        delay: 2, // 2 hours after notification
      },
    ],
    isActive: true,
    priority: 0, // Highest priority
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
    performance: {
      triggered: 8,
      successful: 8,
      failed: 0,
      lastTriggered: "2024-01-20T16:45:00Z",
    },
    targetCriteria: {
      priority: ["high"],
    },
  },
  {
    id: "4",
    name: "Weekly Nurture Sequence",
    description: "Send weekly educational content to facilities that haven't converted",
    trigger: {
      type: "time_based",
      conditions: {
        frequency: "weekly",
        dayOfWeek: "tuesday",
        time: "10:00",
        facilityStatus: ["contacted", "interested"],
      },
    },
    actions: [
      {
        type: "send_email",
        parameters: {
          templateId: "educational-content-1",
          personalization: "high",
          trackEngagement: true,
        },
        delay: 0,
      },
    ],
    isActive: true,
    priority: 3,
    createdAt: "2024-01-12T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
    performance: {
      triggered: 156,
      successful: 148,
      failed: 8,
      lastTriggered: "2024-01-16T10:00:00Z",
    },
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("active")
    const triggerType = searchParams.get("trigger")
    const priority = searchParams.get("priority")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredRules = mockAutomationRules

    // Filter by active status
    if (isActive !== null) {
      filteredRules = filteredRules.filter((rule) => rule.isActive === (isActive === "true"))
    }

    // Filter by trigger type
    if (triggerType && triggerType !== "all") {
      filteredRules = filteredRules.filter((rule) => rule.trigger.type === triggerType)
    }

    // Filter by priority
    if (priority !== null && priority !== "all") {
      filteredRules = filteredRules.filter((rule) => rule.priority === Number.parseInt(priority))
    }

    // Sort by priority (lower number = higher priority)
    filteredRules.sort((a, b) => a.priority - b.priority)

    // Pagination
    const paginatedRules = filteredRules.slice(offset, offset + limit)

    return NextResponse.json({
      rules: paginatedRules,
      total: filteredRules.length,
      hasMore: offset + limit < filteredRules.length,
    })
  } catch (error) {
    console.error("Error fetching automation rules:", error)
    return NextResponse.json({ error: "Failed to fetch automation rules" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["name", "trigger", "actions"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate trigger structure
    if (!body.trigger.type || !body.trigger.conditions) {
      return NextResponse.json({ error: "Invalid trigger structure" }, { status: 400 })
    }

    // Validate actions structure
    if (!Array.isArray(body.actions) || body.actions.length === 0) {
      return NextResponse.json({ error: "Actions must be a non-empty array" }, { status: 400 })
    }

    // Create new automation rule
    const newRule: AutomationRule = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description || "",
      trigger: body.trigger,
      actions: body.actions,
      isActive: body.isActive !== false,
      priority: body.priority || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      performance: {
        triggered: 0,
        successful: 0,
        failed: 0,
      },
      targetCriteria: body.targetCriteria,
    }

    // In a real app, save to database
    mockAutomationRules.push(newRule)

    return NextResponse.json(
      {
        rule: newRule,
        message: "Automation rule created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating automation rule:", error)
    return NextResponse.json({ error: "Failed to create automation rule" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })
    }

    // Find and update rule
    const ruleIndex = mockAutomationRules.findIndex((r) => r.id === id)
    if (ruleIndex === -1) {
      return NextResponse.json({ error: "Automation rule not found" }, { status: 404 })
    }

    mockAutomationRules[ruleIndex] = {
      ...mockAutomationRules[ruleIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      rule: mockAutomationRules[ruleIndex],
      message: "Automation rule updated successfully",
    })
  } catch (error) {
    console.error("Error updating automation rule:", error)
    return NextResponse.json({ error: "Failed to update automation rule" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 })
    }

    // Find and delete rule
    const ruleIndex = mockAutomationRules.findIndex((r) => r.id === id)
    if (ruleIndex === -1) {
      return NextResponse.json({ error: "Automation rule not found" }, { status: 404 })
    }

    mockAutomationRules.splice(ruleIndex, 1)

    return NextResponse.json({
      message: "Automation rule deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting automation rule:", error)
    return NextResponse.json({ error: "Failed to delete automation rule" }, { status: 500 })
  }
}
