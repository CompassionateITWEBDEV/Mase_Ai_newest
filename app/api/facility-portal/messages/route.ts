import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Mock messages
  const messages = [
    {
      id: "MSG-001",
      from: "M.A.S.E. Intake Team",
      to: "Mercy Hospital",
      subject: "Referral REF-002 - Additional Information Needed",
      content: "We need the latest physician orders for patient M.J. Please upload when available.",
      timestamp: new Date().toISOString(),
      read: false,
      type: "message",
    },
    {
      id: "MSG-002",
      from: "M.A.S.E. DME Team",
      to: "Mercy Hospital",
      subject: "DME Order Approved and Shipped",
      content: "Your DME order for patient M.J. has been approved and shipped. Tracking: PARACHUTE12345678",
      timestamp: new Date().toISOString(),
      read: false,
      type: "notification",
    },
  ]

  return NextResponse.json(messages)
}

export async function POST(request: NextRequest) {
  try {
    const messageData = await request.json()

    const response = {
      id: `MSG-${Date.now()}`,
      status: "sent",
      message: "Message sent successfully to M.A.S.E. team",
      deliveryTime: new Date().toISOString(),
      readReceipt: false,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
