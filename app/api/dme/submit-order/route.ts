import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { order, patientId, supplier } = await request.json()

    // Simulate API call to DME supplier
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock response based on supplier
    const response = {
      success: true,
      orderId: order.id,
      trackingNumber: `${supplier.replace(" ", "").toUpperCase()}${Math.random().toString().substr(2, 8)}`,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days from now
      status: "approved",
      message: `Order successfully submitted to ${supplier}`,
      processingTime: supplier === "Parachute Health" ? "2-3 hours" : "1-2 hours",
    }

    // Log the order submission
    console.log(`DME Order submitted to ${supplier}:`, {
      orderId: order.id,
      patientId,
      items: order.items.length,
      totalCost: order.totalCost,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("DME order submission error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit DME order",
      },
      { status: 500 },
    )
  }
}
