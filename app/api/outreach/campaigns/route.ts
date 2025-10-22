import { type NextRequest, NextResponse } from "next/server"

interface Campaign {
  id: string
  name: string
  type: "email" | "sms" | "phone" | "multi-channel"
  status: "draft" | "active" | "paused" | "completed"
  targetFacilities: number
  sent: number
  opened: number
  responded: number
  converted: number
  createdAt: string
  lastRun: string
  nextRun: string
  budget: number
  spent: number
  roi: number
  templates: string[]
  automationRules: string[]
  targetCriteria: {
    facilityTypes: string[]
    locations: string[]
    priority: string[]
  }
}

// Mock data - replace with actual database operations
const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "SNF Onboarding Campaign",
    type: "multi-channel",
    status: "active",
    targetFacilities: 150,
    sent: 120,
    opened: 84,
    responded: 23,
    converted: 8,
    createdAt: "2024-01-15T00:00:00Z",
    lastRun: "2024-01-20T10:00:00Z",
    nextRun: "2024-01-21T10:00:00Z",
    budget: 5000,
    spent: 2340,
    roi: 340,
    templates: ["email-intro", "sms-followup", "phone-script"],
    automationRules: ["auto-followup", "escalate-phone"],
    targetCriteria: {
      facilityTypes: ["SNF"],
      locations: ["Michigan", "Ohio"],
      priority: ["high", "medium"],
    },
  },
  {
    id: "2",
    name: "Hospital Partnership Outreach",
    type: "email",
    status: "active",
    targetFacilities: 75,
    sent: 75,
    opened: 52,
    responded: 15,
    converted: 4,
    createdAt: "2024-01-10T00:00:00Z",
    lastRun: "2024-01-19T14:00:00Z",
    nextRun: "2024-01-22T14:00:00Z",
    budget: 3000,
    spent: 1200,
    roi: 180,
    templates: ["hospital-intro", "partnership-proposal"],
    automationRules: ["auto-followup"],
    targetCriteria: {
      facilityTypes: ["Hospital"],
      locations: ["Michigan"],
      priority: ["high"],
    },
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredCampaigns = mockCampaigns

    // Filter by status
    if (status && status !== "all") {
      filteredCampaigns = filteredCampaigns.filter((campaign) => campaign.status === status)
    }

    // Filter by type
    if (type && type !== "all") {
      filteredCampaigns = filteredCampaigns.filter((campaign) => campaign.type === type)
    }

    // Pagination
    const paginatedCampaigns = filteredCampaigns.slice(offset, offset + limit)

    return NextResponse.json({
      campaigns: paginatedCampaigns,
      total: filteredCampaigns.length,
      hasMore: offset + limit < filteredCampaigns.length,
    })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["name", "type", "targetFacilities", "budget"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create new campaign
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: body.name,
      type: body.type,
      status: "draft",
      targetFacilities: body.targetFacilities,
      sent: 0,
      opened: 0,
      responded: 0,
      converted: 0,
      createdAt: new Date().toISOString(),
      lastRun: "",
      nextRun: "",
      budget: body.budget,
      spent: 0,
      roi: 0,
      templates: body.templates || [],
      automationRules: body.automationRules || [],
      targetCriteria: body.targetCriteria || {
        facilityTypes: [],
        locations: [],
        priority: [],
      },
    }

    // In a real app, save to database
    mockCampaigns.push(newCampaign)

    return NextResponse.json(
      {
        campaign: newCampaign,
        message: "Campaign created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 })
    }

    // Find and update campaign
    const campaignIndex = mockCampaigns.findIndex((c) => c.id === id)
    if (campaignIndex === -1) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    mockCampaigns[campaignIndex] = {
      ...mockCampaigns[campaignIndex],
      ...updates,
    }

    return NextResponse.json({
      campaign: mockCampaigns[campaignIndex],
      message: "Campaign updated successfully",
    })
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 })
    }

    // Find and delete campaign
    const campaignIndex = mockCampaigns.findIndex((c) => c.id === id)
    if (campaignIndex === -1) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    mockCampaigns.splice(campaignIndex, 1)

    return NextResponse.json({
      message: "Campaign deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting campaign:", error)
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 })
  }
}
