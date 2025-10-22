import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    // Simulate processing with Parachute Health or Verse Medical
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const supplier = orderData.supplier || "parachute"
    const orderId = `DME-${supplier.toUpperCase()}-${Date.now()}`

    const response = {
      orderId,
      status: "approved",
      supplier: supplier === "parachute" ? "Parachute Health" : "Verse Medical",
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      trackingNumber: `${supplier.toUpperCase()}${Math.random().toString().substr(2, 8)}`,
      message: `DME order approved and processed through ${supplier === "parachute" ? "Parachute Health" : "Verse Medical"}`,
      items: orderData.items,
      totalCost: orderData.items.reduce((sum: number, item: any) => sum + item.quantity * 25, 0), // Mock pricing
      insuranceCoverage: "90%",
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: "Failed to process DME order" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const referralId = searchParams.get("referralId")

  // Mock DME orders
  const orders = [
    {
      id: "DME-PARACHUTE-001",
      referralId: "REF-002",
      status: "shipped",
      supplier: "Parachute Health",
      orderDate: "2024-01-16",
      estimatedDelivery: "2024-01-19",
      trackingNumber: "PARACHUTE12345678",
      items: [
        { name: "Wound Care Dressings", quantity: 30, category: "wound_care" },
        { name: "Blood Glucose Monitor", quantity: 1, category: "diabetic" },
      ],
    },
  ]

  const filteredOrders = referralId ? orders.filter((order) => order.referralId === referralId) : orders

  return NextResponse.json(filteredOrders)
}
