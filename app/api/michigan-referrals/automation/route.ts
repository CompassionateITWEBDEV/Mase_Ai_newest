import { type NextRequest, NextResponse } from "next/server"

interface AutomationRule {
  id: string
  name: string
  type: "acceptance" | "routing" | "notification" | "workflow"
  status: "active" | "inactive" | "pending"
  conditions: string[]
  actions: string[]
  priority: number
  createdAt: string
  lastTriggered?: string
  triggerCount: number
}

interface NotificationSetting {
  id: string
  name: string
  type: "email" | "sms" | "push" | "webhook"
  enabled: boolean
  recipients: string[]
  conditions: string[]
  template: string
}

interface WorkflowStep {
  id: string
  name: string
  type: "condition" | "action" | "delay" | "notification"
  config: Record<string, any>
  nextSteps: string[]
}

interface Workflow {
  id: string
  name: string
  description: string
  status: "active" | "inactive" | "draft"
  trigger: string
  steps: WorkflowStep[]
  createdAt: string
  lastRun?: string
  runCount: number
}

const automationRules: AutomationRule[] = [
  {
    id: "auto-accept-high",
    name: "Auto-Accept High Confidence",
    type: "acceptance",
    status: "active",
    conditions: ["confidence >= 85%", "insurance_verified = true", "geographic_match = true"],
    actions: ["accept_referral", "notify_intake_team", "schedule_soc"],
    priority: 1,
    createdAt: "2024-01-01",
    lastTriggered: "2024-01-15T10:30:00Z",
    triggerCount: 234,
  },
  {
    id: "route-review-medium",
    name: "Route for Review - Medium Confidence",
    type: "routing",
    status: "active",
    conditions: ["confidence 60-84%", "complex_diagnosis = true"],
    actions: ["route_to_msw", "set_priority_high", "notify_reviewer"],
    priority: 2,
    createdAt: "2024-01-01",
    lastTriggered: "2024-01-15T09:15:00Z",
    triggerCount: 156,
  },
  {
    id: "stat-alert",
    name: "STAT Referral Alert",
    type: "notification",
    status: "active",
    conditions: ["urgency = STAT", "source = hospital"],
    actions: ["immediate_notification", "escalate_to_director", "bypass_queue"],
    priority: 1,
    createdAt: "2024-01-01",
    lastTriggered: "2024-01-15T14:22:00Z",
    triggerCount: 45,
  },
  {
    id: "high-value-alert",
    name: "High-Value Referral Alert",
    type: "notification",
    status: "active",
    conditions: ["estimated_value > $5000", "episode_length > 60_days"],
    actions: ["notify_management", "priority_processing", "assign_senior_staff"],
    priority: 2,
    createdAt: "2024-01-01",
    lastTriggered: "2024-01-15T11:45:00Z",
    triggerCount: 89,
  },
  {
    id: "integration-failure",
    name: "Integration Failure Alert",
    type: "notification",
    status: "active",
    conditions: ["connection_failed = true", "retry_count > 3"],
    actions: ["notify_it_team", "log_incident", "switch_to_backup"],
    priority: 1,
    createdAt: "2024-01-01",
    lastTriggered: "2024-01-14T16:30:00Z",
    triggerCount: 12,
  },
]

const notificationSettings: NotificationSetting[] = [
  {
    id: "stat-notifications",
    name: "STAT Referral Notifications",
    type: "sms",
    enabled: true,
    recipients: ["+1234567890", "+1234567891"],
    conditions: ["urgency = STAT"],
    template: "URGENT: New STAT referral from {facility_name} for {patient_name}. Immediate attention required.",
  },
  {
    id: "high-value-email",
    name: "High-Value Referral Email",
    type: "email",
    enabled: true,
    recipients: ["director@masepro.com", "manager@masepro.com"],
    conditions: ["estimated_value > $5000"],
    template: "High-value referral received: {patient_name} from {facility_name}. Estimated value: ${estimated_value}",
  },
  {
    id: "integration-alerts",
    name: "Integration Status Alerts",
    type: "email",
    enabled: true,
    recipients: ["it@masepro.com", "admin@masepro.com"],
    conditions: ["integration_status = failed"],
    template: "Integration failure detected for {facility_name}. Please investigate immediately.",
  },
]

const workflows: Workflow[] = [
  {
    id: "new-referral-workflow",
    name: "New Referral Processing Workflow",
    description: "Complete workflow for processing new referrals from intake to acceptance",
    status: "active",
    trigger: "referral_received",
    steps: [
      {
        id: "parse-referral",
        name: "Parse Referral Data",
        type: "action",
        config: { action: "extract_data", ai_confidence_threshold: 0.8 },
        nextSteps: ["validate-insurance"],
      },
      {
        id: "validate-insurance",
        name: "Validate Insurance",
        type: "action",
        config: { action: "insurance_verification", timeout: 30 },
        nextSteps: ["check-geography"],
      },
      {
        id: "check-geography",
        name: "Check Geographic Coverage",
        type: "condition",
        config: { condition: "within_service_area", max_distance: 25 },
        nextSteps: ["calculate-confidence", "reject-geographic"],
      },
      {
        id: "calculate-confidence",
        name: "Calculate AI Confidence Score",
        type: "action",
        config: { action: "ai_scoring", model: "referral_acceptance_v2" },
        nextSteps: ["route-decision"],
      },
      {
        id: "route-decision",
        name: "Route Based on Confidence",
        type: "condition",
        config: {
          conditions: [
            { if: "confidence >= 85", then: "auto-accept" },
            { if: "confidence >= 60", then: "manual-review" },
            { else: "auto-reject" },
          ],
        },
        nextSteps: ["auto-accept", "manual-review", "auto-reject"],
      },
    ],
    createdAt: "2024-01-01",
    lastRun: "2024-01-15T15:30:00Z",
    runCount: 847,
  },
  {
    id: "follow-up-workflow",
    name: "Referral Follow-up Workflow",
    description: "Automated follow-up process for accepted referrals",
    status: "active",
    trigger: "referral_accepted",
    steps: [
      {
        id: "schedule-soc",
        name: "Schedule Start of Care",
        type: "action",
        config: { action: "schedule_appointment", window_hours: 48 },
        nextSteps: ["notify-patient"],
      },
      {
        id: "notify-patient",
        name: "Notify Patient",
        type: "notification",
        config: { method: "phone_call", template: "soc_confirmation" },
        nextSteps: ["update-ehr"],
      },
      {
        id: "update-ehr",
        name: "Update EHR Systems",
        type: "action",
        config: { action: "ehr_update", systems: ["axxess", "epic"] },
        nextSteps: ["generate-report"],
      },
    ],
    createdAt: "2024-01-01",
    lastRun: "2024-01-15T14:15:00Z",
    runCount: 669,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"

    let data: any = {}

    switch (type) {
      case "rules":
        data = { rules: automationRules }
        break
      case "notifications":
        data = { notifications: notificationSettings }
        break
      case "workflows":
        data = { workflows: workflows }
        break
      case "all":
      default:
        data = {
          rules: automationRules,
          notifications: notificationSettings,
          workflows: workflows,
          summary: {
            totalRules: automationRules.length,
            activeRules: automationRules.filter((r) => r.status === "active").length,
            totalWorkflows: workflows.length,
            activeWorkflows: workflows.filter((w) => w.status === "active").length,
            totalNotifications: notificationSettings.length,
            enabledNotifications: notificationSettings.filter((n) => n.enabled).length,
          },
        }
        break
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching automation data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch automation data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, action, data } = body

    switch (type) {
      case "rule":
        if (action === "create") {
          const newRule: AutomationRule = {
            id: `rule-${Date.now()}`,
            name: data.name,
            type: data.type,
            status: "active",
            conditions: data.conditions || [],
            actions: data.actions || [],
            priority: data.priority || 3,
            createdAt: new Date().toISOString(),
            triggerCount: 0,
          }
          automationRules.push(newRule)
          return NextResponse.json({ success: true, data: newRule })
        }
        break

      case "notification":
        if (action === "create") {
          const newNotification: NotificationSetting = {
            id: `notification-${Date.now()}`,
            name: data.name,
            type: data.type,
            enabled: true,
            recipients: data.recipients || [],
            conditions: data.conditions || [],
            template: data.template || "",
          }
          notificationSettings.push(newNotification)
          return NextResponse.json({ success: true, data: newNotification })
        }
        break

      case "workflow":
        if (action === "create") {
          const newWorkflow: Workflow = {
            id: `workflow-${Date.now()}`,
            name: data.name,
            description: data.description || "",
            status: "draft",
            trigger: data.trigger,
            steps: data.steps || [],
            createdAt: new Date().toISOString(),
            runCount: 0,
          }
          workflows.push(newWorkflow)
          return NextResponse.json({ success: true, data: newWorkflow })
        }
        break

      case "trigger":
        if (action === "execute") {
          console.log(`Triggering automation: ${data.id}`)
          // Simulate automation execution
          return NextResponse.json({
            success: true,
            message: `Automation ${data.id} triggered successfully`,
            executionId: `exec-${Date.now()}`,
          })
        }
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid automation type" }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing automation action:", error)
    return NextResponse.json({ success: false, error: "Failed to process automation action" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, updates } = body

    switch (type) {
      case "rule":
        const ruleIndex = automationRules.findIndex((r) => r.id === id)
        if (ruleIndex >= 0) {
          automationRules[ruleIndex] = { ...automationRules[ruleIndex], ...updates }
          return NextResponse.json({ success: true, data: automationRules[ruleIndex] })
        }
        break

      case "notification":
        const notificationIndex = notificationSettings.findIndex((n) => n.id === id)
        if (notificationIndex >= 0) {
          notificationSettings[notificationIndex] = { ...notificationSettings[notificationIndex], ...updates }
          return NextResponse.json({ success: true, data: notificationSettings[notificationIndex] })
        }
        break

      case "workflow":
        const workflowIndex = workflows.findIndex((w) => w.id === id)
        if (workflowIndex >= 0) {
          workflows[workflowIndex] = { ...workflows[workflowIndex], ...updates }
          return NextResponse.json({ success: true, data: workflows[workflowIndex] })
        }
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 })
  } catch (error) {
    console.error("Error updating automation item:", error)
    return NextResponse.json({ success: false, error: "Failed to update automation item" }, { status: 500 })
  }
}
