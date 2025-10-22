import { type NextRequest, NextResponse } from "next/server"

interface Template {
  id: string
  name: string
  type: "email" | "sms" | "phone"
  subject?: string
  content: string
  variables: string[]
  performance: {
    sent: number
    opened: number
    responded: number
    converted: number
  }
  createdAt: string
  updatedAt: string
  isActive: boolean
  tags: string[]
}

// Mock data - replace with actual database operations
const mockTemplates: Template[] = [
  {
    id: "1",
    name: "SNF Introduction Email",
    type: "email",
    subject: "Partnership Opportunity with {{facility_name}}",
    content: `Dear {{contact_name}},

I hope this email finds you well. I'm reaching out to introduce our homecare services and explore potential partnership opportunities with {{facility_name}}.

Our comprehensive homecare services include:
• Skilled nursing care
• Physical and occupational therapy
• Wound care management
• Medication management
• 24/7 on-call support

We understand the importance of seamless transitions for your patients, and we're committed to providing exceptional care that supports your facility's reputation for excellence.

I'd love to schedule a brief 15-minute call to discuss how we can support {{facility_name}}'s discharge planning needs.

Best regards,
{{sender_name}}
{{company_name}}
{{phone_number}}`,
    variables: ["facility_name", "contact_name", "sender_name", "company_name", "phone_number"],
    performance: { sent: 245, opened: 172, responded: 45, converted: 12 },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    isActive: true,
    tags: ["introduction", "snf", "partnership"],
  },
  {
    id: "2",
    name: "Follow-up SMS",
    type: "sms",
    content:
      "Hi {{contact_name}}, following up on our homecare partnership discussion. Quick 5-min call this week? Reply YES for scheduling. - {{sender_name}}",
    variables: ["contact_name", "sender_name"],
    performance: { sent: 89, opened: 89, responded: 23, converted: 7 },
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
    isActive: true,
    tags: ["followup", "sms", "scheduling"],
  },
  {
    id: "3",
    name: "Phone Script - Initial Contact",
    type: "phone",
    content: `Hello, this is {{caller_name}} from {{company_name}}. I'm calling to discuss how our homecare services can support {{facility_name}}'s discharge planning.

OPENING:
- Is this a good time to talk for just 2-3 minutes?
- I understand you work with discharge planning at {{facility_name}}

VALUE PROPOSITION:
- We specialize in seamless transitions from your facility to home
- Our skilled nurses are available 24/7 for any concerns
- We provide detailed progress reports back to your team

OBJECTION HANDLING:
If "We already have providers":
- That's great! We often work as a backup or for specialized cases like wound care

If "Not interested":
- I understand. Could I send you our quick reference guide for future needs?

CLOSE:
- Would you be open to a brief 10-minute meeting next week?
- What's the best way to follow up with you?

NEXT STEPS:
- Schedule meeting or send information
- Get best contact method
- Thank them for their time`,
    variables: ["caller_name", "company_name", "facility_name"],
    performance: { sent: 156, opened: 0, responded: 67, converted: 18 },
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-12T00:00:00Z",
    isActive: true,
    tags: ["phone", "script", "initial"],
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const isActive = searchParams.get("active")
    const tags = searchParams.get("tags")?.split(",")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredTemplates = mockTemplates

    // Filter by type
    if (type && type !== "all") {
      filteredTemplates = filteredTemplates.filter((template) => template.type === type)
    }

    // Filter by active status
    if (isActive !== null) {
      filteredTemplates = filteredTemplates.filter((template) => template.isActive === (isActive === "true"))
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      filteredTemplates = filteredTemplates.filter((template) => tags.some((tag) => template.tags.includes(tag)))
    }

    // Pagination
    const paginatedTemplates = filteredTemplates.slice(offset, offset + limit)

    return NextResponse.json({
      templates: paginatedTemplates,
      total: filteredTemplates.length,
      hasMore: offset + limit < filteredTemplates.length,
    })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["name", "type", "content"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Extract variables from content
    const variableRegex = /\{\{(\w+)\}\}/g
    const variables: string[] = []
    let match
    while ((match = variableRegex.exec(body.content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    // Create new template
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: body.name,
      type: body.type,
      subject: body.subject,
      content: body.content,
      variables,
      performance: { sent: 0, opened: 0, responded: 0, converted: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: body.isActive !== false,
      tags: body.tags || [],
    }

    // In a real app, save to database
    mockTemplates.push(newTemplate)

    return NextResponse.json(
      {
        template: newTemplate,
        message: "Template created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    // Find and update template
    const templateIndex = mockTemplates.findIndex((t) => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Re-extract variables if content changed
    if (updates.content) {
      const variableRegex = /\{\{(\w+)\}\}/g
      const variables: string[] = []
      let match
      while ((match = variableRegex.exec(updates.content)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1])
        }
      }
      updates.variables = variables
    }

    mockTemplates[templateIndex] = {
      ...mockTemplates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      template: mockTemplates[templateIndex],
      message: "Template updated successfully",
    })
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }

    // Find and delete template
    const templateIndex = mockTemplates.findIndex((t) => t.id === id)
    if (templateIndex === -1) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    mockTemplates.splice(templateIndex, 1)

    return NextResponse.json({
      message: "Template deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
